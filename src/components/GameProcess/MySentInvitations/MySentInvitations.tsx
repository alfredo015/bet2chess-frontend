import React, { useEffect, useState } from "react";
import { CancelButton } from "../CancelButton/CancelButton";
import {
  Td,
  Tr,
  Th,
  TableContainer,
  Table,
  Thead,
  Tbody,
} from "@chakra-ui/react";
import { useAppSelector, useSailsCalls } from "@/app/hooks";
import { useNavigate } from "react-router-dom";
import { useAlert } from "@gear-js/react-hooks";
import axios from "axios";

export const MySentInvitations: React.FC = () => {
  const currentUserId = useAppSelector(state => state.UserGameData.userId);
  const currentUserName = useAppSelector(state => state.UserGameData.userName); 
  const sails = useSailsCalls();
  const navigate = useNavigate();
  const [myArray, setMyArray] = useState<string[][] | null>(null);


  const setInvitations = async () => {
    if (!sails) {
      console.error('SailsCalls is not ready');
      return;
    }

    if (!currentUserId) {
      console.error('There is no user id from a user');
      return;
    }

    const response = await axios.get(`https://vchess.pythonanywhere.com/mysentinvitations/${currentUserId}`);
    const invitations = response.data as any[][];

    if (invitations.length > 1 && !Array.isArray(invitations[0])) {
      const temp = invitations as any[];

      const matchData = temp[8] === currentUserId
				? [...temp, currentUserName, '', true, currentUserId, temp[9]]
				: [...temp, '', currentUserName, true, currentUserId, temp[8]];
      // The user is in a match, redirect to the user match
			navigate(`game/${temp[6]}?data=${encodeURIComponent(JSON.stringify(matchData))}`);
    }

    for (const invitation of invitations) {
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

    setMyArray(invitations);
  }

  useEffect(() => {
    const intervalId = setInterval(async () => {
      await setInvitations();
    }, 1500);


    return () => clearInterval(intervalId);
  }, [currentUserId, sails]);

  const Row = (item: string[], index: number) => {
    return (
      <Tr key={index}>
        <Td> {item[7]} </Td>
        <Td style={{ textAlign: 'center' }}> {item[8]} </Td>
        <Td>
          <CancelButton 
            invitation_id={item[0]} 
            ownWeb2Id={item[1]}
            guestWeb2Id={item[2]}
          />
        </Td>
      </Tr>
    );
  };
  
  return (
    <>
      <h3> These are the sent invitations </h3>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th style={{ color: 'white' }}>Player</Th>
              <Th style={{ color: 'white' }}>Bet amount</Th>
              <Th style={{ color: 'white' }}>Cancel</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              myArray && myArray.map((item, index) =>
                item[5] !== "DECLINED" ? Row(item, index) : ""
              )
            }
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};
