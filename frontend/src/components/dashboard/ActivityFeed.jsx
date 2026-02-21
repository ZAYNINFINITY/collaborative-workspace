import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
} from "@chakra-ui/react";
import { FaFileAlt, FaComment, FaTasks, FaUserPlus } from "react-icons/fa";
import API from "../../api";

const ActivityFeed = ({ workspaceId, loading: parentLoading }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✨ Gemini Color Tokens
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  // const "rgba(255, 255, 255, 0.7)" = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

  const getActivityIcon = (type) => {
    switch (type) {
      case "task_created":
      case "task_updated":
        return <FaTasks color="#3b82f6" />;
      case "message_sent":
        return <FaComment color="#10b981" />;
      case "document_uploaded":
        return <FaFileAlt color="#9333ea" />;
      case "member_joined":
        return <FaUserPlus color="#f97316" />;
      default:
        return <FaComment color="#6b7280" />;
    }
  };

  const formatActivityText = (activity) => {
    const user =
      activity.user?.displayName || activity.user?.username || "Someone";
    switch (activity.type) {
      case "task_created":
        return `${user} created a new task: "${activity.details?.title}"`;
      case "task_updated":
        return `${user} updated task: "${activity.details?.title}"`;
      case "message_sent":
        return `${user} sent a message`;
      case "document_uploaded":
        return `${user} uploaded "${activity.details?.name}"`;
      case "member_joined":
        return `${user} joined the workspace`;
      default:
        return `${user} performed an action`;
    }
  };

  useEffect(() => {
    if (!workspaceId) return;

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          `/activities?workspace=${workspaceId}&limit=10`,
        );
        setActivities(res.data || []);
      } catch (err) {
        console.error("Failed to load activities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [workspaceId]);

  if (parentLoading || loading) {
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
          {[...Array(5)].map((_, i) => (
            <HStack key={i} spacing={3} align="start">
              <SkeletonCircle size="8" />
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
        Recent Activity
      </Heading>
      {activities.length === 0 ? (
        <Text fontSize="sm" color={textTertiary}>
          No recent activity yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {activities.map((activity) => (
            <HStack key={activity._id} spacing={3} align="start">
              <Box>{getActivityIcon(activity.type)}</Box>
              <VStack align="start" spacing={0} flex="1">
                <Text fontSize="sm" color={"rgba(255, 255, 255, 0.7)"}>
                  {formatActivityText(activity)}
                </Text>
                <Text fontSize="xs" color={textTertiary}>
                  {new Date(activity.createdAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ActivityFeed;


