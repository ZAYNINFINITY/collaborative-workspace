import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { FaFileAlt, FaFileImage, FaFilePdf } from "react-icons/fa";

const FileUploadsWidget = ({ documents, loading }) => {
  const recentDocuments = documents.slice(0, 5);

  // ✨ Gemini Color Tokens
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  const textSecondary = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext))
      return <FaFileImage color="#3b82f6" />;
    if (ext === "pdf") return <FaFilePdf color="#ef4444" />;
    return <FaFileAlt color="#6b7280" />;
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
        <VStack spacing={3}>
          {[...Array(3)].map((_, i) => (
            <HStack key={i} spacing={3}>
              <Skeleton height="16px" width="16px" />
              <SkeletonText noOfLines={1} flex="1" />
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
        Latest File Uploads
      </Heading>
      {recentDocuments.length === 0 ? (
        <Text fontSize="sm" color={textTertiary}>
          No files uploaded yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {recentDocuments.map((doc) => (
            <HStack key={doc._id} spacing={3} align="center">
              {getFileIcon(doc.name)}
              <VStack align="start" spacing={0} flex="1">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color={textPrimary}
                  noOfLines={1}
                >
                  {doc.name}
                </Text>
                <Text fontSize="xs" color={textTertiary}>
                  {new Date(doc.createdAt).toLocaleDateString()}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default FileUploadsWidget;
