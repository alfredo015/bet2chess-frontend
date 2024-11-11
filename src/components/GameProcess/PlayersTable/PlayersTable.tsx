import React, { useContext, useEffect, useState } from "react";
import {
	TableContainer,
	Table,
	Thead,
	Tr,
	Th,
	Tbody,
	Td,
	Button,
} from "@chakra-ui/react";
import { useAppSelector, useSailsCalls } from "@/app/hooks";
import { decodeAddress, HexString } from "@gear-js/api";
import { addTokensToVoucher, renewVoucher } from "@/app/utils";
import { useAccount, useAlert, useApi, useBalance, useBalanceFormat } from "@gear-js/react-hooks";
import { dAppContext } from "@/context";
import { web3FromSource } from "@polkadot/extension-dapp";
import { Codec, CodecClass, Signer } from "@polkadot/types/types";
import { SignlessForm } from "@/components/SignlessForm/SignlessForm";
import { NewGameBetModal } from "../NewGameBetModal/NewGameBetModal";
import CryptoJs from 'crypto-js';

interface ShowAvailablePlayersProps {
	players: string[][];
	parentSelectPlayer: (arg1: string) => void;
}

// const ShowAvailablePlayers: React.FC<ShowAvailablePlayersProps> = ({
export const PlayersTable: React.FC<ShowAvailablePlayersProps> = ({
	players,
	parentSelectPlayer,
}) => {
	const sails = useSailsCalls();
	const alert = useAlert();
	const currentUserAddress = useAppSelector(state => state.UserGameData.userAddress);
	const currentUserWeb2Id = useAppSelector(state => state.UserGameData.userId);
	const polkadotAccountIsEnable = useAppSelector((state) => state.AccountsSettings.polkadotEnable);
	const gaslessIsSelected = useAppSelector((state) => state.AccountsSettings.gaslessIsActive);

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

	const [userFillingTheForm, setUserFillingTheForm] = useState(false);
	const [userMakingBet, setUserMakingBet] = useState(false);
	const [maxToBet, setMaxToBet] = useState(0);
	const [userSelected, setUserSelected] = useState<string | null>(null);
	const [userNameSelected, setUserNameSelected] = useState('');

	useEffect(() => {
		if (polkadotAccountIsEnable && gaslessIsSelected) {
			const balance = formattedBalance
				? formattedBalance.value
					.split(',')
					.join('')
					.split('.')[0]
				: 0;

			const maxBalanceToBet = Number(balance) > 5 ? Number(balance) - 5 : 0;
			
			setMaxToBet(maxBalanceToBet);
			return;
		}

		setMaxToBet(0);
	}, [polkadotAccountIsEnable, gaslessIsSelected, account, balance, formattedBalance]);

	const disableButton = (val: string): boolean => {
		if (val === "AVAILABLE") {
			return false;
		} else {
			return true;
		}
	};

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

	const signer = async (userIdToInvite: string, betAmount: number) => {
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
			'Bet2Chess/SendInvitation',
			{
				userAddress: account.decodedAddress,
				signer: (signer as CodecClass<Codec, any[]>) as Signer
			},
			{
				voucherId: voucherIdToUse,
				tokensToSend: BigInt(betAmount) * 1_000_000_000_000n,
				callArguments: [ 
					currentUserWeb2Id,
					userIdToInvite 
				],
				callbacks: {
				onLoad() { alert.info('Will send message') },
				onSuccess() { alert.success('Message send with voucher!') },
				onBlock(blockHash) { alert.info(`Message is in block: ${blockHash}`); },
				onError() { alert.error('Failed while sending message with voucher'); }
				}
			}
		  );
	
		  if (Object.keys(response)[0] == 'error') {
			alert.error(`Error while inviting user:, ${JSON.stringify(response.error)}`);
			return;
		  }

		  parentSelectPlayer(userIdToInvite);
		} catch (e) {
			alert.error('Error while sending message');
		}
	}

	const 	handleClick = async (useNameSelected: string, userIdToInvite: string, betAmount: number) => {
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
					'Bet2Chess/SendInvitationSignless',
					signlessAccount,
					{
						voucherId: currentVoucherId,
						callArguments: [ 
							account.decodedAddress,
							currentUserWeb2Id,
							userIdToInvite
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

				parentSelectPlayer(userIdToInvite);
			} else {
			// using wallet voucher session.
				await signer(userIdToInvite, betAmount);
			}
		} else {
			if (!signlessAccount || !currentVoucherId || !noWalletSignlessAccountName) {
				setUserFillingTheForm(true);
				return;
			}
		
			const codedName = CryptoJs.SHA256(noWalletSignlessAccountName).toString();
		
			await manageVoucherId(currentVoucherId, signlessAccount.address);
		
			const response = await sails.command(
				'Bet2Chess/SendInvitationSignlessNoWallet',
				signlessAccount,
				{
					voucherId: currentVoucherId,
					callArguments: [
						codedName,
						currentUserWeb2Id,
						userIdToInvite
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

			parentSelectPlayer(userIdToInvite);
		}
	}
	
	return (
		<>
			<TableContainer>
				<Table variant="simple">
					<Thead>
						<Tr>
							<Th style={{ color: 'white' }}>Invite</Th>
							<Th style={{ color: 'white' }}>ID </Th>
							<Th style={{ color: 'white' }}>STATUS </Th>
						</Tr>
					</Thead>
					<Tbody>
						{players.map((item, index) => (
							<Tr key={index}>
								<Td>
									<Button
										isDisabled={disableButton(item[3])}
										onClick={() => {
											if (!polkadotAccountIsEnable && !signlessAccount) {
												alert.error('Sign in to send an invitation');
												return;
											}
											setUserSelected(item[2]);
											setUserNameSelected(item[0]);

											if (polkadotAccountIsEnable && !gaslessIsSelected && !signlessAccount) {
												setUserFillingTheForm(true);
												return;
											}

											setUserMakingBet(true);
										}}
									>
										{item[0]}
									</Button> 
								</Td>
								<Td>{item[2]}</Td>
								<Td>{item[3]}</Td>
							</Tr>
						))}
					</Tbody>
				</Table>
			</TableContainer>
			{ 
				userFillingTheForm &&
				<SignlessForm 
					closeForm={() => setUserFillingTheForm(false)}
				/>
			}
			{
				userMakingBet && (
					<NewGameBetModal
						maxBetValue={maxToBet}
						onConfirmBet={(betAmount) => {
							handleClick(userNameSelected, userSelected as string, betAmount);
						}}
						closeModal={() => setUserMakingBet(false)}
					/>
				)
			}
		</>
	);
};
