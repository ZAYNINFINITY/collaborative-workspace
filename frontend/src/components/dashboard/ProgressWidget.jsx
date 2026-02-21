import React from "react";
import {
  Box,
  Heading,
  Text,
  Progress,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Skeleton,
  Badge,
} from "@chakra-ui/react";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

const ProgressWidget = ({ tasks, loading }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  // Enhanced analytics
  const overdueTasks = tasks.filter((t) => {
    if (!t.deadline) return false;
    return new Date(t.deadline) < new Date();
  }).length;

  const highPriorityTasks = tasks.filter((t) => t.priority === "high").length;
  const mediumPriorityTasks = tasks.filter(
    (t) => t.priority === "medium",
  ).length;
  const lowPriorityTasks = tasks.filter((t) => t.priority === "low").length;

  const progressPercent =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="16px"
        bg="rgba(26, 26, 31, 0.5)"
        borderColor="rgba(255, 255, 255, 0.05)"
        backdropFilter="blur(12px)"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      >
        <Skeleton height="20px" mb={4} />
        <Skeleton height="40px" mb={4} />
        <Skeleton height="20px" />
      </Box>
    );
  }

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="16px"
      bg="rgba(26, 26, 31, 0.5)"
      borderColor="rgba(255, 255, 255, 0.05)"
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
      <Heading size="sm" mb={4}>
        Task Progress
      </Heading>
      <VStack align="stretch" spacing={4}>
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm">Overall Completion</Text>
            <Text fontSize="sm" fontWeight="bold">
              {completedTasks}/{totalTasks}
            </Text>
          </HStack>
          <Progress value={progressPercent} colorScheme="blue" size="lg" />
        </Box>
        <HStack spacing={4}>
          <Stat size="sm">
            <StatLabel fontSize="xs">
              <HStack>
                <FaCheckCircle color="green" />
                <Text>Done</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="lg">{completedTasks}</StatNumber>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="xs">
              <HStack>
                <FaClock color="orange" />
                <Text>In Progress</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="lg">{inProgressTasks}</StatNumber>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="xs">
              <HStack>
                <FaExclamationTriangle color="red" />
                <Text>To Do</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="lg">{todoTasks}</StatNumber>
          </Stat>
        </HStack>

        {/* Enhanced Analytics */}
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.600">
              Priority Distribution:
            </Text>
            <HStack spacing={1}>
              <Badge colorScheme="red" fontSize="xs">
                H: {highPriorityTasks}
              </Badge>
              <Badge colorScheme="orange" fontSize="xs">
                M: {mediumPriorityTasks}
              </Badge>
              <Badge colorScheme="green" fontSize="xs">
                L: {lowPriorityTasks}
              </Badge>
            </HStack>
          </HStack>
          {overdueTasks > 0 && (
            <HStack justify="space-between">
              <Text fontSize="xs" color="red.600">
                Overdue Tasks:
              </Text>
              <Badge colorScheme="red" fontSize="xs">
                {overdueTasks}
              </Badge>
            </HStack>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default ProgressWidget;


