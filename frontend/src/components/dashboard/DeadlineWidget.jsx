import React, { useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Progress,
  Badge,
  Skeleton,
} from "@chakra-ui/react";
import { FaCalendarAlt } from "react-icons/fa";

const DeadlineWidget = ({ deadline, loading }) => {
  // ✨ Gemini Color Tokens
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  const textSecondary = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

  const deadlineInfo = useMemo(() => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;

    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));

    let status = "upcoming";
    let accentColor = "#3b82f6";
    let progress = 0;

    if (timeDiff < 0) {
      status = "overdue";
      accentColor = "#ef4444";
      progress = 100;
    } else if (daysLeft <= 1) {
      status = "urgent";
      accentColor = "#f97316";
      progress = 90;
    } else if (daysLeft <= 7) {
      status = "soon";
      accentColor = "#fbbf24";
      progress = 70;
    } else {
      accentColor = "#3b82f6";
      progress = Math.max(0, 100 - (daysLeft / 30) * 100);
    }

    return {
      daysLeft,
      hoursLeft,
      status,
      accentColor,
      progress,
      formattedDate: deadlineDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, [deadline]);

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
        <Skeleton height="40px" mb={4} />
        <Skeleton height="20px" />
      </Box>
    );
  }

  if (!deadline) {
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
          Project Deadline
        </Heading>
        <Text fontSize="sm" color={textTertiary}>
          No deadline set.
        </Text>
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
        Project Deadline
      </Heading>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <HStack spacing={2} color={textSecondary}>
            <FaCalendarAlt color={textSecondary} />
            <Text fontSize="sm" fontWeight="600" color={textPrimary}>
              {deadlineInfo.formattedDate}
            </Text>
          </HStack>
          <Badge
            bg={`${deadlineInfo.accentColor}20`}
            color={deadlineInfo.accentColor}
            border={`1px solid ${deadlineInfo.accentColor}40`}
            fontSize="xs"
            fontWeight="600"
          >
            {deadlineInfo.status === "overdue"
              ? "Overdue"
              : deadlineInfo.daysLeft <= 1
                ? `${deadlineInfo.hoursLeft}h left`
                : `${deadlineInfo.daysLeft}d left`}
          </Badge>
        </HStack>
        <Box>
          <Progress
            value={deadlineInfo.progress}
            sx={{
              "& > div": {
                background: deadlineInfo.accentColor,
              },
            }}
            size="sm"
            bg="rgba(255, 255, 255, 0.1)"
            borderRadius="full"
          />
          <Text fontSize="xs" color={textTertiary} mt={1}>
            Time progress to deadline
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default DeadlineWidget;
