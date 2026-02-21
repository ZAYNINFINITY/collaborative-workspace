import React, { useState } from "react";
import {
  Box,
  VStack,
  Button,
  Text,
  Icon,
  Collapse,
  HStack, Divider,
} from "@chakra-ui/react";
import {
  FaChevronDown,
  FaHome,
  FaBriefcase,
  FaComment,
  FaTasks,
  FaFileAlt,
  FaStickyNote,
  FaUsers,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DashboardSidebar = ({ activeSection, onSectionChange }) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  const bg = useColorModeValue("gray.50", "gray.800");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const activeBg = useColorModeValue("blue.100", "blue.900");
  const activeBorderColor = "blue.500";
  // const textColor = useColorModeValue("gray.900", "white");
  // const textSecondary = useColorModeValue("gray.600", "gray.400");

  const menuItems = [
    {
      id: "overview",
      icon: FaHome,
      label: "Overview",
      action: () => navigate("/dashboard"),
    },
    {
      id: "workspaces",
      icon: FaBriefcase,
      label: "Workspaces",
      action: () => navigate("/workspaces"),
    },
    {
      id: "collaboration",
      icon: FaUsers,
      label: "Team",
      submenu: [
        {
          id: "chat",
          icon: FaComment,
          label: "Chat",
          action: () => onSectionChange("chat"),
        },
        {
          id: "tasks",
          icon: FaTasks,
          label: "Tasks",
          action: () => onSectionChange("tasks"),
        },
        {
          id: "documents",
          icon: FaFileAlt,
          label: "Documents",
          action: () => onSectionChange("documents"),
        },
        {
          id: "notes",
          icon: FaStickyNote,
          label: "Notes",
          action: () => onSectionChange("notes"),
        },
      ],
    },
    {
      id: "repositories",
      icon: FaBriefcase,
      label: "Repositories",
      action: () => navigate("/repos"),
    },
  ];

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Box
      w="250px"
      minH="100vh"
      bg={bg}
      borderRight="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      py={6}
      px={4}
      overflowY="auto"
      position="fixed"
      left={0}
      top="70px"
      zIndex={5}
    >
      <VStack align="stretch" spacing={2}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          color={textSecondary}
          px={3}
          py={2}
        >
          Navigation
        </Text>

        {menuItems.map((item) => (
          <Box key={item.id}>
            <Button
              w="full"
              justifyContent="flex-start"
              variant="ghost"
              onClick={() => {
                if (item.submenu) {
                  toggleSection(item.id);
                } else {
                  item.action?.();
                }
              }}
              bg={activeSection === item.id ? activeBg : "transparent"}
              borderLeft="3px solid"
              borderColor={
                activeSection === item.id ? activeBorderColor : "transparent"
              }
              color={textColor}
              _hover={{ bg: hoverBg }}
              height="10"
              fontSize="sm"
              fontWeight={activeSection === item.id ? "600" : "500"}
              leftIcon={<Icon as={item.icon} />}
            >
              <HStack justify="space-between" w="full">
                <Text>{item.label}</Text>
                {item.submenu && (
                  <Icon
                    as={
                      expandedSections[item.id] ? FaChevronDown : FaChevronRight
                    }
                    fontSize="xs"
                  />
                )}
              </HStack>
            </Button>

            {/* Submenu */}
            {item.submenu && (
              <Collapse in={expandedSections[item.id]} animateOpacity>
                <VStack align="stretch" spacing={0} pl={6} py={2}>
                  {item.submenu.map((subitem) => (
                    <Button
                      key={subitem.id}
                      w="full"
                      justifyContent="flex-start"
                      variant="ghost"
                      onClick={() => {
                        subitem.action?.();
                        onSectionChange?.(subitem.id);
                      }}
                      bg={
                        activeSection === subitem.id ? activeBg : "transparent"
                      }
                      borderLeft="3px solid"
                      borderColor={
                        activeSection === subitem.id
                          ? activeBorderColor
                          : "transparent"
                      }
                      color={textColor}
                      _hover={{ bg: hoverBg }}
                      height="9"
                      fontSize="sm"
                      leftIcon={<Icon as={subitem.icon} fontSize="xs" />}
                    >
                      {subitem.label}
                    </Button>
                  ))}
                </VStack>
              </Collapse>
            )}
          </Box>
        ))}

        <Divider my={4} />

        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          color={textSecondary}
          px={3}
          py={2}
        >
          Account
        </Text>

        <Button
          w="full"
          justifyContent="flex-start"
          variant="ghost"
          size="sm"
          fontSize="sm"
          isDisabled
        >
          Settings
        </Button>

        <Button
          w="full"
          justifyContent="flex-start"
          variant="ghost"
          size="sm"
          fontSize="sm"
          isDisabled
        >
          Help
        </Button>
      </VStack>
    </Box>
  );
};

export default DashboardSidebar;

