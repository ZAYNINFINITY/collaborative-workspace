import React, { useState, useEffect } from "react";
import { Box, VStack, HStack, Avatar, Text, Badge } from "@chakra-ui/react";
import { FaCircle } from "react-icons/fa";
import { socket } from "../socket";

const UserPresence = ({ workspaceId }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ✨ Gemini Color Tokens
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  // const textSecondary = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

  useEffect(() => {
    if (!workspaceId) return;

    // Join workspace room
    socket.emit("joinWorkspace", { workspaceId });

    // Listen for user presence updates
    socket.on("workspace:userJoined", (payload) => {
      if (payload.workspaceId === workspaceId) {
        setOnlineUsers((prev) => {
          const exists = prev.find((u) => u._id === payload.user._id);
          if (!exists) {
            return [...prev, payload.user];
          }
          return prev;
        });
      }
    });

    socket.on("workspace:userLeft", (payload) => {
      if (payload.workspaceId === workspaceId) {
        setOnlineUsers((prev) => prev.filter((u) => u._id !== payload.userId));
      }
    });

    // Simulate initial users (in real app, this would come from API)
    setOnlineUsers([
      {
        _id: "1",
        username: "john_doe",
        displayName: "John Doe",
        avatarUrl: null,
      },
      {
        _id: "2",
        username: "jane_smith",
        displayName: "Jane Smith",
        avatarUrl: null,
      },
    ]);

    return () => {
      socket.off("workspace:userJoined");
      socket.off("workspace:userLeft");
    };
  }, [workspaceId]);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="16px"
      p={4}
      backdropFilter="blur(12px)"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      transition="all 0.2s ease"
      _hover={{
        bg: "rgba(26, 26, 31, 0.7)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        transform: "scale(1.02)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)",
      }}
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Text fontWeight="700" fontSize="sm" color={textPrimary}>
            Online Users
          </Text>
          <Badge
            bg="rgba(34, 197, 94, 0.2)"
            color="#86efac"
            border="1px solid rgba(34, 197, 94, 0.3)"
            fontSize="xs"
            fontWeight="600"
          >
            {onlineUsers.length}
          </Badge>
        </HStack>

        <VStack spacing={2} align="stretch">
          {onlineUsers.map((user) => (
            <HStack key={user._id} spacing={3}>
              <Box position="relative">
                <Avatar
                  size="sm"
                  src={user.avatarUrl}
                  name={user.displayName || user.username}
                  bg="rgba(59, 130, 246, 0.3)"
                />
                <Box
                  position="absolute"
                  bottom={0}
                  right={0}
                  bg="#22c55e"
                  rounded="full"
                  p="1px"
                  border="2px solid rgba(26, 26, 31, 0.8)"
                >
                  <FaCircle size={8} color="white" />
                </Box>
              </Box>
              <VStack spacing={0} align="start" flex={1}>
                <Text fontSize="sm" fontWeight="600" color={textPrimary}>
                  {user.displayName || user.username}
                </Text>
                <Text fontSize="xs" color={textTertiary}>
                  @{user.username}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>

        {onlineUsers.length === 0 && (
          <Text fontSize="sm" color={textTertiary} textAlign="center">
            No users online
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default UserPresence;

