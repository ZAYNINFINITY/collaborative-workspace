import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from "@chakra-ui/react";

const ChatPreviewWidget = ({ messages, loading }) => {
  const recentMessages = messages.slice(-5).reverse(); // Get last 5 messages, reverse to show newest first

  // ✨ Gemini Color Tokens
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  // const "rgba(255, 255, 255, 0.7)" = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

  if (loading) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="16px"
        bg={cardBg}
        borderColor={borderColor}
        backdropFilter="blur(12px)"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      >
        <Skeleton height="20px" mb={4} />
        <VStack spacing={3}>
          {[...Array(3)].map((_, i) => (
            <HStack key={i} spacing={3} align="start">
              <SkeletonCircle size="6" />
              <Box flex="1">
                <SkeletonText noOfLines={2} />
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="16px"
      bg={cardBg}
      borderColor={borderColor}
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
      <Heading size="sm" mb={4} color={textPrimary}>
        Recent Chat Messages
      </Heading>
      {recentMessages.length === 0 ? (
        <Text fontSize="sm" color={textTertiary}>
          No messages yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {recentMessages.map((message) => (
            <HStack key={message._id} spacing={3} align="start">
              <Avatar
                size="xs"
                name={message.sender?.displayName || message.sender?.username}
                src={message.sender?.avatar}
                bg="rgba(59, 130, 246, 0.3)"
              />
              <VStack align="start" spacing={0} flex={1}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="600" color={textPrimary}>
                    {message.sender?.displayName || message.sender?.username}
                  </Text>
                  <Text fontSize="xs" color={textTertiary}>
                    {new Date(message.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={"rgba(255, 255, 255, 0.7)"} noOfLines={2}>
                  {message.content}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ChatPreviewWidget;


