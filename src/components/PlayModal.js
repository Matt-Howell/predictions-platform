import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    VStack,
    Box,
    UnorderedList,
    ListItem,
    Divider,
} from '@chakra-ui/react';

const PlayModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size={{base:"full",sm:"lg"}}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>How to Play</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4} align="stretch">
                        <Box>
                            <Text fontWeight="bold" mb={2}>Quick Guide:</Text>
                            <UnorderedList spacing={2}>
                                <ListItem>
                                    Predict if SOL price will go UP or DOWN in the next round
                                </ListItem>
                                <ListItem>
                                    Place your bet in the "Next" card
                                </ListItem>
                                <ListItem>
                                    Each round lasts 1 hour
                                </ListItem>
                                <ListItem>
                                    Win by correctly predicting the price direction
                                </ListItem>
                                <ListItem>
                                    Claim your winnings after round ends
                                </ListItem>
                            </UnorderedList>
                        </Box>

                        <Divider />

                        <Box>
                            <Text fontWeight="bold" mb={2}>Rewards:</Text>
                            <UnorderedList spacing={2}>
                                <ListItem>
                                    Winners share the total prize pool
                                </ListItem>
                                <ListItem>
                                    Higher rewards when betting against the crowd
                                </ListItem>
                                <ListItem>
                                    Minimum position: 0.005 SOL
                                </ListItem>
                                <ListItem>
                                    Maximum position: 10 SOL
                                </ListItem>
                            </UnorderedList>
                        </Box>

                        <Divider />

                        <Box>
                            <Text fontWeight="bold" mb={2}>Tips:</Text>
                            <UnorderedList spacing={2}>
                                <ListItem>
                                    Check historical rounds for price patterns
                                </ListItem>
                                <ListItem>
                                    View live price movement in current round card
                                </ListItem>
                                <ListItem>
                                    Use the price chart below the cards to predict movements
                                </ListItem>
                            </UnorderedList>
                        </Box>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PlayModal;