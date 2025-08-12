import React, { useState, useEffect } from 'react'
import play_image from '../assets/images/play_image.svg'
import upgreen from '../assets/images/upgreen.svg'
import uparrow from '../assets/images/uparrow.svg'
import downdisable from '../assets/images/downdisable.svg'
import downarrow from '../assets/images/downarrow.svg'
import down from '../assets/images/down.svg'
import up from '../assets/images/up.svg'
import clock from '../assets/images/clock.svg'
import { 
    Box, 
    Flex, 
    Image, 
    Text,
    Card as ChakraCard, 
    CardHeader, 
    CardBody,
    Progress,
    Tooltip,
} from '@chakra-ui/react'

export default function LiveCard({
    roundId,
    betsUp,
    lastPrice,
    openPrice,
    betsDown,
    direction,
    endTime,
    userBet
}) {
    const [timeLeft, setTimeLeft] = useState('');
    const [progress, setProgress] = useState(100);
    const [bet, setBet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user bet
    useEffect(() => {
        const fetchBet = async () => {
            setIsLoading(true);
            try {
                const betData = await userBet();
                setBet(betData);
            } catch (error) {
                console.error("Error fetching bet:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBet();
    }, [roundId]);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            if (!endTime) return;

            const now = Math.floor(Date.now() / 1000);
            const end = Math.floor(endTime.getTime() / 1000);
            const diff = end - now;
            
            const ROUND_DURATION = 3600; // 1 hour in seconds
            const progressValue = (diff / ROUND_DURATION) * 100;
            setProgress(Math.max(0, Math.min(100, 100 - progressValue)));
            
            if (diff <= 0) {
                setTimeLeft('Ended');
                setProgress(100);
                clearInterval(timer);
            } else {
                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    const totalBets = betsUp + betsDown;
    const oddsUp = betsUp > 0 ? (totalBets / betsUp).toFixed(2) : '0.00';
    const oddsDown = betsDown > 0 ? (totalBets / betsDown).toFixed(2) : '0.00';
    const priceColor = direction.dir === 'up' ? '#31d0aa' : direction.dir === 'down' ? '#ed4b9e' : '#7a6eaa';

    return (
        <Box maxWidth={320} minWidth={{base:250,sm:300}} height="100%">
            <ChakraCard border="2px solid #7645d9" borderRadius="15px" height="100%" display="flex" flexDirection="column">
                <CardHeader
                    display="flex"
                    justifyContent="space-between"
                    borderBottom="none"
                    p="0.5rem 1rem"
                    borderTopRadius="15px"
                    boxShadow={"sm"}
                >
                    <Flex alignItems="center" color="#7645d9" fontSize="16px" fontWeight="700" textTransform="uppercase">
                        <Image src={play_image} mr="2" />
                        <Text>Round #{roundId}</Text>
                    </Flex>
                    <Text color="#7645d9" fontSize="16px" fontWeight="600">{timeLeft}</Text>
                </CardHeader>

                <Progress
                    value={progress}
                    h="8px"
                    bg="#eeeaf4"
                    sx={{
                        '& > div': {
                            background: '#7645d9',
                            transition: 'width 200ms ease'
                        }
                    }}
                    borderRadius="0"
                    isAnimated
                />

                {endTime && Date.now() > endTime.getTime() ? <CardBody display="flex" flexDirection="column" justifyContent="center" flex="1">
                    <Flex justifyContent="center" textAlign={"center"} mb={4} alignItems="center" gap={2}>
                         <Image src={clock} h="24px" />
                         <Text fontSize={"xl"} fontWeight="700">Closing round...</Text>
                    </Flex>
                </CardBody> : <CardBody display="flex" flexDirection="column" justifyContent="center" flex="1">                    {/* Up Section */}
                    <Box position="relative" h="65px">
                        <Image src={direction.dir === 'up' ? upgreen : up} mx="auto" w="240px" />
                        <Flex
                            position="absolute"
                            inset="0"
                            alignItems="center"
                            justifyContent="end"
                            direction="column"
                            pb={2}
                        >
                        {bet && bet.direction === 'Up' && (
                                <Tooltip label={`${Number(bet.amount).toFixed(3)} SOL`} placement='top' hasArrow borderRadius={"md"} fontSize={"md"}><Flex
                                    position="absolute"
                                    bottom="-22px"
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
                                color={direction.dir === 'up' ? "white" : "#31d0aa"}
                                fontWeight="700" 
                                textTransform="uppercase"
                                fontSize="20px"
                                lineHeight="1"
                            >
                                Up
                            </Text>
                            <Flex alignItems="center" gap={1}>
                                <Text color={direction.dir === 'up' ? "white" : "#7a6eaa"} fontWeight="700" fontSize="14px">{oddsUp}x</Text>
                                <Text color={direction.dir === 'up' ? "white" : "#7a6eaa"} fontWeight="600" fontSize="14px">Payout</Text>
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
                            <Text 
                                color="#7a6eaa" 
                                fontWeight="600"
                                textTransform="uppercase"
                                mb="8px"
                                fontSize="12px"
                                textAlign="start"
                            >
                                Last Price
                            </Text>
                            <Flex alignItems="center" justifyContent="space-between" mb="20px">
                                <Text 
                                    color={priceColor} 
                                    fontWeight="600"
                                    fontSize="24px"
                                >
                                    ${lastPrice.toFixed(2)}
                                </Text>
                                <Flex 
                                    bg={priceColor}
                                    borderRadius="4px"
                                    p="4px 8px"
                                >
                                    <Image src={direction.dir === 'up' ? uparrow : downarrow} />
                                    <Text color="white" fontSize="16px" fontWeight="600" ml="4px">
                                        ${direction.variance}
                                    </Text>
                                </Flex>
                            </Flex>
                            <Flex justifyContent="space-between" mb="5px">
                                <Text color="#280d5f" fontWeight="600" fontSize="14px">Open Price:</Text>
                                <Text color="#280d5f" fontWeight="600" fontSize="14px">${(openPrice).toFixed(3)}</Text>
                            </Flex>
                            <Flex justifyContent="space-between">
                                <Text color="#280d5f" fontWeight="700" fontSize="16px">Prize Pool:</Text>
                                <Text color="#280d5f" fontWeight="700" fontSize="16px">{totalBets.toFixed(3)} SOL</Text>
                            </Flex>
                        </Box>
                    </Box>

                    {/* Down Section */}
                    <Box position="relative" h="65px">
                        <Image src={direction.dir === 'down' ? down : downdisable} mx="auto" w="240px" />
                        <Flex
                            position="absolute"
                            inset="0"
                            alignItems="center"
                            justifyContent="start"
                            direction="column"
                            pt={2}
                        >
                             {bet && bet.direction === 'Down' && (
                                <Tooltip label={`${Number(bet.amount).toFixed(3)} SOL`} placement='top' hasArrow borderRadius={"md"} fontSize={"md"}><Flex
                                    position="absolute"
                                    bottom="-14px"
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
                                <Text color={direction.dir === 'down' ? "white" : "#7a6eaa"} fontWeight="700" fontSize="14px">{oddsDown}x</Text>
                                <Text color={direction.dir === 'down' ? "white" : "#7a6eaa"} fontWeight="600" fontSize="14px">Payout</Text>
                            </Flex>
                            <Text 
                                color={direction.dir === 'down' ? "white" : "#ed4b9e"}
                                fontWeight="700"
                                textTransform="uppercase"
                                fontSize="20px"
                                lineHeight="1"
                            >
                                Down
                            </Text>
                        </Flex>
                    </Box>
                </CardBody>}
            </ChakraCard>
        </Box>
    )
}
