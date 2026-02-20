import React, { useEffect, useState, useRef } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    Input,
    InputGroup,
    InputLeftElement,
    VStack,
    HStack,
    Text,
    Box,
    Icon,
    Kbd,
} from "@chakra-ui/react";
import { FaSearch, FaRobot, FaMagic, FaFolderOpen, FaRegKeyboard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            setQuery(""); // Reset query on open
        }
    }, [isOpen]);

    // Handle global keyboard shortcut (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                } else {
                    // Open would be handled by a higher level component / context usually, 
                    // but if we expose a global context for the palette, it goes there.
                    // For now, App.js handles opening.
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Mock search results / Commands
    const getFilteredCommands = () => {
        const lowerQuery = query.toLowerCase();

        const staticCommands = [
            { id: "ai-summarize", icon: <FaMagic />, title: "Summarize this workspace", section: "AI Actions", action: () => { console.log("AI trigger"); onClose(); } },
            { id: "ai-draft", icon: <FaRobot />, title: "Draft a new document", section: "AI Actions", action: () => { console.log("AI trigger"); onClose(); } },
            { id: "nav-dash", icon: <FaFolderOpen />, title: "Go to Dashboard", section: "Navigation", action: () => { navigate("/dashboard"); onClose(); } },
            { id: "nav-projects", icon: <FaFolderOpen />, title: "View all projects", section: "Navigation", action: () => { navigate("/dashboard"); onClose(); } },
        ];

        if (!query) return staticCommands;

        return staticCommands.filter(c => c.title.toLowerCase().includes(lowerQuery));
    };

    const currentCommands = getFilteredCommands();
    const groupedCommands = currentCommands.reduce((acc, cmd) => {
        if (!acc[cmd.section]) acc[cmd.section] = [];
        acc[cmd.section].push(cmd);
        return acc;
    }, {});

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" motionPreset="none">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />

            <AnimatePresence>
                {isOpen && (
                    <ModalContent
                        as={motion.div}
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        containerProps={{
                            justifyContent: "flex-start",
                            paddingTop: "15vh"
                        }}
                        bg="rgba(15, 15, 20, 0.85)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        boxShadow="0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
                        borderRadius="16px"
                        backdropFilter="blur(30px)"
                        overflow="hidden"
                    >
                        {/* Search Input */}
                        <Box borderBottom="1px solid rgba(255, 255, 255, 0.08)" p={4}>
                            <InputGroup size="lg">
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={FaSearch} color="blue.400" />
                                </InputLeftElement>
                                <Input
                                    ref={inputRef}
                                    variant="unstyled"
                                    placeholder="Ask AI or type a command..."
                                    color="white"
                                    fontSize="lg"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    _placeholder={{ color: "whiteAlpha.400" }}
                                />
                            </InputGroup>
                        </Box>

                        {/* Results Area */}
                        <Box maxH="60vh" overflowY="auto" p={2} sx={{
                            "&::-webkit-scrollbar": { width: "4px" },
                            "&::-webkit-scrollbar-track": { bg: "transparent" },
                            "&::-webkit-scrollbar-thumb": { bg: "whiteAlpha.200", borderRadius: "4px" },
                        }}>
                            {Object.keys(groupedCommands).length === 0 ? (
                                <VStack py={8} spacing={3} color="whiteAlpha.500">
                                    <Icon as={FaRegKeyboard} boxSize={8} opacity={0.5} />
                                    <Text fontSize="sm">No commands found for "{query}"</Text>
                                </VStack>
                            ) : (
                                Object.entries(groupedCommands).map(([section, cmds]) => (
                                    <Box key={section} mb={4}>
                                        <Text
                                            fontSize="xs"
                                            fontWeight="bold"
                                            color="whiteAlpha.400"
                                            textTransform="uppercase"
                                            letterSpacing="wider"
                                            px={3}
                                            py={2}
                                        >
                                            {section}
                                        </Text>
                                        <VStack align="stretch" spacing={1}>
                                            {cmds.map((cmd) => (
                                                <MotionBox
                                                    key={cmd.id}
                                                    px={3}
                                                    py={3}
                                                    borderRadius="8px"
                                                    display="flex"
                                                    alignItems="center"
                                                    cursor="pointer"
                                                    bg="transparent"
                                                    color="whiteAlpha.800"
                                                    whileHover={{
                                                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                                                        color: "white"
                                                    }}
                                                    onClick={cmd.action}
                                                >
                                                    <Box color="blue.400" mr={3}>
                                                        {cmd.icon}
                                                    </Box>
                                                    <Text fontSize="sm" fontWeight="500">
                                                        {cmd.title}
                                                    </Text>
                                                </MotionBox>
                                            ))}
                                        </VStack>
                                    </Box>
                                ))
                            )}
                        </Box>

                        {/* Footer */}
                        <HStack
                            px={4}
                            py={3}
                            borderTop="1px solid rgba(255, 255, 255, 0.05)"
                            bg="rgba(0,0,0,0.2)"
                            justify="space-between"
                        >
                            <HStack spacing={4}>
                                <HStack spacing={1}>
                                    <Kbd bg="whiteAlpha.200" color="whiteAlpha.700" borderColor="whiteAlpha.300">↑</Kbd>
                                    <Kbd bg="whiteAlpha.200" color="whiteAlpha.700" borderColor="whiteAlpha.300">↓</Kbd>
                                    <Text fontSize="xs" color="whiteAlpha.500">to navigate</Text>
                                </HStack>
                                <HStack spacing={1}>
                                    <Kbd bg="whiteAlpha.200" color="whiteAlpha.700" borderColor="whiteAlpha.300">enter</Kbd>
                                    <Text fontSize="xs" color="whiteAlpha.500">to select</Text>
                                </HStack>
                            </HStack>
                            <Text fontSize="xs" color="blue.400" fontWeight="bold">
                                AI Powered
                            </Text>
                        </HStack>

                    </ModalContent>
                )}
            </AnimatePresence>
        </Modal>
    );
};

export default CommandPalette;
