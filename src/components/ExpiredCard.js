import React, { useState, useEffect } from 'react'
import upgreen from '../assets/images/upgreen.svg'
import downdisable from '../assets/images/downdisable.svg'
import down from '../assets/images/down.svg'
import up from '../assets/images/up.svg'
import winner_cup from '../assets/images/winner_cup.svg'
import blocked from '../assets/images/blocked.svg'
import { 
    Box, 
    Flex, 
    Image, 
    Text,
    Card as ChakraCard, 
    CardHeader, 
    CardBody,
    Button,
    Tooltip,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'

// Create a memoized main component
const ExpiredCardContent = React.memo(({ 
    roundId,
    startPrice,
    endPrice,
    outcome,
    bet,
    totalBets,
    oddsUp,
    oddsDown,
    priceColor,
    wallet,
    userWon,
    claimableAmount,
    canClaimWinnings,
    isLoading,
    onClaimWinnings
}) => (
    <ChakraCard opacity={userWon?1:0.5} transition="opacity 0.5s ease" _hover={{opacity: 1}} borderRadius="15px" height="100%" display="flex" flexDirection="column">
        <CardHeader
            background={"gray.100"}
            display="flex"
            justifyContent="space-between"
            borderBottom="none"
            p="0.5rem 1rem"
            borderTopRadius="15px"
            boxShadow={"sm"}
        >
            <Flex alignItems="center" color="#7645d9" fontSize="16px" fontWeight="700" textTransform="uppercase">
                <Image src={blocked} mr="2" />
                <Text>Round #{roundId}</Text>
            </Flex>
            <Text color="#ed4b9e" fontSize="16px" fontWeight="600">Ended</Text>
        </CardHeader>

        <CardBody display="flex" flexDirection="column" justifyContent="center" flex="1">
            {/* Up Section */}
            <Box position="relative" h="65px">
                <Image src={outcome === 'Up' ? upgreen : up} mx="auto" w="240px" />
                <Flex
                    position="absolute"
                    inset="0"
                    alignItems="center"
                    justifyContent="end"
                    direction="column"
                    pb={2}
                >
                    {bet && bet?.direction === 'Up' && wallet.connected && (
                         <Tooltip label={`${userWon && !canClaimWinnings ? claimableAmount : bet.amount } SOL`} placement='top' hasArrow borderRadius={"md"} fontSize={"md"}><Flex
                            position="absolute"
                            bottom="-12px"
                            right="-12px"
                            bg="#7645d9"
                            px={2}
                            py={1}
                            borderRadius="full"
                            alignItems="center"
                            color="white"
                            zIndex={2}
                        >
                            <svg viewBox="0 0 24 24" width="18px" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" />
                            </svg>
                            <Text fontWeight="bold" fontSize="14px" ml={1}>
                                {userWon && !canClaimWinnings ? "Claimed" : "Entered UP"}
                            </Text>
                        </Flex></Tooltip>
                    )}
                    <Text 
                        color={outcome === 'Up' ? "white" : "#31d0aa"}
                        fontWeight="700" 
                        textTransform="uppercase"
                        fontSize="20px"
                        lineHeight="1"
                    >
                        Up
                    </Text>
                    <Flex alignItems="center" gap={1}>
                        <Text color={outcome === 'Up' ? "white" : "#7a6eaa"} fontWeight="700" fontSize="14px">{oddsUp}x</Text>
                        <Text color={outcome === 'Up' ? "white" : "#7a6eaa"} fontWeight="600" fontSize="14px">Payout</Text>
                    </Flex>
                </Flex>
            </Box>

            {/* Price Card Section */}
            <Box 
                borderRadius="16px" 
                p="2px"
                bg={priceColor}
                shadow={"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0px -2px 4px 1px rgba(0, 0, 0, 0.06), 0px -4px 6px 1px rgba(0, 0, 0, 0.06)"}
            >
                <Box bg="white" borderRadius="14px" p="16px">
                    {userWon && (
                        <Flex justifyContent="center" textAlign={"center"} mb={4} alignItems="center" gap={2}>
                            <Image src={winner_cup} h="24px" />
                            <Text color="#31d0aa" fontSize={"xl"} fontWeight="700">You won!</Text>
                        </Flex>
                    )}
                    
                    <Flex justifyContent="space-between" mb="5px">
                        <Text color="#280d5f" fontWeight="600" fontSize="14px">Closing Price:</Text>
                        <Text color="#280d5f" fontWeight="600" fontSize="14px">
                            ${endPrice ? (endPrice).toFixed(3) : "---.--"}
                        </Text>
                    </Flex>
                    <Flex justifyContent="space-between" mb="5px">
                        <Text color="#280d5f" fontWeight="600" fontSize="14px">Opening Price:</Text>
                        <Text color="#280d5f" fontWeight="600" fontSize="14px">
                            ${startPrice ? (startPrice).toFixed(3) : "---.--"}
                        </Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                        <Text color="#280d5f" fontWeight="700" fontSize="16px">Prize Pool:</Text>
                        <Text color="#280d5f" fontWeight="700" fontSize="16px">{totalBets.toFixed(3)} SOL</Text>
                    </Flex>
                    
                    {userWon && canClaimWinnings && (
                        <Button
                            colorScheme="green"
                            w="full"
                            mt={4}
                            onClick={() => onClaimWinnings(roundId)}
                            isLoading={isLoading}
                        >
                            Claim {claimableAmount} SOL
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Down Section */}
            <Box position="relative" h="65px">
                <Image src={outcome === 'Down' ? down : downdisable} mx="auto" w="240px" />
                <Flex
                    position="absolute"
                    inset="0"
                    alignItems="center"
                    justifyContent="start"
                    direction="column"
                    pt={2}
                >
                {bet && bet?.direction === 'Down' && wallet.connected && (
                        <Tooltip label={`${userWon && !canClaimWinnings ? claimableAmount : bet.amount } SOL`} placement='top' hasArrow borderRadius={"md"} fontSize={"md"}><Flex
                            position="absolute"
                            bottom="-16px"
                            right="-12px"
                            bg="#7645d9"
                            px={2}
                            py={1}
                            borderRadius="full"
                            alignItems="center"
                            color="white"
                            zIndex={2}
                        >
                            <svg viewBox="0 0 24 24" width="18px" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" />
                            </svg>
                            <Text fontWeight="bold" fontSize="14px" ml={1}>
                                {userWon && !canClaimWinnings ? "Claimed" : "Entered DOWN"}
                            </Text>
                        </Flex></Tooltip>
                    )}
                    <Flex alignItems="center" gap={1}>
                        <Text color={outcome === 'Down' ? "white" : "#7a6eaa"} fontWeight="700" fontSize="14px">{oddsDown}x</Text>
                        <Text color={outcome === 'Down' ? "white" : "#7a6eaa"} fontWeight="600" fontSize="14px">Payout</Text>
                    </Flex>
                    <Text 
                        color={outcome === 'Down' ? "white" : "#ed4b9e"}
                        fontWeight="700"
                        textTransform="uppercase"
                        fontSize="20px"
                        lineHeight="1"
                    >
                        Down
                    </Text>
                </Flex>
            </Box>
        </CardBody>
    </ChakraCard>
));

export default function ExpiredCard({
    roundId,
    betsUp,
    betsDown,
    startPrice,
    endPrice,
    outcome,
    userBet,
    onClaimWinnings,
    canClaim
}) {
    const [bet, setBet] = useState(null);
    const [canClaimWinnings, setCanClaimWinnings] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const wallet = useWallet()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [betData, claimable] = await Promise.all([
                    userBet(),
                    canClaim()
                ]);
                setBet(betData);
                setCanClaimWinnings(claimable);
            } catch (error) {
                console.error("Error fetching bet data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [roundId]);

    // Calculate all the values here
    const totalBets = betsUp + betsDown;
    const oddsUp = betsUp > 0 ? (totalBets / betsUp).toFixed(2) : '0.00';
    const oddsDown = betsDown > 0 ? (totalBets / betsDown).toFixed(2) : '0.00';
    
    const priceChange = endPrice && startPrice ? endPrice - startPrice : 0;
    const priceColor = outcome === 'Up' ? '#31d0aa' : outcome === 'Down' ? '#ed4b9e' : '#7a6eaa';
    
    const multiplier = outcome === 'Up' ? 
        (totalBets / betsUp).toFixed(2) : 
        (totalBets / betsDown).toFixed(2);
    
    const userWon = bet && ((outcome === 'Up' && bet.direction === 'Up') || 
                           (outcome === 'Down' && bet.direction === 'Down'));

    const claimableAmount = userWon && bet ? 
        (bet.amount * Number(multiplier)).toFixed(2) : '0';

    return (
        <Box maxWidth={320} width={"100%"} minWidth={300} height="100%">
            <ExpiredCardContent
                roundId={roundId}
                wallet={wallet}
                betsUp={betsUp}
                betsDown={betsDown}
                startPrice={startPrice}
                endPrice={endPrice}
                outcome={outcome}
                bet={bet}
                totalBets={totalBets}
                oddsUp={oddsUp}
                oddsDown={oddsDown}
                priceColor={priceColor}
                multiplier={multiplier}
                userWon={userWon}
                claimableAmount={claimableAmount}
                canClaimWinnings={canClaimWinnings}
                isLoading={isLoading}
                onClaimWinnings={onClaimWinnings}
            />
        </Box>
    );
}
