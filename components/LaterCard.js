import React, { useEffect, useState } from 'react'
import later from '../assets/images/later.svg'
import up from '../assets/images/up.svg'
import downdisable from '../assets/images/downdisable.svg'
import { 
    Box, 
    Flex, 
    Image, 
    Text,
    Card as ChakraCard, 
    CardHeader, 
    CardBody,
} from '@chakra-ui/react'

export default function LaterCard({ 
    roundId,
    startTime
}) {
    const [timeLeft, setTimeLeft] = useState("00:00")
    
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime()
            const start = new Date(startTime).getTime()
            const diff = start - now
            
            if (diff <= 0) {
                setTimeLeft('00:00')
                clearInterval(timer)
                return
            }
            
            // Convert to minutes and seconds
            const minutes = Math.floor(diff / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
            
            // Format time
            const formattedMinutes = String(minutes).padStart(2, '0')
            const formattedSeconds = String(seconds).padStart(2, '0')
            
            setTimeLeft(`${formattedMinutes}:${formattedSeconds}`)
        }, 1000)
        return () => clearInterval(timer)
    }, [startTime])

    return (
        <Box maxWidth={320} minWidth={300} height="100%">
            <ChakraCard opacity={0.5} transition="opacity 0.5s ease" _hover={{opacity: 1}} borderRadius="15px" height="100%" display="flex" flexDirection="column">
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
                        <Image src={later} mr="2" />
                        <Text>Round #{roundId}</Text>
                    </Flex>
                    <Text color="#ed4b9e" fontSize="16px" fontWeight="600">Later</Text>
                </CardHeader>

                <CardBody display="flex" flexDirection="column" justifyContent="center" flex="1">
                    {/* Up Section */}
                    <Box position="relative" h="65px">
                        <Image src={up} mx="auto" w="240px" />
                        <Flex
                            position="absolute"
                            inset="0"
                            alignItems="center"
                            justifyContent="end"
                            direction="column"
                            pb={4}
                        >
                            <Text 
                                color="gray.500"
                                fontWeight="700" 
                                textTransform="uppercase"
                                fontSize="20px"
                                lineHeight="1"
                            >
                                Up
                            </Text>
                        </Flex>
                    </Box>

                    {/* Entry Time Section */}
                    <Box 
                        borderRadius="16px" 
                        p="2px"
                        bg="#7645d9"
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
                                Entry starts in
                            </Text>
                            <Text color="#280d5f" fontWeight="700" fontSize="24px">
                                ~{timeLeft}
                            </Text>
                        </Box>
                    </Box>

                    {/* Down Section */}
                    <Box position="relative" h="65px">
                        <Image src={downdisable} mx="auto" w="240px" />
                        <Flex
                            position="absolute"
                            inset="0"
                            alignItems="center"
                            justifyContent="start"
                            direction="column"
                            pt={4}
                        >
                            <Text 
                                color="gray.500"
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
        </Box>
    )
}
