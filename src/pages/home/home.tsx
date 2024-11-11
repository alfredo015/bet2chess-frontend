import { Center, HStack, VStack } from "@chakra-ui/react";

import { GameProcess } from "./GameProcess";

function Home() {
  return (
    <Center>
      <HStack>
        <VStack>
          <GameProcess />
        </VStack>
      </HStack>
    </Center>
  );
}

export { Home };
