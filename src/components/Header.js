import { useRef } from "react";
import {
  HStack,
  Flex,
  IconButton,
  Box,
  Image,
  Badge
} from "@chakra-ui/react";
import { FaTelegram } from "react-icons/fa";
import {
    WalletMultiButton,
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import HeaderIM from "../assets/images/Header.svg"
import HeaderMob from "../assets/images/Header-Mob.svg"

export default function Header() {
  const bg = "#FFFFFF"
  const ref = useRef();
  const wallet = useWallet();

  return (
    <>
    <Flex flexDirection={"column"} as="header"
        borderBottomWidth={1}
        borderBottomColor={"gray.200"}
        bg={bg}>
      <Box
        ref={ref}
        transition="box-shadow 0.2s"
        bg={bg}
        w={"100%"}
        borderBottomWidth={1}
        borderBottomColor={"gray.200"}
      >
        <Box h="4.5rem" maxWidth={"8xl"} mx="auto">
          <Flex
            h="full"
            px="6"
            alignItems="center"
            justifyContent="space-between"
          >
            <Flex flex={1}>
              <HStack alignItems={"center"}>
                <Image display={{base:"flex",md:"none"}} src={HeaderMob} />
                <Image display={{base:"none",md:"flex"}} src={HeaderIM} />
                <Badge as='div' ml={2} display={{base:"none",sm:"flex"}} fontSize={"sm"} px={2} py={1} borderRadius={"lg"} colorScheme="purple">BETA</Badge>
              </HStack>
            </Flex>
            <Flex justify="flex-end" align="center" height={"fit-content"} color="gray.400">
              {wallet.connected?<WalletDisconnectButton />:<Flex><WalletMultiButton /></Flex>}
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Flex>
    </>
  );
}