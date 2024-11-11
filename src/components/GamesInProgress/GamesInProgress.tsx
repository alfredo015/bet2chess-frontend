import React, { useState } from "react";
import { useEffect } from "react";
import {
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	TableCaption,
	TableContainer,
	Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

// const GamesInProgress: React.FC<LobbyProps> = ({ parentSelectGame }) => {
const GamesInProgress: React.FC = () => {
	const navigate = useNavigate();
	const [games, setGames] = useState<any[][] | null>(null);

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const { data } = await axios.get(`https://vchess.pythonanywhere.com/currentgames`);
				
				if (Array.isArray(data[0])) {
					setGames(data);
				} else {
					setGames([data]); //debe estar como arreglo de arreglos
				}
			} catch(e) {
				console.error(e);
			}
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	const disableButton = (val: string): boolean => {
		console.log(
			"hey I want to disable this thing... heres what i got " + val
		);
		if (val === "AVAILABLE") {
			console.log("going to send false");
			return false;
		} else {
			console.log("going to send TRUE");
			return true;
		}
	};
	return (
		<>
			<h2>Visit other games and place your bets!! </h2>

			<TableContainer>
				<Table variant="simple">
					<TableCaption> </TableCaption>
					<Thead>
						<Tr>
							<Th>Games ID</Th>
							<Th>Player 1 </Th>
							<Th>Player 2 </Th>
						</Tr>
					</Thead>
					<Tbody>
						{
							games && games.length >= 1 && games[0].length > 1 && games.map((item, index) => (
								<Tr key={index}>
									<Td>
										<Button
											onClick={() => {
												let data = encodeURIComponent(JSON.stringify([...item, false]));
												navigate(`game/${item[0]}?data=${data}`);
											}}
										>
											{item[0]}
										</Button>
									</Td>
									<Td>{item[10]}</Td>
									<Td>{item[11]}</Td>
								</Tr>
							))
						}
					</Tbody>
				</Table>
			</TableContainer>
		</>
	);
};

export { GamesInProgress };
