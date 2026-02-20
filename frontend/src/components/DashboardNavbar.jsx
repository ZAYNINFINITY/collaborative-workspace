import React from "react";
import {
  Box,
  HStack,
  Button,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DashboardNavbar = ({
  title = "Dashboard",
  user,
  onBack,
  onCreate,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout").then(() => {
        navigate("/");
        window.location.reload();
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <Box
      bg={bg}
      borderBottom="1px solid"
      borderColor={borderColor}
      py={4}
      px={6}
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
      sticky="top"
      zIndex={10}
    >
      <HStack justify="space-between" align="center">
        {/* Left: Back button & Title */}
        <HStack spacing={4}>
          {onBack && (
            <Button
              leftIcon={<Icon as={FaArrowLeft} />}
              variant="ghost"
              onClick={onBack}
              size="sm"
            >
              Back
            </Button>
          )}
          <Button
            leftIcon={<Icon as={FaHome} />}
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            size="sm"
          >
            Home
          </Button>
          <Text fontSize="lg" fontWeight="600" color={textColor}>
            {title}
          </Text>
        </HStack>

        {/* Middle: CRUD Action Buttons */}
        {showActions && (
          <HStack spacing={2}>
            {onCreate && (
              <Button
                leftIcon={<Icon as={FaPlus} />}
                colorScheme="green"
                size="sm"
                onClick={onCreate}
              >
                Create
              </Button>
            )}
            {onEdit && (
              <Button
                leftIcon={<Icon as={FaEdit} />}
                colorScheme="blue"
                size="sm"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                leftIcon={<Icon as={FaTrash} />}
                colorScheme="red"
                size="sm"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </HStack>
        )}

        {/* Right: User Menu */}
        <Menu>
          <MenuButton as={Button} variant="ghost" size="sm">
            <HStack spacing={2}>
              <Avatar
                size="sm"
                name={user?.displayName || user?.username}
                src={user?.avatar}
              />
              <Text fontSize="sm" color={textColor}>
                {user?.displayName || user?.username}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem isDisabled>
              <Text fontSize="sm">Profile</Text>
            </MenuItem>
            <MenuItem isDisabled>
              <Text fontSize="sm">Settings</Text>
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={handleLogout}>
              <Text fontSize="sm" color="red.600">
                Logout
              </Text>
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Box>
  );
};

export default DashboardNavbar;
