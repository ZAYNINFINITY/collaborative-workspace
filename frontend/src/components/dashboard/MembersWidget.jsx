import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  AvatarGroup,
  Badge,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";

const MembersWidget = ({ members, loading }) => {
  // ✨ Gemini Color Tokens
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  const textSecondary = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

  const getRoleColors = (role) => {
    switch (role) {
      case "admin":
        return {
          bg: "rgba(147, 51, 234, 0.2)",
          color: "#a78bfa",
          border: "rgba(147, 51, 234, 0.3)",
        };
      case "owner":
        return {
          bg: "rgba(34, 197, 94, 0.2)",
          color: "#86efac",
          border: "rgba(34, 197, 94, 0.3)",
        };
      case "member":
      default:
        return {
          bg: "rgba(59, 130, 246, 0.2)",
          color: "#93c5fd",
          border: "rgba(59, 130, 246, 0.3)",
        };
    }
  };

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
        <HStack spacing={3}>
          <SkeletonCircle size="8" />
          <SkeletonCircle size="8" />
          <SkeletonCircle size="8" />
        </HStack>
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
        Active Members ({members.length})
      </Heading>
      {members.length === 0 ? (
        <Text fontSize="sm" color={textTertiary}>
          No members yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          <AvatarGroup size="md" max={5}>
            {members.map((member) => (
              <Avatar
                key={member.user._id}
                name={member.user.displayName || member.user.username}
                src={member.user.avatar}
                bg="rgba(59, 130, 246, 0.3)"
              />
            ))}
          </AvatarGroup>
          <VStack align="stretch" spacing={2}>
            {members.slice(0, 3).map((member) => {
              const roleColors = getRoleColors(member.role);
              return (
                <HStack key={member.user._id} justify="space-between">
                  <HStack spacing={2}>
                    <Avatar
                      size="xs"
                      name={member.user.displayName || member.user.username}
                      src={member.user.avatar}
                      bg="rgba(59, 130, 246, 0.3)"
                    />
                    <Text fontSize="sm" color={textPrimary}>
                      {member.user.displayName || member.user.username}
                    </Text>
                  </HStack>
                  <Badge
                    size="sm"
                    bg={roleColors.bg}
                    color={roleColors.color}
                    border={`1px solid ${roleColors.border}`}
                    fontWeight="600"
                    fontSize="xs"
                  >
                    {member.role}
                  </Badge>
                </HStack>
              );
            })}
            {members.length > 3 && (
              <Text fontSize="xs" color={textTertiary}>
                +{members.length - 3} more members
              </Text>
            )}
          </VStack>
        </VStack>
      )}
    </Box>
  );
};

export default MembersWidget;
