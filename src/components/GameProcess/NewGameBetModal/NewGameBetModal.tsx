import React, { useState } from 'react';
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Center,
} from '@chakra-ui/react';
import { Modal } from '@gear-js/vara-ui';

interface ViewerBetsProps {
  maxBetValue: number,
  onConfirmBet: (betAmount: number) => any,
  closeModal: () => any
}

export const NewGameBetModal: React.FC<ViewerBetsProps> = ({ maxBetValue, onConfirmBet, closeModal }) => {
  const [actualValue, setActualValue] = useState(maxBetValue != 0 ? 1 : 0);

  const handleChange = (_: any, value: number) => {
    setActualValue(value); // Actualiza el estado con el valor seleccionado
  };

  return (
    <>
      <Modal
        heading='Place your bet on player:'
        close={closeModal}
      >
        <NumberInput 
          defaultValue={maxBetValue != 0 ? 1 : 0} 
          min={0} 
          max={maxBetValue}
          // defaultValue={5} 
          // min={0} 
          // max={10}
          onChange={handleChange}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <br />
        <Center>
          <Button 
            colorScheme='purple' 
            onClick={() => {
              onConfirmBet(actualValue);
              closeModal();
            }}
          >
            Place your bet and play!
          </Button>
        </Center>
      </Modal>
    </>
  )
}


