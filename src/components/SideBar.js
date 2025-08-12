import React, { useState, memo, useEffect } from 'react';
import {
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    Text,
    Button,
    Flex,
    Box,
    VStack,
    HStack,
    Divider,
    Image,
    IconButton,
    useToast,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import solana from '../assets/images/solana.svg';
import uparrow from '../assets/images/uparrow.svg';
import downarrow from '../assets/images/downarrow.svg';
import { RiCloseFill } from 'react-icons/ri';

// Memoized RoundCard component
const RoundCard = memo(({ 
    roundId,
    startTime,
    endTime,
    startPrice,
    endPrice,
    totalBetsUp,
    totalBetsDown,
    isActive,
    outcome,
    totalPool,
    winningPool,
    userBet,
    userWon,
    onClaimWinnings
}) => {
    const formatDate = (date) => {
        return date ? new Date(date).toLocaleString() : "---";
    };

    // Calculate potential/actual winnings
    const calculateWinnings = () => {
        if (!userWon || isActive) return 0;
        const userPool = userBet.direction === 'Up' ? totalBetsUp : totalBetsDown;
        const winningAmount = (userBet.amount / userPool) * totalPool;
        return winningAmount.toFixed(3);
    };

    const odds = (totalPool / (userBet.direction === 'Up' ? totalBetsUp : totalBetsDown)).toFixed(2)

    return (
        <Box 
            p={4} 
            borderWidth="1px" 
            borderRadius="md" 
            mb={2}
            bg="white"
            shadow="sm"
        >
            <Flex justifyContent="space-between" alignItems="center" mb={3}>
                <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg">Round #{roundId}</Text>
                    <Text fontSize="sm" color="gray.500">
                        Ended: {formatDate(endTime)}
                    </Text>
                </VStack>
                <HStack>
                    <Image 
                        src={outcome === 'Up' ? uparrow : downarrow}
                        backgroundColor={outcome === 'Up' ? "#31D0AA" : "#ED4B9E"} 
                        borderRadius={"md"}
                        h="24px" 
                    />
                    <Text 
                        color={outcome === 'Up' ? 'green.500' : 'red.500'}
                        fontWeight="semibold"
                    >
                        {outcome || 'In Progress'}
                    </Text>
                </HStack>
            </Flex>

            <Divider my={3} />

            <VStack align="stretch" spacing={3}>
                {/* Position Information */}
                <Box>
                    <Text fontSize="md" color="gray.600" mb={2} fontWeight={600}>Position</Text>
                    <Flex justify="space-between" bg="gray.50" p={2} borderRadius="md">
                        <HStack>
                            <Image 
                                src={userBet.direction === 'Up' ? uparrow : downarrow}
                                backgroundColor={userBet.direction === 'Up' ? "#31D0AA" : "#ED4B9E"} 
                                borderRadius={"md"}
                                h="24px" 
                            />
                            <Text fontWeight="semibold">
                                {userBet.amount} SOL
                            </Text>
                        </HStack>
                        <Text 
                            fontWeight="semibold" 
                            color={isActive ? "gray.500" : userWon ? "green.500" : "red.500"}
                        >
                            {isActive ? "In Progress" : 
                             !outcome ? "Pending" :
                             userWon ? "Won" : "Lost"}
                        </Text>
                    </Flex>
                </Box>

                {/* Winnings Information */}
                {userWon && !isActive && (
                    <Box>
                        <Text fontSize="md" color="gray.600" mb={2} fontWeight={600}>Winnings</Text>
                        <Flex justify="space-between" bg="gray.50" p={2} borderRadius="md">
                            <HStack>
                                <Image src={solana} h="16px" />
                                <Text fontWeight="semibold" color="green.500">
                                    {calculateWinnings()} SOL ({odds}x)
                                </Text>
                            </HStack>
                            {!userBet.claimed ? (
                                <Button
                                    colorScheme="purple"
                                    size="sm"
                                    onClick={() => onClaimWinnings(roundId)}
                                >
                                    Claim
                                </Button>
                            ) : (
                                <Text color="green.500" fontWeight="semibold">
                                    Claimed ✓
                                </Text>
                            )}
                        </Flex>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}, (prevProps, nextProps) => {
    return prevProps.roundId === nextProps.roundId && 
           prevProps.userBet.claimed === nextProps.userBet.claimed;
});

// Main HistoryDrawer component
const HistoryDrawer = memo(({ 
    isOpen, 
    onClose, 
    currentRoundId,
    fetchMoreHistory,
    onClaimWinnings,
    canClaim 
}) => {
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [rounds, setRounds] = useState([]);
    const [currentCount, setCurrentCount] = useState(0);
    const toast = useToast();

    // Initial history fetch
    useEffect(() => {
        const fetchInitial = async () => {
            if (!wallet.connected || !isOpen) return;
            
            setIsLoading(true);
            try {
                const endRound = currentRoundId - 1;
                const startRound = endRound - 10;
                const initialRounds = await fetchMoreHistory(0); // Start from 0 count
                setCurrentCount(10);
                if (initialRounds && initialRounds.length > 0) {
                    setRounds(initialRounds.sort((a, b) => b.id - a.id));
                }
            } catch (error) {
                console.error("Error fetching initial history:", error);
                toast({
                    title: "Error",
                    description: "Failed to load round history",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchInitial();
        } else {
            // Reset state when drawer closes
            setRounds([]);
            setCurrentCount(0);
        }
    }, [wallet.connected, isOpen, currentRoundId]);

    // Handle loading more rounds
    const handleLoadMore = async () => {
        setIsLoading(true);
        try {
            const moreRounds = await fetchMoreHistory(currentCount);
            setCurrentCount(prev => prev + 10);
            if (moreRounds && moreRounds.length > 0) {
                setRounds(prev => [...prev, ...moreRounds].sort((a, b) => b.id - a.id));
            }
        } catch (error) {
            console.error("Error loading more rounds:", error);
            toast({
                title: "Error",
                description: "Failed to load more rounds",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            placement="right"
            onClose={onClose}
            size="md"
        >
            <DrawerOverlay />
            <DrawerContent>
                <DrawerHeader borderBottomWidth='1px'>
                    <Flex justify="space-between" align="center">
                        <IconButton onClick={() => onClose()} bg={"white"} borderWidth={1} borderRadius={"full"} borderColor={"gray.200"} icon={<RiCloseFill />} />
                        <Text>Round History</Text>
                    </Flex>
                </DrawerHeader>

                <DrawerBody p={4}>
                    {!wallet.connected ? (
                        <Flex direction="column" align="center" justify="center" h="full">
                            <Text mb={4}>Connect wallet to view history</Text>
                            <WalletMultiButton />
                        </Flex>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {currentCount > -1 && currentRoundId && (
                                <Box borderRadius="md" bg="gray.50" p={2} textAlign="center">
                                    <Text fontWeight="semibold">
                                        Showing Rounds {Math.max(1, currentRoundId - 1 - currentCount)} to {Math.max(1, currentRoundId - 1)}
                                    </Text>
                                </Box>
                            )}
                            
                            {rounds.length === 0 ? (
                                <Box p={4}>
                                    <Text fontWeight="bold" mb={2}>
                                        {isLoading ? 'Checking for rounds...' : 'No rounds found in this range'}
                                    </Text>
                                    {!isLoading && (
                                        <Text color="gray.600" mb={4}>
                                            Try loading more rounds to check for your history
                                        </Text>
                                    )}
                                </Box>
                            ) : (
                                rounds.map(round => (
                                    <RoundCard
                                        key={round.id}
                                        roundId={round.id}
                                        startTime={round.startTime}
                                        endTime={round.endTime}
                                        startPrice={round.startPrice}
                                        endPrice={round.endPrice}
                                        totalBetsUp={round.totalBetsUp}
                                        totalBetsDown={round.totalBetsDown}
                                        isActive={round.isActive}
                                        outcome={round.outcome}
                                        totalPool={round.totalPool}
                                        winningPool={round.winningPool}
                                        userBet={round.userBet}
                                        userWon={round.userWon}
                                        onClaimWinnings={onClaimWinnings}
                                    />
                                ))
                            )}
                            
                            {Math.max(1, currentRoundId - 1 - currentCount) > 1 && (
                                <Button
                                    onClick={handleLoadMore}
                                    isLoading={isLoading}
                                    loadingText="Checking more rounds..."
                                    colorScheme="purple"
                                    variant="outline"
                                    width="100%"
                                    disabled={isLoading}
                                >
                                    Load More
                                </Button>
                            )}
                        </VStack>
                    )}
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}, (prevProps, nextProps) => {
    return prevProps.isOpen === nextProps.isOpen && 
           prevProps.currentRoundId === nextProps.currentRoundId;
});

export default memo(HistoryDrawer, (prevProps, nextProps) => {
    return prevProps.isOpen === nextProps.isOpen && 
           prevProps.currentRoundId === nextProps.currentRoundId;
});