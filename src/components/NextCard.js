import React, { useState, useCallback, useEffect } from 'react'
import play_image_white from '../assets/images/play_image_white.svg'
import up from '../assets/images/up.svg'
import backarrow from '../assets/images/backarrow.svg'
import solana from '../assets/images/solana.svg'
import downdisable from '../assets/images/downdisable.svg'
import { 
    Box, 
    Flex, 
    Image, 
    Text,
    Card as ChakraCard, 
    CardHeader, 
    CardBody,
    Button,
    NumberInput,
    NumberInputField,
    useToast,
    Tooltip,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ReactCardFlip from 'react-card-flip';

const MainCard = React.memo(({ roundId, totalBets, oddsUp, oddsDown, userBet, onBetClick, lockTime, wallet }) => (
    <ChakraCard borderRadius="15px" height="100%" display="flex" flexDirection="column">
        <CardHeader
            display="flex"
            justifyContent="space-between"
            borderBottom="none"
            p="0.5rem 1rem"
            borderTopRadius="15px"
            boxShadow={"sm"}
            backgroundColor={"#7645d9"}
        >
            <Flex alignItems="center" color="white" fontSize="16px" fontWeight="700" textTransform="uppercase">
                <Image src={play_image_white} mr="2" />
                <Text>Round #{roundId}</Text>
            </Flex>
            <Text color="white" fontSize="16px" fontWeight="600">Next</Text>
        </CardHeader>

        <CardBody display="flex" flexDirection="column" justifyContent="space-between" flex="1">
            <Box position="relative" h="65px">
                <Image src={up} mx="auto" w="240px"/>
                <Flex
                    position="absolute"
                    inset="0"
                    alignItems="center"
                    justifyContent="end"
                    direction="column"
                    pb={2}
                >
                    {userBet && userBet?.direction === 'Up' && (
                        <Tooltip label={`${Number(userBet.amount).toFixed(3)} SOL`} placement='top' hasArrow borderRadius={"md"} fontSize={"md"}><Flex
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
                                Entered UP
                            </Text>
                        </Flex></Tooltip>
                    )}
                    <Text 
                        color="#31d0aa"
                        fontWeight="700" 
                        textTransform="uppercase"
                        fontSize="20px"
                        lineHeight="1"
                    >
                        Up
                    </Text>
                    <Flex alignItems="center" gap={1}>
                        <Text color="#7a6eaa" fontWeight="700" fontSize="14px">{oddsUp}x</Text>
                        <Text color="#7a6eaa" fontWeight="600" fontSize="14px">Payout</Text>
                    </Flex>
                </Flex>
            </Box>

            <Box 
                borderRadius="16px" 
                p="2px"
                bg="gray.200"
                height="100%"
                display="flex"
                shadow={"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0px -2px 4px 1px rgba(0, 0, 0, 0.06), 0px -4px 6px 1px rgba(0, 0, 0, 0.06)"}
                flexDirection="column"
                justifyContent="center"
            >
                <Box 
                    bg="white" 
                    height="100%" 
                    borderRadius="14px" 
                    p="16px"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                >
                    <Box>
                        <Flex justifyContent="space-between" mb="8px">
                            <Text color="#280d5f" fontWeight="700" fontSize="16px">Prize Pool:</Text>
                            <Text color="#280d5f" fontWeight="700" fontSize="16px">{totalBets.toFixed(3)} SOL</Text>
                        </Flex>
                        {wallet.connected ? (
                            <Flex flexDirection="column" gap={2}>
                                <Button 
                                    colorScheme="green" 
                                    isDisabled={userBet || (Date.now() > new Date(lockTime).getTime())}
                                    onClick={() => {
                                        onBetClick('Up');
                                    }}
                                >
                                    Enter UP
                                </Button>
                                <Button 
                                    colorScheme='red'
                                    isDisabled={userBet || (Date.now() > new Date(lockTime).getTime())}
                                    onClick={() => {
                                        onBetClick('Down');
                                    }}
                                >
                                    Enter DOWN
                                </Button>
                            </Flex>
                        ) : (
                            <Flex direction="column" gap={2} mt={5} align="center">
                                <Text color="#7a6eaa" textAlign="center" mb={2}>
                                    Connect a wallet to enter the next round.
                                </Text>
                                <WalletMultiButton />
                            </Flex>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box position="relative" h="65px">
                <Image src={downdisable} mx="auto" w="240px" />
                <Flex
                    position="absolute"
                    inset="0"
                    alignItems="center"
                    justifyContent="start"
                    direction="column"
                    pt={2}
                >
                    {userBet && userBet?.direction === 'Down' && (
                        <Tooltip label={`${Number(userBet.amount).toFixed(3)} SOL`} placement='bottom' hasArrow borderRadius={"md"} fontSize={"md"}><Flex
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
                                Entered DOWN
                            </Text>
                        </Flex></Tooltip>
                    )}
                    <Flex alignItems="center" gap={1}>
                        <Text color="#7a6eaa" fontWeight="700" fontSize="14px">{oddsDown}x</Text>
                        <Text color="#7a6eaa" fontWeight="600" fontSize="14px">Payout</Text>
                    </Flex>
                    <Text 
                        color="#ed4b9e"
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

const BetCard = React.memo(({ 
    roundId, 
    betDirection, 
    betAmount, 
    setBetAmount, 
    onBack, 
    onConfirm 
}) => (
    <ChakraCard borderRadius="15px" height="100%" display="flex" flexDirection="column">
        <CardHeader
            display="flex"
            justifyContent="space-between"
            borderBottom="none"
            p="0.5rem 1rem"
            borderTopRadius="15px"
            boxShadow={"sm"}
            backgroundColor={"#7645d9"}
        >
            <Flex alignItems="center" color="white" fontSize="16px" fontWeight="700" textTransform="uppercase">
                <Image src={play_image_white} mr="2" />
                <Text>Round #{roundId}</Text>
            </Flex>
            <Text color="white" fontSize="16px" fontWeight="600">Next</Text>
        </CardHeader>

        <CardBody display={"flex"} alignItems={"center"}>
            <Box>
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Flex alignItems="center">
                        <Button 
                            variant="ghost" 
                            p={0} 
                            size={"sm"}
                            mr={2}
                            onClick={onBack}
                        >
                            <Image src={backarrow} alt="back arrow" h="24px" />
                        </Button>
                        <Text color="#7a6eaa" fontSize="16px" fontWeight="600">
                            Set Position
                        </Text>
                    </Flex>
                    <Flex 
                        bg={betDirection === 'Up' ? '#31d0aa' : '#ed4b9e'}
                        color="white"
                        px={3}
                        py={1}
                        borderRadius="md"
                        alignItems="center"
                    >
                        <Text textTransform="uppercase" fontWeight="600">
                            {betDirection}
                        </Text>
                    </Flex>
                </Flex>

                <Flex mb={2} alignItems="center">
                    <Text color="#7a6eaa" fontWeight="600" mr={2}>Commit:</Text>
                    <Flex alignItems="center">
                        <Image src={solana} h="24px" mr={2} />
                        <Text color="#280d5f" fontWeight="600">SOL</Text>
                    </Flex>
                </Flex>

                <NumberInput 
                    value={betAmount}
                    onChange={(value) => setBetAmount(value)}
                    max={10}
                    precision={3}
                    inputMode='decimal'
                    keepWithinRange
                    min={0}
                    mb={3}
                >
                    <NumberInputField 
                        inputMode='decimal'
                        h="48px"
                        fontSize="20px"
                        bg="#f7f7f7"
                        border="none"
                        placeholder="0.0"
                    />
                </NumberInput>

                <Flex gap={2} mb={4}>
                    {[0.1, 0.25, 0.5, 0.75, 1].map((percent) => (
                        <Button
                            key={percent}
                            size="sm"
                            variant="outline"
                            borderColor="#7645d9"
                            color="#7645d9"
                            _hover={{ bg: '#7645d9', color: 'white' }}
                            onClick={() => setBetAmount(percent)}
                        >
                         {percent}
                        </Button>
                    ))}
                </Flex>

                <Button 
                    colorScheme="purple" 
                    w="full" 
                    h="48px"
                    onClick={() => onConfirm(betDirection)}
                    mb={3}
                >
                    Confirm
                </Button>

                <Text color="#7a6eaa" fontSize="12px" textAlign="center">
                    You can&apos;t change a position once entered. There is a 5% fee on each position.
                </Text>
            </Box>
        </CardBody>
    </ChakraCard>
));

export default function NextCard({
    roundId,
    onPlaceBet,
    betsUp,
    betsDown,
    userBet,
    lockTime
}) {
    const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
    const [betAmount, setBetAmount] = useState(0.1);
    const [betDirection, setBetDirection] = useState(null);
    const [bet, setBet] = useState(null);
    const toast = useToast();
    const wallet = useWallet()

    useEffect(() => {
        const fetchBet = async () => {
            if (!roundId) return;
            
            try {
                const betData = await userBet();
                setBet(betData);
            } catch (error) {
                console.error("Error fetching bet:", error);
            }
        };

        fetchBet();
    }, [roundId, userBet]);

    const totalBets = betsUp + betsDown;
    const oddsUp = betsUp > 0 ? (totalBets / betsUp).toFixed(2) : '0.00';
    const oddsDown = betsDown > 0 ? (totalBets / betsDown).toFixed(2) : '0.00';

    const handleBet = useCallback(async (direction) => {
        if (betAmount < 0.005) {
            toast({
                title: "Position Too Small",
                position: "top-right",
                description: "Please enter a position greater than 0.005 SOL.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }
        
        try {
            const betPromise = onPlaceBet(direction, betAmount);
            
            toast.promise(betPromise, {
                loading: { 
                    title: "Sending Transaction",
                    position: "top-right",
                    description: "You are being entered into the round.",
                },
                success: { 
                    title: "Position Entered",
                    position: "top-right",
                    description: "Your position has been entered.",
                },
                error: { 
                    title: "Transaction Failed",
                    position: "top-right",
                    description: "Please try entering the round again.",
                }
            });

            await betPromise;
            setIsAmountModalOpen(false);
            setBetDirection(null);
        } catch (error) {
            console.error("Error placing bet:", error);
        }
    }, [betAmount, onPlaceBet, toast]);

    const handleBack = useCallback(() => {
        setIsAmountModalOpen(false);
        setBetDirection(null);
    }, []);

    const handleBetClick = useCallback((direction) => {
        setBetDirection(direction);
        setIsAmountModalOpen(true);
    }, []);

    return (
        <Box maxWidth={320} minWidth={300} height="100%">
            <ReactCardFlip containerStyle={{height:"100%"}} isFlipped={isAmountModalOpen} flipDirection="horizontal">
                <MainCard 
                    roundId={roundId}
                    totalBets={totalBets}
                    oddsUp={oddsUp}
                    oddsDown={oddsDown}
                    userBet={bet}
                    wallet={wallet}
                    onBetClick={handleBetClick}
                    lockTime={lockTime}
                />
                <BetCard 
                    roundId={roundId}
                    betDirection={betDirection}
                    betAmount={betAmount}
                    setBetAmount={setBetAmount}
                    onBack={handleBack}
                    onConfirm={handleBet}
                />
            </ReactCardFlip>
        </Box>
    );
}
