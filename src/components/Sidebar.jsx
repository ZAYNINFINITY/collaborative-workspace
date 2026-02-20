import React, { useState } from "react";
import { Box, VStack, Button, Text, Tooltip } from "@chakra-ui/react";
import {
  FaHome,
  FaComment,
  FaTasks,
  FaFileAlt,
  FaStickyNote,
  FaHistory,
  FaCode,
  FaUsers,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Sidebar = ({ activeSection, onSectionChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  // ✨ Gemini Color Tokens
  const bg = "rgba(26, 26, 31, 0.8)";
  const hoverBg = "rgba(59, 130, 246, 0.15)";
  const activeBg = "rgba(59, 130, 246, 0.25)";
  const activeGlow = "0 0 30px rgba(59, 130, 246, 0.3)";

  const sections = [
    {
      key: "overview",
      label: "Overview",
      icon: FaHome,
      tooltip: "Workspace overview and statistics",
    },
    {
      key: "chat",
      label: "Chat",
      icon: FaComment,
      tooltip: "Team messaging and discussions",
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: FaTasks,
      tooltip: "Kanban board and task management",
    },
    {
      key: "files",
      label: "Files",
      icon: FaFileAlt,
      tooltip: "File uploads and document storage",
    },
    {
      key: "notes",
      label: "Notes",
      icon: FaStickyNote,
      tooltip: "Quick notes and documentation",
    },
    {
      key: "activity",
      label: "Activity",
      icon: FaHistory,
      tooltip: "Recent workspace activity feed",
    },
    {
      key: "team",
      label: "Team",
      icon: FaUsers,
      tooltip: "Manage team members and invitations",
    },
    {
      key: "code",
      label: "Code",
      icon: FaCode,
      tooltip: "Code repositories and integration",
    },
  ];

  return (
    <>
      {/* ✨ Floating Pill-Style Sidebar */}
      <Box
        position="fixed"
        left="20px"
        top="20px"
        width={isOpen ? "200px" : "68px"}
        bg={bg}
        style={{
          backdropFilter: "blur(12px)",
        }}
        border="1px solid rgba(255, 255, 255, 0.05)"
        borderRadius="24px"
        p={3}
        minH="auto"
        maxH="calc(100vh - 40px)"
        overflowY="auto"
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        zIndex={100}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        display="flex"
        flexDirection="column"
      >
        {/* ✨ Top Spacer & Toggle */}
        <Box display="flex" justifyContent="flex-end" mb={isOpen ? 3 : 2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              boxShadow: "0 0 20px rgba(0, 217, 255, 0.2)",
            }}
            icon={isOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          />
        </Box>

        {/* ✨ Navigation Pills */}
        <VStack align="stretch" spacing={2} flex={1}>
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const isActive = activeSection === section.key;

            return (
              <Tooltip
                key={section.key}
                label={section.tooltip}
                placement="right"
                openDelay={200}
                isDisabled={isOpen}
              >
                <Button
                  w="full"
                  justifyContent={isOpen ? "flex-start" : "center"}
                  leftIcon={<SectionIcon size={18} />}
                  onClick={() => onSectionChange(section.key)}
                  bg={isActive ? activeBg : "transparent"}
                  border="1px solid"
                  borderColor={
                    isActive ? "rgba(59, 130, 246, 0.5)" : "transparent"
                  }
                  fontWeight={isActive ? "600" : "500"}
                  color={isActive ? "#3B82F6" : "rgba(255, 255, 255, 0.7)"}
                  fontSize="sm"
                  borderRadius="12px"
                  height="44px"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: hoverBg,
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    boxShadow: activeGlow,
                    transform: "translateX(4px)",
                  }}
                  _activeLink={{
                    bg: activeBg,
                    boxShadow: activeGlow,
                  }}
                >
                  {isOpen && <Text ml={2}>{section.label}</Text>}
                </Button>
              </Tooltip>
            );
          })}
        </VStack>
      </Box>

      {/* ✨ Overlay for mobile menu close */}
      {isOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={50}
          display={{ base: "block", md: "none" }}
          onClick={() => setIsOpen(false)}
          bg="rgba(0, 0, 0, 0.4)"
        />
      )}
    </>
  );
};

export default Sidebar;
