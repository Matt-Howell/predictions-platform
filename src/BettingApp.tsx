import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, clusterApiUrl, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import type { PredictionsPlatform } from "./idl/predictions_platform"
import idl from "./idl/predictions_platform.json"
import { Buffer } from 'buffer';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import LiveCard from './components/LiveCard';
import Header from './components/Header';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel } from 'swiper/modules';
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver'
import 'swiper/css';
import 'swiper/css/pagination';
import solana from "./assets/images/solana.svg"
import { BN } from '@coral-xyz/anchor';
import NextCard from './components/NextCard';
import { Alert, Box, Button, Container, Flex, IconButton, Image, Link, Spinner, Text, useToast } from '@chakra-ui/react';
import ExpiredCard from './components/ExpiredCard';
import LaterCard from './components/LaterCard';
import { FaArrowLeft, FaArrowRight, FaHistory, FaRegQuestionCircle } from 'react-icons/fa';
import TView from './components/TView';
import Footer from './components/Footer';
import { useDisclosure } from '@chakra-ui/hooks';
import HistoryDrawer from './components/SideBar';
import PlayModal from './components/PlayModal';

const programId = new PublicKey("");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const FEE_WALLET = new PublicKey("");

// Derive PDAs
const deriveStatePDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync([Buffer.from("state")], programId);
};

const deriveVaultPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        programId
    );
};

const deriveRoundPDA = (programId: PublicKey, roundId: number): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("round"), new BN(roundId).toArrayLike(Buffer, 'le', 8)],
        programId
    );
};

interface StateType {
    currentRoundId: number;
    nextRoundId: number;
    currentRound: PublicKey;
    nextRound: PublicKey;
    roundStartTime: Date;
}

interface RoundType {
    id: number;
    startTime: Date | null;
    endTime: Date | null;
    startPrice: number | null;
    endPrice: number | null;
    totalBetsUp: number;
    totalBetsDown: number;
    isActive: boolean;
    outcome: 'Up' | 'Down' | null;
    totalPool: number;
    winningPool: number;
}

interface RoundWithOutcome extends RoundType {
    outcome: 'Up' | 'Down' | null;
    totalPool: number;
    winningPool: number;
}

interface UserBetInRound {
    amount: number;
    direction: 'Up' | 'Down';
    claimed: boolean;
}

interface RoundWithUserBet extends RoundType {
    userBet: UserBetInRound;
    userWon: boolean;
}

interface UserBetType {
    roundId: number;
    user: PublicKey;
    direction: 'Up' | 'Down';
    amount: number;
    claimed: boolean;
}

// Helper to derive user bet PDA
const deriveUserBetPDA = (programId: PublicKey, roundId: number, userKey: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("user_bet"), 
            new BN(roundId).toArrayLike(Buffer, 'le', 8),
            userKey.toBuffer()
        ],
        programId
    );
};

const readOnlyProvider = {
    connection
} as AnchorProvider;

export default function PredictionsPlatform() {
    const wallet = useWallet();
    const { 
        isOpen: isHistoryOpen, 
        onOpen: onHistoryOpen, 
        onClose: onHistoryClose 
    } = useDisclosure();
    
    const {
        isOpen: isHelpOpen,
        onOpen: onHelpOpen,
        onClose: onHelpClose
    } = useDisclosure();

    const [swiperInstance, setSwiperInstance] = useState<typeof Swiper>();
    const toast = useToast()
    const [program, setProgram] = useState<Program<PredictionsPlatform>>(() => {
        return new Program(idl as Idl, readOnlyProvider);
    });
    const [state, setState] = useState<StateType | null>(null);
    const [currentRound, setCurrentRound] = useState<RoundType | null>(null);
    const [expiredRounds, setExpiredRounds] = useState<(RoundWithOutcome | null)[]>([]);
    const [nextRound, setNextRound] = useState<RoundType | null>(null);
    const [solPrice, setSolPrice] = useState<number>(0.00); // Default bet amount in SOL
    const pricesConnection = new PriceServiceConnection("https://hermes.pyth.network", {});
    const pythSolanaReceiver = new PythSolanaReceiver({connection, wallet})

    // Update program when wallet connects
    useEffect(() => {
        if (wallet.connected && wallet.publicKey) {
            const walletProvider = new AnchorProvider(connection, wallet, {
                commitment: "confirmed",
            });
            const updatedProgram = new Program(idl as Idl, walletProvider);
            setProgram(updatedProgram);
        } else {
            const progr = new Program(idl as Idl, readOnlyProvider)
            setProgram(progr);
        }
    }, [wallet.connected, wallet.publicKey]);

    const fetchRoundData = async (roundAddress: PublicKey): Promise<RoundType | null> => {
        try {
            const roundAccountInfo = await connection.getAccountInfo(roundAddress);
            if (!roundAccountInfo) return null;

            if (program) {
                const roundAccount = await program.account.round.fetch(roundAddress);
                return {
                    id: roundAccount.id.toNumber(),
                    startTime: roundAccount.startTime ? new Date(roundAccount.startTime.toNumber() * 1000) : null,
                    endTime: roundAccount.endTime ? new Date(roundAccount.endTime.toNumber() * 1000) : null,
                    startPrice: roundAccount.startPrice ? roundAccount.startPrice.toNumber() / 1e8 : null,
                    endPrice: roundAccount.endPrice ? roundAccount.endPrice.toNumber() / 1e8 : null,
                    totalBetsUp: roundAccount.totalBetsUp.toNumber() / 1e9,
                    totalBetsDown: roundAccount.totalBetsDown.toNumber() / 1e9,
                    isActive: roundAccount.isActive,
                    outcome: roundAccount.outcome ? roundAccount.outcome.up ? 'Up' : 'Down' : null,
                    totalPool: roundAccount.totalPool.toNumber() / 1e9,
                    winningPool: roundAccount.winningPool.toNumber() / 1e9
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching round data:", error);
            return null;
        }
    };

    // Update the expired rounds fetching
    const fetchExpiredRounds = async (currentRoundId: number): Promise<(RoundWithOutcome | null)[]> => {
        let expiredRounds: (RoundWithOutcome | null)[] = [];
        
        for (let i = currentRoundId - 3; i <= currentRoundId - 1; i++) {
            const [roundPDA] = deriveRoundPDA(programId, i);
            
            try {
                const roundAccount = await program.account.round.fetch(roundPDA);
                expiredRounds.push({
                    id: i,
                    startTime: roundAccount.startTime ? new Date(roundAccount.startTime.toNumber() * 1000) : null,
                    endTime: roundAccount.endTime ? new Date(roundAccount.endTime.toNumber() * 1000) : null,
                    startPrice: roundAccount.startPrice ? roundAccount.startPrice.toNumber() / 1e8 : null,
                    endPrice: roundAccount.endPrice ? roundAccount.endPrice.toNumber() / 1e8 : null,
                    totalBetsUp: roundAccount.totalBetsUp.toNumber() / 1e9,
                    totalBetsDown: roundAccount.totalBetsDown.toNumber() / 1e9,
                    isActive: roundAccount.isActive,
                    outcome: roundAccount.outcome ? roundAccount.outcome.up ? 'Up' : 'Down' : null,
                    totalPool: roundAccount.totalPool.toNumber() / 1e9,
                    winningPool: roundAccount.winningPool.toNumber() / 1e9
                });
            } catch (error) {
                // If round doesn't exist, push placeholder
                expiredRounds.push({
                    id: i,
                    startTime: currentRound?.startTime ? 
                        new Date(Number(currentRound.startTime.getTime()) - ((currentRoundId - i) * 3600 * 1000)) : null,
                    endTime: currentRound?.endTime ? 
                        new Date(Number(currentRound.endTime.getTime()) - ((currentRoundId - i) * 3600 * 1000)) : null,
                    startPrice: null,
                    endPrice: null,
                    totalBetsUp: 0,
                    totalBetsDown: 0,
                    isActive: false,
                    outcome: null,
                    totalPool: 0,
                    winningPool: 0
                });
            }
        }
        
        return expiredRounds;
    };

    // Update useEffect for fetching data
    useEffect(() => {
        const fetchData = async () => {
            if (!program) {
                console.log("No program instance available");
                return;
            }

            try {
                const [statePDA] = deriveStatePDA(programId);
                const stateAccount = await program.account.state.fetch(statePDA);

                setState({
                    currentRoundId: stateAccount.currentRoundId.toNumber(),
                    nextRoundId: stateAccount.nextRoundId.toNumber(),
                    currentRound: stateAccount.currentRound,
                    nextRound: stateAccount.nextRound,
                    roundStartTime: new Date(stateAccount.roundStartTime.toNumber() * 1000),
                });

                const expiredRounds = await fetchExpiredRounds(stateAccount.currentRoundId.toNumber());
                setExpiredRounds(expiredRounds);

                const currentRoundData = await fetchRoundData(stateAccount.currentRound);
                const nextRoundData = await fetchRoundData(stateAccount.nextRound);

                setCurrentRound(currentRoundData);
                setNextRound(nextRoundData);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
        
        // Set up subscription for real-time updates
        const [statePDA] = deriveStatePDA(programId);
        const subscriptionId = connection.onAccountChange(
            statePDA,
            () => {
                console.log("State account changed, refetching...");
                fetchData();
            }
        );

        let lastUpdate = 0;
        const throttleInterval = 3000; // 5 seconds
    
        pricesConnection.subscribePriceFeedUpdates(
            ["0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"], 
            (priceFeed) => {
                const now = Date.now();
                if (now - lastUpdate >= throttleInterval) {
                    const price = priceFeed.getPriceNoOlderThan(20);
                    setSolPrice(
                        Number(Number((price?.price ?? 0) / Math.pow(10, Number(price?.expo ?? 0) * -1)).toPrecision(5))
                    );
                    lastUpdate = now;
                }
            }
        );

        return () => {
            connection.removeAccountChangeListener(subscriptionId);
            pricesConnection.unsubscribePriceFeedUpdates(["0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"]); // Clean up price subscription
        };
    }, [program]);

     const initialize = async () => {
         if (!program || !wallet.publicKey) return;
         
         const [statePDA] = deriveStatePDA(programId);
         const [vaultPDA] = deriveVaultPDA(programId);
         const [round0PDA] = deriveRoundPDA(programId, 0);
         const [round1PDA] = deriveRoundPDA(programId, 1);
 
         const solUsdPriceFeedAccount = pythSolanaReceiver.getPriceFeedAccountAddress(0, "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d").toBase58();
         
         try {
              const objvAl = {
                  payer: wallet.publicKey,
                  vault: vaultPDA,
                  state: statePDA,
                  currentRound: round0PDA,
                  nextRound: round1PDA,
                  priceUpdate: new PublicKey(solUsdPriceFeedAccount),
                  systemProgram: SystemProgram.programId,
              }

              await program.methods
                .initialize()
                  .accounts(objvAl)
                  .rpc();
         } catch (error) {
             console.error("Error initializing:", error);
             if (error.logs) {
                 console.error("Transaction logs:", error.logs);
             }
         }
     };

    const fetchUserBet = async (roundId: number): Promise<UserBetType | null> => {
        if (!program || !wallet.publicKey) return null;

        try {
            const [userBetPDA] = deriveUserBetPDA(programId, roundId, wallet.publicKey);
            const userBet = await program.account.userBet.fetch(userBetPDA);
            
            return {
                roundId: userBet.roundId.toNumber(),
                user: userBet.user,
                direction: userBet.direction.up ? 'Up' : 'Down',
                amount: userBet.amount.toNumber() / 1e9,
                claimed: userBet.claimed
            };
        } catch (error) {
            return null;
        }
    };

    const placeBet = async (direction: 'Up' | 'Down', betAmount: number) => {
        if (!program || !wallet.publicKey || !state || !nextRound) return;

        try {
            const [vaultPDA] = deriveVaultPDA(programId);
            const [userBetPDA] = deriveUserBetPDA(programId, nextRound.id, wallet.publicKey);
            
            await program.methods
                .placeBet(
                    direction.toLowerCase() === 'up' ? { up: {} } : { down: {} },
                    new BN(betAmount * 1e9)
                )
                .accounts({
                    state: deriveStatePDA(programId)[0],
                    nextRound: state.nextRound,
                    vault: vaultPDA,
                    userBet: userBetPDA,
                    user: wallet.publicKey,
                    feeWallet: FEE_WALLET,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
        } catch (error) {      
            throw new Error(error);
        }
    };

    // Fetch rounds where user won
    const fetchUserWinningRounds = async (startRound: number, endRound: number) => {
        try {
            const rounds: RoundWithUserBet[] = [];
            
            for (let i = startRound; i >= endRound && i >= 0; i--) {
                try {
                    // Get round account
                    const [roundPDA] = deriveRoundPDA(programId, i);
                    const roundAccount = await program.account.round.fetch(roundPDA);
                    
                    // Get user bet for this round if it exists
                    const [userBetPDA] = deriveUserBetPDA(programId, i, wallet.publicKey!);
                    let userBet;
                    try {
                        userBet = await program.account.userBet.fetch(userBetPDA);
                        // If we found a user bet, add the round to our list
                        if (userBet) {
                            const userWon = !roundAccount.isActive && roundAccount.outcome ? 
                            (roundAccount.outcome.up != null && userBet.direction.up != null) ||
                            (roundAccount.outcome.down != null && userBet.direction.down != null) : 
                            false;

                            rounds.push({
                                id: i,
                                startTime: roundAccount.startTime ? new Date(roundAccount.startTime.toNumber() * 1000) : null,
                                endTime: roundAccount.endTime ? new Date(roundAccount.endTime.toNumber() * 1000) : null,
                                startPrice: roundAccount.startPrice ? roundAccount.startPrice.toNumber() / 1e8 : null,
                                endPrice: roundAccount.endPrice ? roundAccount.endPrice.toNumber() / 1e8 : null,
                                totalBetsUp: roundAccount.totalBetsUp.toNumber() / 1e9,
                                totalBetsDown: roundAccount.totalBetsDown.toNumber() / 1e9,
                                isActive: roundAccount.isActive,
                                outcome: roundAccount.outcome ? roundAccount.outcome.up ? 'Up' : 'Down' : null,
                                totalPool: roundAccount.totalPool.toNumber() / 1e9,
                                winningPool: roundAccount.winningPool.toNumber() / 1e9,
                                userBet: {
                                    amount: userBet.amount.toNumber() / 1e9,
                                    direction: userBet.direction.up ? 'Up' : 'Down',
                                    claimed: userBet.claimed
                                },
                                userWon
                            });
                        }
                    } catch {
                        // No user bet for this round, continue to next round
                        continue;
                    }
                } catch (e) {
                    continue;
                }
            }

            return rounds.sort((a, b) => b.id - a.id);
            
        } catch (error) {
            console.error("Error fetching user rounds:", error);
            return [];
        }
    };

    // Claim winnings for a specific round
    const claimWinnings = async (roundId: number) => {
        if (!program || !wallet.publicKey) return;

        try {
            const [roundPDA] = deriveRoundPDA(programId, roundId);
            const [vaultPDA] = deriveVaultPDA(programId);
            const [userBetPDA] = deriveUserBetPDA(programId, roundId, wallet.publicKey);

            const claim = program.methods.claimWinnings()
                .accounts({
                    round: roundPDA,
                    userBet: userBetPDA,
                    vault: vaultPDA,
                    user: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc()

                toast.promise(claim, {
                    loading: { 
                        title: "Claiming Winnings",
                        position: "top-right",
                        description: "Winnings are being claimed."
                    },
                    success: { 
                        title: "Winnings Claimed",
                        position: "top-right",
                        description: "Winnings have been claimed."
                    },
                    error: { 
                        title: "Error Claiming",
                        position: "top-right",
                        description: "Please try again or contact the team if you need help.",
                    }
                });

                await claim
        } catch (error) {
            console.error("Error claiming winnings:", error);
            toast({
                title: "Error Claiming",
                position: "top-right",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true 
            });
        }
    };

    const canClaim = async (roundId: number): Promise<boolean> => {
        if (!program || !wallet.publicKey) return false;

        try {
            // Get round account
            const [roundPDA] = deriveRoundPDA(programId, roundId);
            const round = await program.account.round.fetch(roundPDA);

            // If round is still active or has no outcome, can't claim
            if (round.isActive || !round.outcome) {
                return false;
            }

            // Check if user bet exists and matches winning direction
            const [userBetPDA] = deriveUserBetPDA(programId, roundId, wallet.publicKey);
            try {
                const userBet = await program.account.userBet.fetch(userBetPDA);
                
                // Check if bet hasn't been claimed and matches winning direction
                return (!userBet.claimed && 
                       ((round.outcome.up && userBet.direction.up) || 
                        (round.outcome.down && userBet.direction.down)));
            } catch {
                // If user bet account doesn't exist, they can't claim
                return false;
            }
        } catch (error) {
            console.error("Error checking claim eligibility:", error);
            return false;
        }
    };

    return (
        <div>
            <div>
                <Header />
                <Container px={{ "base":3, "sm":4, "md":8, "2xl":0 }} maxW={"8xl"}>
                    <Flex mt={8} justifyContent={"space-between"} alignItems={{base:"center",sm:"end"}} flexDirection={{base:"column", sm:"row"}}>
                        <Box fontSize={"lg"} shadow={"sm"} backgroundColor={"gray.50"} maxWidth={'fit-content'} borderRadius={"md"} p={4} borderWidth={2} borderColor={"gray.200"}>
                            <Flex alignItems="center">
                                <Image src={solana} h="24px" mr={2} />
                                <Text color="#280d5f" fontWeight="600" fontSize={"xl"}>SOL: ${solPrice.toPrecision(5)}</Text>
                            </Flex>
                        </Box>
                        <Flex mt={{base:3,sm:0}} alignItems="end">
                            <Button isDisabled={!wallet.connected} fontSize={"lg"} shadow={"sm"} backgroundColor={"gray.50"} maxWidth={'fit-content'} borderRadius={"md"} p={4} borderWidth={2} borderColor={"gray.200"} leftIcon={<FaHistory />} onClick={onHistoryOpen}>History</Button>
                            <IconButton ml={2} aria-label='FAQ' fontSize={"lg"} shadow={"sm"} backgroundColor={"gray.50"} maxWidth={'fit-content'} borderRadius={"md"} p={4} borderWidth={2} borderColor={"gray.200"} onClick={onHelpOpen} icon={<FaRegQuestionCircle />} />
                        </Flex>
                    </Flex>
                
                    <Alert mt={3} fontSize={"lg"} borderRadius={"md"}>The game is in DEMO mode right now. We are running a launch for our token and game launch. Join Telegram for updates.</Alert>
                    <Box><Container maxW={"8xl"} backgroundColor={"gray.50"} borderRadius={"md"} p={6} borderWidth={1} borderColor={"gray.200"} mt={4} height={"100%"} justifyContent={"center"} width={"100%"}>
                    {state && currentRound ? <div><Swiper
                    modules={[Mousewheel,Keyboard]}
                    slidesPerView={'auto'}
                    centeredSlides={true}
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    spaceBetween={30}
                    initialSlide={3}
                    fadeEffect={{
                        crossFade: true
                    }}
                    mousewheel={{
                        forceToAxis: true,
                        sensitivity: 0.5,
                        thresholdDelta: 14
                    }}
                    keyboard={true}
                    className="mySwiper"

                >
                    {expiredRounds.map((round, index) => (
                        <SwiperSlide className="swiper-slide" key={index}>
                            <ExpiredCard roundId={round?.id} betsUp={round?.totalBetsUp}  betsDown={round?.totalBetsDown} startPrice={round?.startPrice} endPrice={round?.endPrice} outcome={round?.outcome} userBet={() => round ? fetchUserBet(round.id) : Promise.resolve(null)} onClaimWinnings={() => round ? claimWinnings(round.id) : null} canClaim={async () => { if (!round) return false; const canClaimResult = await canClaim(round.id); return canClaimResult && !(await fetchUserBet(round.id))?.claimed}}  />
                        </SwiperSlide>
                    ))}
                    <SwiperSlide className="swiper-slide">
                    <LiveCard 
                        roundId={currentRound?.id}
                        betsUp={currentRound?.totalBetsUp}
                        lastPrice={solPrice}
                        userBet={() => currentRound ? fetchUserBet(currentRound.id) : Promise.resolve(null)}
                        openPrice={currentRound?.startPrice}
                        betsDown={currentRound?.totalBetsDown}
                        direction={{
                            dir: (solPrice > (currentRound?.startPrice ?? 0)) ? 'up' : 'down',
                            variance: Math.abs(solPrice - (currentRound?.startPrice ?? 0)).toFixed(3)
                        }}
                        endTime={currentRound?.endTime}
                    />
                    </SwiperSlide>
                    <SwiperSlide className="swiper-slide">
                    <NextCard
                        lockTime={currentRound?.endTime}
                        betsUp={nextRound?.totalBetsUp}
                        userBet={() => nextRound ? fetchUserBet(nextRound.id) : Promise.resolve(null)}
                        betsDown={nextRound?.totalBetsDown}
                        roundId={nextRound?.id} 
                        onPlaceBet={placeBet} />
                    </SwiperSlide>
                    {[1, 2].map((roundPlus, index) => (
                        <SwiperSlide key={index} className="swiper-slide">
                        <LaterCard
                            roundId={Number((nextRound?.id ?? 0) + roundPlus)} 
                            startTime={new Date((currentRound?.startTime?.getTime() ?? Date.now()) + (roundPlus * 3600 * 1000))} />
                        </SwiperSlide>
                    ))}
                    </Swiper>
                    <Flex width={"100%"} justifyContent={"center"}>
                        <IconButton colorScheme="purple" onClick={() => swiperInstance?.slidePrev() } shadow={"md"} mr={2} size="lg" aria-label='Left' icon={<FaArrowLeft />} />
                        <IconButton colorScheme="purple" onClick={() => swiperInstance?.slideNext() } shadow={"md"} ml={2} size="lg" aria-label='Right' icon={<FaArrowRight />} />
                    </Flex></div> : <Spinner />}
                    </Container></Box>
                    <Flex backgroundColor={"gray.50"} borderRadius={"md"} p={0} borderWidth={2} borderColor={"gray.200"} height={"100%"} justifyContent={"center"} width={"100%"} mt={6} minHeight={600} height={"100%"}>
                        <TView />
                    </Flex>
                </Container>
                <Footer />
                <HistoryDrawer
                    isOpen={isHistoryOpen}
                    onClose={onHistoryClose}
                    onClaimWinnings={claimWinnings}
                    currentRoundId={currentRound?.id || 0}
                    fetchMoreHistory={async (currentCount) => {
                        const [statePDA] = deriveStatePDA(programId);
                        const state = await program.account.state.fetch(statePDA);
                        const rounds = await fetchUserWinningRounds(
                            state.currentRoundId.toNumber() - 1 - currentCount,
                            Math.max(0, state.currentRoundId.toNumber() - (currentCount + 11))
                        );
                        return rounds;
                    }}
                    canClaim={canClaim}
                />
                <PlayModal 
                    isOpen={isHelpOpen}
                    onClose={onHelpClose}
                />
            </div>
        </div>
    );
}
