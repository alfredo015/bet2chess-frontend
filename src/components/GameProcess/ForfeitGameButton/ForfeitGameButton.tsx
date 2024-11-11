import React, { useContext, useState } from "react";
import { Button } from "@chakra-ui/react";
import { useSailsCalls } from "@/app/hooks";
import { useAppSelector } from "@/app/hooks";
import { dAppContext } from "@/context";
import { useAccount, useAlert } from "@gear-js/react-hooks";
import { decodeAddress, HexString } from "@gear-js/api";
import { addTokensToVoucher, renewVoucher } from "@/app/utils";
import { Codec, CodecClass, Signer } from "@polkadot/types/types";
import { web3FromSource } from "@polkadot/extension-dapp";
import CryptoJs from 'crypto-js';

import axios from "axios";
import { SignlessForm } from "@/components/SignlessForm/SignlessForm";

interface ForfeitProps {
	onGameFinished: () => void;
	gameId: string;
	userId: string;
	otherPlayerId: string;
	otherPlayerAddress: HexString | null
}

export const  ForfeitGameButton: React.FC<ForfeitProps> = ({
	onGameFinished,
	gameId,
	userId,
	otherPlayerId,
	otherPlayerAddress
}) => {
	const sails = useSailsCalls();
	const alert = useAlert();
	const { account } = useAccount();
	const { 
		currentVoucherId,
		signlessAccount, 
		noWalletSignlessAccountName,
		setCurrentVoucherId,
		setSignlessAccount,
		setNoWalletSignlessAccountName
	} = useContext(dAppContext);

	const currentUserAddress = useAppSelector(state => state.UserGameData.userAddress);
	const polkadotAccountIsEnable = useAppSelector((state) => state.AccountsSettings.polkadotEnable);
	const gaslessIsSelected = useAppSelector((state) => state.AccountsSettings.gaslessIsActive);

	const [userFillingTheForm, setUserFillingTheForm] = useState(false);

	const closeGame = async () => {
		await axios.get(`https://vchess.pythonanywhere.com/endgame/${gameId}/${otherPlayerId}/${userId}/2`);
	}

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
			'Bet2Chess/EndGameById',
			{
			  userAddress: account.decodedAddress,
			  signer: (signer as CodecClass<Codec, any[]>) as Signer
			},
			{
			  voucherId: voucherIdToUse,
			  callArguments: [ 
				gameId,
				otherPlayerAddress
			],
			  callbacks: {
				onLoad() { alert.info('Will send message') },
				onSuccess() {
				  alert.success('Message send with voucher!')
				  
				},
				onBlock(blockHash) {
				  alert.info(`Message is in block: ${blockHash}`);
				  
				},
				onError() {
				  alert.error('Failed while sending message with voucher')
				  
				}
			  }
			}
		  );

		  await closeGame();
		  onGameFinished();
		} catch (e) {
			alert.error('Error while sending message');
		}
	}

	const handleClick = async () => {
		if (!sails) {
			alert.error('SailsCalls is not ready!');
			return;
		}

		if (polkadotAccountIsEnable) {
			if (!gaslessIsSelected) {
			  if (!signlessAccount || !currentVoucherId || !currentUserAddress) {
				setUserFillingTheForm(true);
				return;
			  }
	  
			  await manageVoucherId(currentVoucherId, signlessAccount.address);
	  
			  const response = await sails.command(
				'Bet2Chess/EndGameById',
				signlessAccount,
				{
				  voucherId: currentVoucherId,
				  callArguments: [ 
					gameId,
					otherPlayerAddress
				  ],
				  callbacks: {
					onLoad() { alert.info('Will send a message') },
					onSuccess() { alert.success('Message send with signless account') },
					onBlock(blockHash) { alert.success(`Block hask: ${blockHash}`) },
					onError() { alert.error('Error while sending message') }
				  }
				}
			  );

			  await closeGame();
			  onGameFinished();
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
	  
			await manageVoucherId(currentVoucherId, signlessAccount.address)
	  
			const response = await sails.command(
			  'Bet2Chess/EndGameById',
			  signlessAccount,
			  {
				voucherId: currentVoucherId,
				callArguments: [
				  gameId,
				  otherPlayerAddress
				],
				callbacks: {
				  onLoad() { alert.info('Will send a message') },
				  onSuccess() { alert.success('Message was send!') },
				  onBlock(blockHash) { alert.success(`Message in block: ${blockHash}`) },
				  onError() { alert.error('Error while sending message') }
				}
			  }
			);

			await closeGame();
			onGameFinished();
		}
	};

	return (
		<>
			<Button onClick={handleClick}> Forfeit game</Button>
			{ 
				userFillingTheForm &&
				<SignlessForm 
				closeForm={() => setUserFillingTheForm(false)}
				/>
			}
		</>
	);
};