import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Avatar,
  Flex,
} from "@chakra-ui/react";
import { FaPaperPlane } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const ChatRoom = ({ workspaceId, messages, onMessageSent }) => {
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveMessages, setLiveMessages] = useState(messages);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  // ✨ Gemini Color Tokens
  const textPrimary = "white";
  // const textSecondary = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const inputBg = "rgba(26, 26, 31, 0.4)";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [liveMessages]);

  // Update live messages when prop changes
  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Listen for real-time messages
  useEffect(() => {
    socket.on("message:new", (message) => {
      setLiveMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("message:new");
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      const res = await API.post(`/workspaces/${workspaceId}/messages`, {
        content: newMessage,
      });
      setNewMessage("");

      // Emit socket event for real-time broadcast
      socket.emit("message:send", {
        workspaceId,
        message: res.data,
      });

      // Update local state immediately
      setLiveMessages((prev) => [...prev, res.data]);
      onMessageSent && onMessageSent(res.data);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if message is from current user
  const isOwnMessage = (msg) => {
    return currentUser && msg.author._id === currentUser._id;
  };

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor="rgba(255, 255, 255, 0.05)"
      borderRadius="16px"
      p={4}
      h="600px"
      display="flex"
      flexDirection="column"
      backdrop="blur(20px)"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      transition="all 0.3s ease"
    >
      <VStack spacing={0} align="stretch" flex={1} overflow="hidden">
        {/* Header */}
        <VStack
          align="stretch"
          spacing={3}
          pb={3}
          borderBottom="1px solid rgba(255, 255, 255, 0.05)"
          mb={3}
        >
          <Text fontWeight="700" fontSize="lg" color={textPrimary}>
            Team Chat
          </Text>
          <Text fontSize="xs" color={textTertiary}>
            Real-time collaboration {liveMessages.length} messages
          </Text>
        </VStack>

        {/* Messages Container */}
        <VStack
          flex={1}
          overflowY="auto"
          align="stretch"
          spacing={3}
          pr={2}
          css={{
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          {liveMessages.length === 0 ? (
            <Flex flex={1} align="center" justify="center" minH="200px">
              <VStack spacing={2} textAlign="center">
                <Text fontSize="sm" color={textTertiary}>
                  No messages yet
                </Text>
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.3)">
                  Start the conversation with your team
                </Text>
              </VStack>
            </Flex>
          ) : (
            liveMessages.map((msg, index) => {
              const isOwn = isOwnMessage(msg);
              const prevMsg = index > 0 ? liveMessages[index - 1] : null;
              const isSameAuthor =
                prevMsg && prevMsg.author._id === msg.author._id;
              const showAvatar = !isSameAuthor;

              return (
                <Box key={msg._id} w="100%" animation="0.3s ease-in">
                  <Flex
                    align={isOwn ? "flex-end" : "flex-start"}
                    justify={isOwn ? "flex-end" : "flex-start"}
                    gap={2}
                    mb={1}
                  >
                    {!isOwn && showAvatar && (
                      <Avatar
                        size="sm"
                        src={msg.author?.avatarUrl}
                        name={msg.author?.displayName || msg.author?.username}
                        flexShrink={0}
                      />
                    )}
                    {!isOwn && !showAvatar && <Box w="32px" flexShrink={0} />}

                    <VStack
                      align={isOwn ? "flex-end" : "flex-start"}
                      spacing={1}
                      flex={1}
                    >
                      {showAvatar && (
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color={textSecondary}
                        >
                          {msg.author?.displayName || msg.author?.username}
                        </Text>
                      )}

                      <Box
                        bg={
                          isOwn
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(255, 255, 255, 0.05)"
                        }
                        borderWidth="1px"
                        borderColor={
                          isOwn
                            ? "rgba(59, 130, 246, 0.3)"
                            : "rgba(255, 255, 255, 0.08)"
                        }
                        borderRadius="12px"
                        px={3}
                        py={2}
                        maxW="70%"
                        transition="all 0.2s ease"
                        _hover={{
                          bg: isOwn
                            ? "rgba(59, 130, 246, 0.25)"
                            : "rgba(255, 255, 255, 0.08)",
                          borderColor: isOwn
                            ? "rgba(59, 130, 246, 0.4)"
                            : "rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <Text
                          fontSize="sm"
                          color={textPrimary}
                          lineHeight="1.5"
                          wordBreak="break-word"
                        >
                          {msg.content}
                        </Text>
                      </Box>

                      {showAvatar && (
                        <Text fontSize="xs" color={textTertiary} mt={1}>
                          {new Date(
                            msg.createdAt || msg.updatedAt,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                    </VStack>
                  </Flex>
                </Box>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </VStack>

        {/* Message Input */}
        <Box
          as="form"
          onSubmit={handleSendMessage}
          w="100%"
          pt={3}
          borderTop="1px solid rgba(255, 255, 255, 0.05)"
        >
          <HStack spacing={2}>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              bg={inputBg}
              borderColor="rgba(255, 255, 255, 0.1)"
              color={textPrimary}
              fontSize="sm"
              flex={1}
              disabled={loading}
              _placeholder={{ color: textTertiary }}
              _focus={{
                bg: "rgba(26, 26, 31, 0.6)",
                borderColor: "rgba(59, 130, 246, 0.5)",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
              }}
              _disabled={{
                opacity: 0.5,
              }}
            />
            <Button
              type="submit"
              bg="rgba(59, 130, 246, 0.2)"
              color="#3b82f6"
              borderWidth="1px"
              borderColor="rgba(59, 130, 246, 0.3)"
              size="sm"
              isLoading={loading}
              leftIcon={<FaPaperPlane />}
              transition="all 0.2s ease"
              _hover={{
                bg: "rgba(59, 130, 246, 0.3)",
                borderColor: "rgba(59, 130, 246, 0.4)",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
              }}
              _disabled={{
                opacity: 0.5,
              }}
            >
              Send
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default ChatRoom;

