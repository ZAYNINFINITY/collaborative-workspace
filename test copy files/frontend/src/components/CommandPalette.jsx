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
  Button,
} from "@chakra-ui/react";
import { FaSearch, FaRobot, FaMagic, FaFolderOpen, FaRegKeyboard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api";

const MotionBox = motion(Box);

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setQuery("");
      setError(null);
    }
  }, [isOpen]);

    // Handle global keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const askAI = async () => {
    if (!query.trim() || isAsking) {
      return;
    }

    const userMessage = query.trim();
    setQuery("");
    setError(null);
    setIsAsking(true);
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await API.post("/ai/chat", { message: userMessage });
      const reply =
        res.data?.reply || "I could not generate a response right now.";
      setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.msg ||
        "AI request failed.";
      setError(message);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${message}`,
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const staticCommands = [
    {
      id: "ai-summarize",
      icon: <FaMagic />,
      title: "Summarize this workspace",
      section: "AI Actions",
      action: () => setQuery("Summarize the current workspace and next actions."),
    },
    {
      id: "ai-draft",
      icon: <FaRobot />,
      title: "Draft project update",
      section: "AI Actions",
      action: () => setQuery("Draft a short project status update for my team."),
    },
    {
      id: "nav-dash",
      icon: <FaFolderOpen />,
      title: "Go to Dashboard",
      section: "Navigation",
      action: () => {
        navigate("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-projects",
      icon: <FaFolderOpen />,
      title: "View all workspaces",
      section: "Navigation",
      action: () => {
        navigate("/workspaces");
        onClose();
      },
    },
  ];

  const lowerQuery = query.toLowerCase();
  const currentCommands = query
    ? staticCommands.filter((c) => c.title.toLowerCase().includes(lowerQuery))
    : staticCommands;
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
              paddingTop: "15vh",
            }}
            bg="rgba(15, 15, 20, 0.85)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
            borderRadius="16px"
            backdropFilter="blur(30px)"
            overflow="hidden"
          >
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                  _placeholder={{ color: "whiteAlpha.400" }}
                />
              </InputGroup>
            </Box>

            <Box
              maxH="60vh"
              overflowY="auto"
              p={3}
              sx={{
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { bg: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  bg: "whiteAlpha.200",
                  borderRadius: "4px",
                },
              }}
            >
              {chatHistory.length > 0 && (
                <VStack align="stretch" spacing={3} mb={4}>
                  {chatHistory.map((msg, idx) => (
                    <Box
                      key={`${msg.role}-${idx}`}
                      bg={
                        msg.role === "user"
                          ? "rgba(59, 130, 246, 0.2)"
                          : "rgba(255, 255, 255, 0.06)"
                      }
                      borderRadius="10px"
                      px={3}
                      py={2}
                    >
                      <Text
                        fontSize="xs"
                        color="whiteAlpha.600"
                        textTransform="uppercase"
                        mb={1}
                      >
                        {msg.role === "user" ? "You" : "AI"}
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.900" whiteSpace="pre-wrap">
                        {msg.content}
                      </Text>
                    </Box>
                  ))}
                  {isAsking && (
                    <Text fontSize="sm" color="whiteAlpha.600">
                      AI is thinking...
                    </Text>
                  )}
                </VStack>
              )}

              {Object.keys(groupedCommands).length === 0 && !chatHistory.length ? (
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
                            color: "white",
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

            <HStack
              px={4}
              py={3}
              borderTop="1px solid rgba(255, 255, 255, 0.05)"
              bg="rgba(0,0,0,0.2)"
              justify="space-between"
            >
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Kbd bg="whiteAlpha.200" color="whiteAlpha.700" borderColor="whiteAlpha.300">
                    enter
                  </Kbd>
                  <Text fontSize="xs" color="whiteAlpha.500">
                    ask AI
                  </Text>
                </HStack>
                <Button
                  size="xs"
                  colorScheme="blue"
                  onClick={askAI}
                  isLoading={isAsking}
                >
                  Ask
                </Button>
              </HStack>
              <Text fontSize="xs" color={error ? "red.300" : "blue.400"} fontWeight="bold">
                {error || "AI Powered"}
              </Text>
            </HStack>
          </ModalContent>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default CommandPalette;
