import React, { useContext, useState } from "react";
import { Button } from "@chakra-ui/react";
import { decodeAddress, HexString } from "@gear-js/api";
import { useAppSelector, useSailsCalls } from "@/app/hooks";
import { useAccount, useAlert } from "@gear-js/react-hooks";
import { addTokensToVoucher, renewVoucher } from "@/app/utils";
import { dAppContext } from "@/context";
import { web3FromSource } from "@polkadot/extension-dapp";
import { Codec, CodecClass, Signer } from "@polkadot/types/types";
import { SignlessForm } from "@/components/SignlessForm/SignlessForm";
import CryptoJs from 'crypto-js';

interface CancelProps {
	invitation_id: string;
	ownWeb2Id: string;
	guestWeb2Id: string;
}

export const CancelButton: React.FC<CancelProps> = ({
	invitation_id,
	ownWeb2Id,
	guestWeb2Id
}) => {
	const sails = useSailsCalls();
	const alert = useAlert();
	const { account } = useAccount();
	const { 
		currentVoucherId,
		signlessAccount, 
		noWalletSignlessAccountName,
		setCurrentVoucherId,
	} = useContext(dAppContext);

	const currentUserAddress = useAppSelector(state => state.UserGameData.userAddress);
	const polkadotAccountIsEnable = useAppSelector((state) => state.AccountsSettings.polkadotEnable);
	const gaslessIsSelected = useAppSelector((state) => state.AccountsSettings.gaslessIsActive);

	const [userFillingTheForm, setUserFillingTheForm] = useState(false);


	const manageVoucherId = async (voucherId: HexString, userAddress: string): Promise<void> => {
		return new Promise(async (resolve, reject) => {
		  if (!sails) {
			alert.error('SailsCalls is not ready');
			reject('SailsCalls is not ready');
			return;
		  }
	
		  try {
			await addTokensToVoucher(
			  sails,
			  decodeAddress(userAddress),
			  voucherId,//currentVoucherId,
			  1,
			  2,
			  {
				onLoad() { alert.info('Will add tokens to voucher') },
				onSuccess() { alert.success('Tokens added to voucher') },
				onError() { alert.error('Error while adding tokens to voucher') }
			  }
			);
	
			await renewVoucher(
			  sails,
			  decodeAddress(userAddress),
			  voucherId,// currentVoucherId,
			  1_200, // One hour
			  {
				onLoad() { alert.info('Will renew voucher') },
				onSuccess() { alert.success('Voucher renewed') },
				onError() { alert.error('Error while renewing voucher') }
			  }
			);
	
			resolve();
		  } catch (e) {
			console.error(e);
			reject('Error while updating voucher');
		  }
		});
	}

	const signer = async () => {
		if (!sails) {
		  alert.error('SailsCalls is not ready');
		  return;
		}
	
		if (!account) {
		  alert.error('Account is not ready!');
		  return;
		}
	
		let voucherIdToUse;
		
		if (!currentVoucherId) {
			const vouchersForAddress = await sails.vouchersInContract(account.decodedAddress);
	
			if (vouchersForAddress.length === 0) {
				voucherIdToUse = await sails.createVoucher(
				  account.decodedAddress,
				  2, // Two initial tokens
				  1_200, // One hour
				  {
					onLoad() { alert.info('Will create a voucher') },
					onSuccess() { alert.success('Voucher created!') },
					onError() { alert.error('Error while creating voucher') }
				  }
				);
			} else {
				voucherIdToUse = vouchersForAddress[0];
	
				if (setCurrentVoucherId) setCurrentVoucherId(voucherIdToUse);
	
				await manageVoucherId(voucherIdToUse, account.address);
			}
		} else {
			await manageVoucherId(currentVoucherId, account.address);
			voucherIdToUse = currentVoucherId;
		}
	
		const { signer } = await web3FromSource(account.meta.source);
	
		try {
		  const response = await sails.command(
			'Bet2Chess/CancelInvitation',
			{
				userAddress: account.decodedAddress,
				signer: (signer as CodecClass<Codec, any[]>) as Signer
			},
			{
				voucherId: voucherIdToUse,
				callArguments: [ 
					ownWeb2Id,
					guestWeb2Id 
				],
				callbacks: {
					onLoad() { alert.info('Will send message') },
					onSuccess() { alert.success('Message send with voucher!'); },
					onBlock(blockHash) { alert.info(`Message is in block: ${blockHash}`); },
					onError() { alert.error('Failed while sending message with voucher'); }
				}
			}
		  );

		  if (Object.keys(response)[0] == 'error') {
			alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
			return;
		}

		cancelInvitation();
		} catch (e) {
			alert.error('Error while sending message');
		}
	}

	const handleClick = async () => {
		if (!sails) {
		  alert.error('SailsCalls is not ready!');
		  return;
		}
	
		// Condicional para detectar si hay una wallet activa
		if (polkadotAccountIsEnable) {
			// Seguido, se checa si el usuario con wallet tiene activa la sesion 
			// signlessa
			if (!gaslessIsSelected) {
				// Sesion con signless usando wallet
				if (!account) {
					alert.error('Account is not ready');
					return;
				}

				// Si no se tienen los datos necesarios de la cuenta signless
				// se abre el formulario
				if (!signlessAccount || !currentVoucherId || !currentUserAddress) {
					setUserFillingTheForm(true);
					return;
				}

				// se verifica el estado del voucher
				await manageVoucherId(currentVoucherId, signlessAccount.address);
				
				const response = await sails.command(
					'Bet2Chess/CancelInvitationSignless',
					signlessAccount,
					{
						voucherId: currentVoucherId,
						callArguments: [ 
							account.decodedAddress,
							ownWeb2Id,
							guestWeb2Id
						],
						callbacks: {
							onLoad() { alert.info('Will send a message') },
							onSuccess() { alert.success('Message send with signless account'); },
							onBlock(blockHash) { alert.success(`Block hask: ${blockHash}`) },
							onError() { alert.error('Error while sending message') }
						}
					}
				);

				if (Object.keys(response)[0] == 'error') {
					alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
					return;
				}

				cancelInvitation();
			} else {
			// using wallet voucher session.
				await signer();
			}
		} else {
			if (!signlessAccount || !currentVoucherId || !noWalletSignlessAccountName) {
				setUserFillingTheForm(true);
				return;
			}
		
			const codedName = CryptoJs.SHA256(noWalletSignlessAccountName).toString();
		
			await manageVoucherId(currentVoucherId, signlessAccount.address);
		
			const response = await sails.command(
				'Bet2Chess/CancelInvitationSignlessNoWallet',
				signlessAccount,
				{
					voucherId: currentVoucherId,
					callArguments: [
						codedName,
						ownWeb2Id,
						guestWeb2Id
					],
					callbacks: {
						onLoad() { alert.info('Will send a message') },
						onSuccess() { alert.success('Message was send!') },
						onBlock(blockHash) { alert.success(`Message in block: ${blockHash}`) },
						onError() { alert.error('Error while sending message') }
					}
				}
			);
		
			if (Object.keys(response)[0] == 'error') {
				alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
				return;
			}

			cancelInvitation();
		}
	}

	const cancelInvitation = () => {
		console.log(
			"You want to cancel invitation with this id" + invitation_id
		);
		fetch(
			`https://vchess.pythonanywhere.com/acceptdeclineinvitation/${invitation_id}/0`
		)
			.then((response) => response.json())
			.then((data) => {
				console.log(
					"You tried to CANCEL your invitation, here is response: "
				);
				console.log(data);
			})
			.catch((error) => console.error(error));
	};

	return (
		<>
			<Button onClick={handleClick} colorScheme="red">
				Cancel
			</Button>
			{ 
				userFillingTheForm &&
				<SignlessForm 
					closeForm={() => setUserFillingTheForm(false)}
				/>
			}
		</>
	);
};
