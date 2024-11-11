import { useEffect, useMemo, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { useAppSelector } from '@/app/hooks';
import { Center, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { GameStatus, ForfeitGameButton } from '@/components';
import { Button } from '@chakra-ui/react';
import { ViewerBets } from '../home/ViewerBets';
import { useSailsCalls } from '@/app/hooks';
import { useAlert } from '@gear-js/react-hooks';
import { decodeAddress, HexString } from '@gear-js/api';

export const loader = async ({ params, request }: any) => {
  const url = new URL(request.url);
  const data = url.searchParams.get('data');
  const matchData = data ? JSON.parse(decodeURIComponent(data)): null;

  return {
    gameId: params.gameid,
    matchData: {
      whitePlayerId: matchData[8],
      blackPlayerId: matchData[9],
      whitePlayerName: matchData[10],
      blackPlayerName: matchData[11],
      canPlay: matchData[12],
      userId: matchData[13],
      guessId: matchData[14]
    }
  }
}

export const GameMatch = () => {
  const sails = useSailsCalls();
  const alert = useAlert();
  const navigate = useNavigate();
  const currentUserId = useAppSelector(state => state.UserGameData.userId);
  const currentUserAddress = useAppSelector(state => state.UserGameData.userAddress);
  const currentUserName = useAppSelector(state => state.UserGameData.userName);
  const { gameId, matchData }: any = useLoaderData();
  const { 
    whitePlayerId,
    blackPlayerId,
    blackPlayerName: blackName,
    whitePlayerName: whiteName,
    canPlay,
    userId,
    guessId
  } = matchData;
  const [whitePlayerName, setWhitePlayerName] = useState(whiteName);
  const [blackPlayerName, setBlackPlayerName] = useState(blackName);
  const [otherPlayerAddress, setOtherPlayerAddress] = useState<HexString | null>(null);
  const [otherPlayerName, setOtherPlayerName] = useState('');
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [gameFinishedByPlayer, setGameFinishedByPlayer] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [actualWinnerName, setActualWinnerName] = useState('');
  const [needToSign, setNeedToSign] = useState(false);

  const setBetModalOpenToFalse = () => {
    setBetModalOpen(false);
  }

  const checkState = async () => {
    if (!sails) {
      alert.error('SailsCalls is not ready');
      return;
    }

    const gameData = await sails.query(
      'Bet2Chess/GameData',
      {
        callArguments: [ gameId ]
      }
    );

    // viewers cant see the match because is not initiated
    if (!gameData && !canPlay) {
      alert.info('The game has not started yet');
      navigate('/');
      return;
    }

    // No exite la partida
    if (!gameData) {
      return;
    }

    const status = Object.keys(gameData.status)[0];

    // Another check for viewers
    if (status === 'waiting' && !canPlay) {
      alert.info('The game has not started yet');
      navigate('/');
      return;
    }

    if (status == 'ended') {
      const { winner } = gameData.status.ended;

      if (winner == gameData.player1) {
        setActualWinnerName(gameData.player1_username);
      } else {
        setActualWinnerName(gameData.player2_username);
      }

      setGameFinishedByPlayer(true);
    }

    if (status === 'started') {
      if (gameData.player1_web2_id == whitePlayerId) {
        setBlackPlayerName(gameData.player2_username);
        setWhitePlayerName(gameData.player1_username);
      } else {
        setBlackPlayerName(gameData.player1_username);
        setWhitePlayerName(gameData.player2_username);
      }

      setShowPlayButton(false);
    }

    if (!currentUserAddress) return;

    if (gameData.player1 == decodeAddress(currentUserAddress)) {
      setOtherPlayerAddress(gameData.player2);
      setOtherPlayerName(gameData.player2_username);
    } else {
      setOtherPlayerAddress(gameData.player1);
      setOtherPlayerName(gameData.player1_username);
    }
  }

  useEffect(() => {
    // First check, this checks works for users without wallets
    if (!currentUserId && canPlay) {
      navigate('/');
    }
    
    // Second check, the user with wallet always has userId, 
    // check if the user change to another wallet
    if (currentUserId && currentUserId !== userId && canPlay) {
      navigate('/');
    }

    checkState();
  }, [currentUserId, checkState]);

  useEffect(() => {
    const intervalId = setInterval(checkState, 700);

    return () => clearInterval(intervalId);
  }, [ gameFinished, gameFinishedByPlayer, sails ]);

  const handleBoardState = async (
		playing: boolean,
		gameState: string,
		playerWinner: string,
		playerLoser: string,
    winnerColor: string
	) => {
    const winnerWeb2Id = Number(playerWinner);

    if (canPlay) {
      
      if (winnerWeb2Id == currentUserId) {
        setActualWinnerName(currentUserName as string);
        setNeedToSign(false);
      } else {
        setActualWinnerName(otherPlayerName);
        setNeedToSign(true);
      }
    } else {
      if (whitePlayerId == winnerWeb2Id) {
        setActualWinnerName(whitePlayerName);
      } else {
        setActualWinnerName(blackPlayerName);
      }
    }

    setGameFinished(true);

    if (!sails) {
      alert.error('SailsCalls is not readyyyyyyyy');
      return;
    }

    const gameData = await sails.query(
      'Bet2Chess/GameData',
      {
        callArguments: [ gameId ]
      }
    );

    if (!gameData) return;

    const status = Object.keys(gameData.status)[0];

    if (status == 'ended') {
      setGameFinishedByPlayer(true);
    }
	};

  return (
    <>
      <Center>
        <VStack >
          <GameStatus
              // message={message}
              message='Game in progress'
              gameState={'Srterted'}
              playerWinner={''}
              playerLoser={''}
              whitePlayerId={whitePlayerId}
              blackPlayerId={blackPlayerId}
              playerWhiteName={whitePlayerName}
              playerBlackName={blackPlayerName}
              viewerMode={!canPlay}
          />
          {
            (gameFinished || gameFinishedByPlayer) && (
              <p style={{ fontSize: '30px' }}>Winner: <span style={{textDecorationLine: 'underline'}}>{actualWinnerName}</span></p>
            )
          }
          {
            (canPlay && !gameFinishedByPlayer && gameFinished && !needToSign) && <p>Waiting for the player to accept his defeat...</p>
          }
          {
            !showPlayButton &&(
              <ChessBoard 
                playerId={String(userId)}
                gameId={String(gameId)}
                whitePlayerId={whitePlayerId}
                blackPlayerId={blackPlayerId}
                draggable={canPlay && !(gameFinished || gameFinishedByPlayer)}
                handleBoardState={handleBoardState}
              />
            )
          }
          {
            showPlayButton && (
              <>
                <h2>Waiting for the match to start</h2>
                <p>Refresh the page if necessary</p>
              </>
            )
          }
          {
            !showPlayButton && 
            canPlay && 
            (!(gameFinished || gameFinishedByPlayer) || (needToSign && !gameFinishedByPlayer)) &&
            (
              <ForfeitGameButton
                onGameFinished={() => {
                  if (!gameFinished) {
                    setGameFinishedByPlayer(true);
                    return;
                  }
                }}
                gameId={gameId}
                userId={userId}
                otherPlayerId={guessId}
                otherPlayerAddress={otherPlayerAddress}
              />
            )
          }
          {
              (gameFinishedByPlayer || !canPlay) && (
              <Button
                onClick={() => {
                  navigate('/');
                }}
              >
                Return to home page
              </Button>
            )
          }
          {
            
          }
        </VStack>
      </Center>
      {
        betModalOpen && (
          <ViewerBets
            whitePlayerId={whitePlayerId}
            blackPlayerId={blackPlayerId}
            playerWhiteName={whitePlayerName}
            playerBlackName={blackPlayerName}
            closeModal={setBetModalOpenToFalse}
          />
        )
      }
    </>
  );
}
