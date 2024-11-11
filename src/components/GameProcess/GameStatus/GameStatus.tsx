import React from "react";

interface ShowStatusProps {
	message: string;
	gameState: string;
	whitePlayerId: string;
	blackPlayerId: string;
	playerWinner: string;
	playerLoser: string;
	playerWhiteName: string;
	playerBlackName: string;
	viewerMode: boolean;
}

export const GameStatus: React.FC<ShowStatusProps> = ({
	message,
	gameState,
	whitePlayerId,
	blackPlayerId,
	playerWinner,
	playerLoser,
	playerWhiteName,
	playerBlackName,
	viewerMode,
}) => {
	return (
		<>
			{viewerMode && (
				<h1
					style={{
						fontSize: "40px",
						backgroundColor: "purple",
						color: "teal",
					}}
				>
					VIEWER MODE
				</h1>
			)}
			<h1
				style={{
					fontSize: "30px",
					backgroundColor: "white",
					color: "black",
				}}
			>
				WHITE: {playerWhiteName} {whitePlayerId}{" "}
			</h1>
			<p style={{fontSize: '25px'}}>VS</p>
			<h1
				style={{
					fontSize: "30px",
					backgroundColor: "black",
					color: "white",
				}}
			>
				BLACK: {playerBlackName} {blackPlayerId}
			</h1>
		</>
	);
};
