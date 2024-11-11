import React, { useState } from 'react';
import {
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Center,
} from '@chakra-ui/react';
import { Modal } from '@gear-js/vara-ui';


// import { ChevronDownIcon } from '@chakra-ui/icons'
interface ViewerBetsProps {
  playerWhiteName: string;
  whitePlayerId: string;
  blackPlayerId: string;
  playerBlackName: string;
  closeModal: () => any
  //parentPlacedBet: (arg1: string) => void;
}

const ViewerBets: React.FC<ViewerBetsProps> = ({ playerWhiteName, whitePlayerId, blackPlayerId, playerBlackName, closeModal }) => {
  return (
    <>
      {/* Place your bet on this player
      <Select placeholder='Place your bet on this player'>
        <option value='option1' style={{ color: 'black' }}>{playerWhiteName}</option>
        <option value='option2' style={{ color: 'black' }}>{playerBlackName}</option>
      </Select>


      This is your bet (TVARA):
      <NumberInput defaultValue={5} min={1} max={20000}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <Button colorScheme='purple' >
        Place your Bet!!
      </Button> */}

      <Modal
        heading='Place your bet on player:'
        close={closeModal}
      >
        <Select>
          <option value='option1' style={{ color: 'black' }}>{playerWhiteName}</option>
          <option value='option2' style={{ color: 'black' }}>{playerBlackName}</option>
        </Select>

        <br />
        <h3>This is your bet (TVARA):</h3>

        <NumberInput defaultValue={5} min={1} max={20000}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <br />
        <Center>
          <Button colorScheme='purple' >
            Place your Bet!!
          </Button>
        </Center>
      </Modal>
    </>
  )
}

export { ViewerBets };

