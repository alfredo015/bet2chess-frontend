import React, { useEffect, useState } from "react";
import {
	Tr,
	Td,
	TableContainer,
	Table,
	Thead,
	Tbody,
	Th,
} from "@chakra-ui/react";
import { AcceptButton } from "../AcceptButton/AcceptButton";
import { DeclineButton } from "../DeclineButton/DeclineButton";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useSailsCalls } from "@/app/hooks";
import { useAlert } from "@gear-js/react-hooks";
import axios from "axios";

export const MyInvitations: React.FC = () => {
	const currentUserId = useAppSelector(state => state.UserGameData.userId);
	const currentUserName = useAppSelector(state => state.UserGameData.userName);
	const sails = useSailsCalls();
	const alert = useAlert();
	const navigate = useNavigate();
	const [myArray, setMyArray] = useState<string[][]>([]);

	useEffect(() => {
		if (!sails) {
			alert.error('SailsCalls is not ready');
			return;
		}

		const setInvitations = async () => {
			const response = await axios.get(`https://vchess.pythonanywhere.com/myinvitations/${currentUserId}`);
			const invitations = response.data as any[];

			const acceptedInvitation = invitations.find(value => value[5] === "ACCEPTED");

			if (acceptedInvitation) {
				const matchData = acceptedInvitation[8] === currentUserId
					? [...acceptedInvitation, currentUserName, acceptedInvitation[7], true, currentUserId, acceptedInvitation[9]]
					: [...acceptedInvitation, acceptedInvitation[7], currentUserName, true, currentUserId, acceptedInvitation[8]];

				// The user is in a match, redirect to the user match
				navigate(`game/${acceptedInvitation[6]}?data=${encodeURIComponent(JSON.stringify(matchData))}`);
			}

			const waitingInvitations = invitations.filter((data) => data[5] === "WAITING");

			for (const invitation of waitingInvitations) {
				const bet_amount = await sails.query(
					'Bet2Chess/InvitationBet',
					{
						callArguments: [
							invitation[1],
							invitation[2]
						]
					}
				);

				invitation[8] = bet_amount;
			}

			setMyArray(waitingInvitations);
		}

		const intervalId = setInterval(() => {
			setInvitations();
		}, 1500);
 
		return () => clearInterval(intervalId);
	}, [currentUserId, sails]);

	interface RowProp {
		item: string[];
		index: number
	}
	const Row: React.FC<RowProp> = ({ item, index }) => {
		
		return (
			<Tr key={index}>
				<Td>
					{item[7]}
				</Td>
				<Td>
					{item[8]}
				</Td>
				<Td>
					<AcceptButton
						invitation_id={item[0]}
						userInvitationWeb2Id={item[1]}
						ownWeb2Id={item[2]}
						usernameFromUserWhoInvite={item[7]}
						betAmount={item[8]}
					/>
				</Td>
				<Td>
					<DeclineButton
						invitation_id={item[0]}
						userInvitationWeb2Id={item[1]}
						ownWeb2Id={item[2]}
					/>
				</Td>
			</Tr>
		);
	};

	return (
		<>
			<h3> I am being invited to:</h3>
			<TableContainer>
				<Table variant="simple">
					<Thead>
						<Tr>
							<Th>Player </Th>
							<Th>Bet</Th>
							<Th>Accept? </Th>
							<Th>Decline? </Th>
						</Tr>
					</Thead>
					<Tbody>
						{myArray.map((item, index) =>
							item[5] === "WAITING" ? Row({ item, index }) : ""
						)}
					</Tbody>
				</Table>
			</TableContainer>
		</>
	);
};
