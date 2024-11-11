import React, { useContext, useState } from "react";
import { Button } from "@chakra-ui/react";
import { decodeAddress, HexString } from "@gear-js/api";
import { useAppSelector, useSailsCalls } from "@/app/hooks";
import { useAccount, useAlert, useApi, useBalance, useBalanceFormat } from "@gear-js/react-hooks";
import { addTokensToVoucher, renewVoucher } from "@/app/utils";
import { dAppContext } from "@/context";
import { web3FromSource } from "@polkadot/extension-dapp";
import { Codec, CodecClass, Signer } from "@polkadot/types/types";
import { SignlessForm } from "@/components/SignlessForm/SignlessForm";
import CryptoJs from 'crypto-js';
import axios from "axios";

interface Props {
	invitation_id: string;
	userInvitationWeb2Id: string;
	ownWeb2Id: string;
	usernameFromUserWhoInvite: string;
	betAmount: string;
}

export const AcceptButton: React.FC<Props> = ({
	invitation_id,
	userInvitationWeb2Id,
	ownWeb2Id,
	usernameFromUserWhoInvite,
	betAmount
}) => {
	const sails = useSailsCalls();
	const alert = useAlert();
	const currentUserAddress = useAppSelector(state => state.UserGameData.userAddress);
	const { isApiReady } = useApi();
	const { account } = useAccount();
	const { balance } = useBalance(currentUserAddress != null ? currentUserAddress : undefined);
	const { getFormattedBalance } = useBalanceFormat();
	const formattedBalance = isApiReady && balance ? getFormattedBalance(balance) : undefined;

	const { 
		currentVoucherId,
		signlessAccount, 
		noWalletSignlessAccountName,
		setCurrentVoucherId,
	} = useContext(dAppContext);

	const currentUserName = useAppSelector(state => state.UserGameData.userName);
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

		const balance = formattedBalance
		? formattedBalance.value
			.split(',')
			.join('')
			.split('.')[0]
		: 0

		if (Number(betAmount) != 0 && Number(balance) - 5 < Number(betAmount)) {
			alert.error('insufficient funds');
			return;
		}

		const web2GameId = await acceptInvitation();
	
		try {
		  const response = await sails.command(
			'Bet2Chess/AcceptInvitation',
			{
				userAddress: account.decodedAddress,
				signer: (signer as CodecClass<Codec, any[]>) as Signer
			},
			{
				tokensToSend: BigInt(betAmount) * 1_000_000_000_000n,
				voucherId: voucherIdToUse,
				callArguments: [ 
					ownWeb2Id,
					userInvitationWeb2Id,
					web2GameId,
					usernameFromUserWhoInvite,
					currentUserName
				],
				callbacks: {
					onLoad() { alert.info('Will send message') },
					onSuccess() { alert.success('Message send with voucher!') },
					onBlock(blockHash) { alert.info(`Message is in block: ${blockHash}`); },
					onErrorAsync() {
						return new Promise(async resolve => {
							alert.error('Failed while sending message with voucher')
							await axios.get(`https://vchess.pythonanywhere.com/endgame/${web2GameId}/${userInvitationWeb2Id}/${ownWeb2Id}/2`);
							await axios.get(`https://vchess.pythonanywhere.com/invite?player_id_from=${userInvitationWeb2Id}&player_id_to=${ownWeb2Id}`);
							resolve();
						});
					}
				}
			}
		  );
	
		  if (Object.keys(response)[0] == 'error') {
			await axios.get(`https://vchess.pythonanywhere.com/endgame/${web2GameId}/${userInvitationWeb2Id}/${ownWeb2Id}/2`);
			alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
			alert.info('Invitation deleted');
		}

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

				if (betAmount != "0") {
					alert.error('Only normal sessions or with gasless sessions can accept match with bets');
					return;
				}

				// se verifica el estado del voucher
				await manageVoucherId(currentVoucherId, signlessAccount.address);

				const web2GameId = await acceptInvitation();
				
				const response = await sails.command(
					'Bet2Chess/AcceptInvitationSignless',
					signlessAccount,
					{
						voucherId: currentVoucherId,
						callArguments: [ 
							account.decodedAddress,
							ownWeb2Id,
							userInvitationWeb2Id,
							web2GameId,
							usernameFromUserWhoInvite,
							currentUserName
						],
						callbacks: {
							onLoad() { alert.info('Will send a message') },
							onSuccess() { alert.success('Message send with signless account'); },
							onBlock(blockHash) { alert.success(`Block hask: ${blockHash}`) },
							onError() { 
								alert.error('Error while sending message');
								axios.get(`https://vchess.pythonanywhere.com/endgame/${web2GameId}/${userInvitationWeb2Id}/${ownWeb2Id}/2`);
								alert.info('Invitation deleted');
							}
						}
					}
				);

				if (Object.keys(response)[0] == 'error') {
					await axios.get(`https://vchess.pythonanywhere.com/endgame/${web2GameId}/${userInvitationWeb2Id}/${ownWeb2Id}/2`);
					alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
					alert.info('Invitation deleted');
					return;
				}

				acceptInvitation();
			} else {
			// using wallet voucher session.
				await signer();
			}
		} else {
			if (!signlessAccount || !currentVoucherId || !noWalletSignlessAccountName) {
				setUserFillingTheForm(true);
				return;
			}

			if (betAmount != "0") {
				alert.error('Only normal sessions or with gasless sessions can accept match with bets');
				return;
			}
		
			const codedName = CryptoJs.SHA256(noWalletSignlessAccountName).toString();
		
			await manageVoucherId(currentVoucherId, signlessAccount.address);

			const web2GameId = await acceptInvitation();
		
			const response = await sails.command(
				'Bet2Chess/AcceptInvitationSignlessNoWallet',
				signlessAccount,
				{
					voucherId: currentVoucherId,
					callArguments: [
						codedName,
						ownWeb2Id,
						userInvitationWeb2Id,
						web2GameId,
						usernameFromUserWhoInvite,
						currentUserName
					],
					callbacks: {
						onLoad() { alert.info('Will send a message') },
						onSuccess() { alert.success('Message was send!') },
						onBlock(blockHash) { alert.success(`Message in block: ${blockHash}`) },
						onError() { 
							alert.error('Error while sending message')
							axios.get(`https://vchess.pythonanywhere.com/endgame/${web2GameId}/${userInvitationWeb2Id}/${ownWeb2Id}/2`);
							alert.info('Invitation deleted');
						}
					}
				}
			);

			if (Object.keys(response)[0] == 'error') {
				await axios.get(`https://vchess.pythonanywhere.com/endgame/${web2GameId}/${userInvitationWeb2Id}/${ownWeb2Id}/2`);
				alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
				alert.info('Invitation deleted');
			}
		}
	}

	const acceptInvitation = async (): Promise<string> => {
		return new Promise(async (resolve, reject) => {
			let matchWeb2Id = null;

			try {
				const response = await axios.get(`https://vchess.pythonanywhere.com/acceptdeclineinvitation/${invitation_id}/1`);
				matchWeb2Id = response.data;
				console.log(matchWeb2Id);
				resolve(matchWeb2Id);
			} catch(e) {
				console.error('No pues hubo un errorrrr!!!');
				console.log(matchWeb2Id);
				reject("Error while accepting invitation");
			}
		});
	};

	return (
		<>
			<Button onClick={handleClick} colorScheme="teal">
				Accept
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
