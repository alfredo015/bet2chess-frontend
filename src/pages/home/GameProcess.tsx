import { useState } from "react";
import { useEffect } from "react";
import { GamesInProgress } from "@/components";
import { useAppSelector } from "@/app/hooks";
import { SignlessForm } from "@/components/SignlessForm/SignlessForm";
import { KeyringPair } from "@polkadot/keyring/types";
import { decodeAddress } from "@gear-js/api";
import { useAlert } from "@gear-js/react-hooks";
import { useDappContext } from "@/context/dappContext";
import { useSailsCalls } from "@/app/hooks";
import axios from "axios";

import { 
    GameStatus, 
    MyInvitations,
    MySentInvitations,
    PlayersTable
} from "@/components/GameProcess";
import { useNavigate } from "react-router-dom";

export type GameStatus = '';

const GameProcess = () => {
	const alert = useAlert();
	const sails = useSailsCalls();
	const navigate = useNavigate();
	const currentUserId = useAppSelector(state => state.UserGameData.userId);
	const currentUserName = useAppSelector(state => state.UserGameData.userName);
	const currentUserAddress = useAppSelector(state => state.UserGameData.userAddress);
	const {
		setSignlessAccount,
		setNoWalletSignlessAccountName,
		setCurrentVoucherId,
	} = useDappContext();

	const [signlessModalIsOpen, setsignlessModalIsOpen] = useState(false);
	const [players, setPlayers] = useState<string[][] | null>(null);
	const [showInvitations, setShowInvitations] = useState(false);
	const [ playersListIntervalId, setPlayersListIntervalId ] = useState<NodeJS.Timer | null>(null);

	useEffect(() => {
		console.log('Si se ejecuto esta parte del inicio de bet2chess');
		
		if (!currentUserAddress) {
			setShowInvitations(false);
			return;
		}

		if (playersListIntervalId) {
			clearInterval(playersListIntervalId);
		}

		const checkUserIsInGame = async () => {
			// Check if the current user is in a match
			const response = await axios.get(`https://vchess.pythonanywhere.com/checkifingame/${currentUserId}`);
			const data = response.data;

			if (data.length === 0) {
				// The array is empty, so the user is not in a match
				const intervalId = setInterval(async () => {
					const response = await axios.get(`https://vchess.pythonanywhere.com/listplayers`);
					const listOfPlayers = response.data;

					let listPlayers: string[][] = [];
					listOfPlayers.forEach((elem: string[]) => {
						if (elem[0] !== currentUserName) {
							listPlayers.push(elem);
						}
					});

					setPlayers(listPlayers);
				}, 1500);
				
				setPlayersListIntervalId(intervalId);
				setShowInvitations(true);
				return;
			}

			// The last attribute is to set if the user is a viewer or not
			// const matchData = [...data, currentUserName, '', true];

			// Id 8 is white player and id 9 is black player
			const matchData = data[8] === currentUserId
				? [...data, currentUserName, '', true, currentUserId, data[9]]
				: [...data, '', currentUserName, true, currentUserId, data[8]];

			setShowInvitations(false);

			// The user is in a match, redirect to the user match
			navigate(`game/${data[0]}?data=${encodeURIComponent(JSON.stringify(matchData))}`);
		}

		checkUserIsInGame();
	}, [currentUserAddress]);

 	const selectPlayer = async (player_id: string) => {
		const x = await axios.get(`https://vchess.pythonanywhere.com/invite?player_id_from=${currentUserId}&player_id_to=${player_id}`);
	};

	const manageSignlessAccount = (
		signlessAccount: KeyringPair,
		encryptedName: string | null
	): Promise<void> => {
		return new Promise(async (resolve) => {
			if (setSignlessAccount) setSignlessAccount(signlessAccount);
			if (setNoWalletSignlessAccountName)
				setNoWalletSignlessAccountName(
					encryptedName ?? "no-wallet-singless-name"
				);

			if (!sails) {
				return;				
			}

			try {
				const signlessVoucherId = await sails.vouchersInContract(
					decodeAddress(signlessAccount.address)
				);
				setCurrentVoucherId(signlessVoucherId[0]);
			} catch (e) {
				alert.error("Error while setting signless account voucher id");
			}

			const signlessAddress = decodeAddress(signlessAccount.address);

			const serverResponse = await fetch(
				`https://vchess.pythonanywhere.com/loginplayer?name=${encryptedName}&account=${signlessAddress}`
			);

			resolve();
		});
	};

	return (
		<>
			{
				players && (
					<PlayersTable
						players={players}
						parentSelectPlayer={selectPlayer}
					/>
				)
			}
			{
				showInvitations && (
					<>
						<MySentInvitations />
						<MyInvitations />
					</>
					
				)
			}

			<GamesInProgress />

			{
				signlessModalIsOpen && (
					<SignlessForm
						closeForm={() => setsignlessModalIsOpen(false)}
						onDataCollected={manageSignlessAccount}
					/>
				)
			}
		</>
	);
};

export { GameProcess };
