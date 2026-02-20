import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Avatar,
  AvatarBadge,
  Text,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Input,
  Select,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Spinner,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useDisclosure,
  useToast,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { FaPlus, FaCog, FaRegCopy } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const TeamManagement = ({ workspaceId, currentUserRole, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invitationCode, setInvitationCode] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState(new Set());
  const toast = useToast();

  // ✨ Gemini Color Tokens
  const textPrimary = "white";
  const textSecondary = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";
  const cardBg = "rgba(26, 26, 31, 0.5)";
  const sectionBg = "rgba(26, 26, 31, 0.3)";

  // Modals for invite and role management
  const {
    isOpen: inviteOpen,
    onOpen: openInvite,
    onClose: closeInvite,
  } = useDisclosure();
  const {
    isOpen: roleOpen,
    onOpen: openRole,
    onClose: closeRole,
  } = useDisclosure();

  // Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Load members on mount
  useEffect(() => {
    loadMembers();
    if (currentUserRole === "admin") {
      loadPendingInvites();
      loadInvitationCode();
    }
  }, [workspaceId, currentUserRole]);

  // Socket.io listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleMemberJoined = (data) => {
      if (data.workspaceId === workspaceId) {
        loadMembers();
        setOnlineMembers((prev) => new Set([...prev, data.userId]));
        toast({
          title: "Team Updated",
          description: `${data.userDisplayName} has joined the workspace`,
          status: "success",
          duration: 3,
          isClosable: true,
        });
      }
    };

    const handleMemberLeft = (data) => {
      if (data.workspaceId === workspaceId) {
        loadMembers();
        setOnlineMembers((prev) => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
        toast({
          title: "Team Updated",
          description: "A member has left the workspace",
          status: "info",
          duration: 3,
          isClosable: true,
        });
      }
    };

    const handleMemberRoleChanged = (data) => {
      if (data.workspaceId === workspaceId) {
        loadMembers();
        toast({
          title: "Role Updated",
          description: `Member's role changed to ${data.newRole}`,
          status: "info",
          duration: 3,
          isClosable: true,
        });
      }
    };

    const handleMemberOnline = (data) => {
      if (data.workspaceId === workspaceId) {
        setOnlineMembers((prev) => new Set([...prev, data.userId]));
      }
    };

    const handleMemberOffline = (data) => {
      if (data.workspaceId === workspaceId) {
        setOnlineMembers((prev) => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    };

    socket.on("member:joined", handleMemberJoined);
    socket.on("member:left", handleMemberLeft);
    socket.on("member:roleChanged", handleMemberRoleChanged);
    socket.on("member:online", handleMemberOnline);
    socket.on("member:offline", handleMemberOffline);

    return () => {
      socket.off("member:joined", handleMemberJoined);
      socket.off("member:left", handleMemberLeft);
      socket.off("member:roleChanged", handleMemberRoleChanged);
      socket.off("member:online", handleMemberOnline);
      socket.off("member:offline", handleMemberOffline);
    };
  }, [workspaceId, toast]);

  // ===== API CALLS =====

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/workspaces/${workspaceId}/members`);
      setMembers(response.data);
      onUpdate?.();
    } catch (err) {
      setError("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const response = await API.get(`/workspaces/${workspaceId}/invites`);
      setPendingInvites(response.data);
    } catch (err) {
      // Don't show error for invites
    }
  };

  const loadInvitationCode = async () => {
    try {
      const response = await API.get(
        `/workspaces/${workspaceId}/invitation-code`,
      );
      setInvitationCode(response.data.code);
    } catch (err) {
      // Invitation code may not exist
    }
  };

  const handleInviteMember = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        status: "error",
        duration: 3,
        isClosable: true,
      });
      return;
    }

    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        status: "error",
        duration: 3,
        isClosable: true,
      });
      return;
    }

    try {
      setInviting(true);
      await API.post(`/workspaces/${workspaceId}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}`,
        status: "success",
        duration: 3,
        isClosable: true,
      });

      setInviteEmail("");
      setInviteRole("member");
      closeInvite();
      loadPendingInvites();
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Failed to send invitation",
        status: "error",
        duration: 3,
        isClosable: true,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!newRole || !selectedMember) {
      return;
    }

    try {
      setUpdating(true);
      await API.put(
        `/workspaces/${workspaceId}/members/${selectedMember.userId}`,
        {
          role: newRole,
        },
      );

      toast({
        title: "Success",
        description: `${selectedMember.displayName}'s role updated to ${newRole}`,
        status: "success",
        duration: 3,
        isClosable: true,
      });

      closeRole();
      loadMembers();
      setSelectedMember(null);
      setNewRole("");
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Failed to update role",
        status: "error",
        duration: 3,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberName} from the workspace?`,
      )
    ) {
      return;
    }

    try {
      await API.delete(`/workspaces/${workspaceId}/members/${memberId}`);

      toast({
        title: "Success",
        description: `${memberName} has been removed from the workspace`,
        status: "success",
        duration: 3,
        isClosable: true,
      });

      loadMembers();
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Failed to remove member",
        status: "error",
        duration: 3,
        isClosable: true,
      });
    }
  };

  const copyInvitationCode = () => {
    if (!invitationCode) return;
    navigator.clipboard.writeText(invitationCode);
    toast({
      title: "Copied!",
      description: "Invitation code copied to clipboard",
      status: "success",
      duration: 2,
      isClosable: true,
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return {
          bg: "rgba(147, 51, 234, 0.2)",
          color: "#a78bfa",
          border: "rgba(147, 51, 234, 0.3)",
        };
      case "admin":
        return {
          bg: "rgba(34, 197, 94, 0.2)",
          color: "#86efac",
          border: "rgba(34, 197, 94, 0.3)",
        };
      case "member":
        return {
          bg: "rgba(59, 130, 246, 0.2)",
          color: "#93c5fd",
          border: "rgba(59, 130, 246, 0.3)",
        };
      case "viewer":
        return {
          bg: "rgba(148, 163, 184, 0.2)",
          color: "#cbd5e1",
          border: "rgba(148, 163, 184, 0.3)",
        };
      default:
        return {
          bg: "rgba(255, 255, 255, 0.1)",
          color: textSecondary,
          border: "rgba(255, 255, 255, 0.2)",
        };
    }
  };

  if (loading) {
    return <Spinner color="#3b82f6" />;
  }

  return (
    <VStack align="stretch" spacing={6} p={4}>
      {error && (
        <Alert
          status="error"
          bg="rgba(239, 68, 68, 0.2)"
          borderColor="rgba(239, 68, 68, 0.3)"
          rounded="12px"
        >
          <AlertIcon color="#ef4444" />
          <Text color={textPrimary}>{error}</Text>
        </Alert>
      )}

      {/* Header */}
      <HStack justify="space-between" align="center">
        <VStack align="flex-start" spacing={1}>
          <Heading size="lg" color={textPrimary}>
            Team Management
          </Heading>
          <Text fontSize="sm" color={textTertiary}>
            {members.length} members
            {onlineMembers.size > 0 && ` • ${onlineMembers.size} online`}
          </Text>
        </VStack>
        {currentUserRole === "admin" && (
          <Button
            leftIcon={<FaPlus />}
            bg="rgba(59, 130, 246, 0.2)"
            color="#3b82f6"
            borderWidth="1px"
            borderColor="rgba(59, 130, 246, 0.3)"
            size="sm"
            transition="all 0.2s ease"
            _hover={{
              bg: "rgba(59, 130, 246, 0.3)",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
            }}
            onClick={openInvite}
          >
            Invite Member
          </Button>
        )}
      </HStack>

      {/* Invitation Code Section - Admin Only */}
      {currentUserRole === "admin" && invitationCode && (
        <Box
          bg={sectionBg}
          borderWidth="1px"
          borderColor="rgba(255, 255, 255, 0.05)"
          borderRadius="16px"
          p={4}
          backdropFilter="blur(20px)"
        >
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <VStack align="flex-start" spacing={1}>
                <Text fontWeight="600" fontSize="sm" color={textSecondary}>
                  Invitation Code
                </Text>
                <Text fontSize="xs" color={textTertiary}>
                  Share this code with team members to join instantly
                </Text>
              </VStack>
              <Button
                leftIcon={<FaRegCopy />}
                size="sm"
                bg="rgba(251, 191, 36, 0.2)"
                color="#fbbf24"
                borderWidth="1px"
                borderColor="rgba(251, 191, 36, 0.3)"
                onClick={copyInvitationCode}
                _hover={{
                  bg: "rgba(251, 191, 36, 0.3)",
                }}
              >
                Copy
              </Button>
            </HStack>
            <HStack
              bg="rgba(255, 255, 255, 0.02)"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderRadius="12px"
              px={3}
              py={2}
            >
              <Text
                fontFamily="monospace"
                fontSize="md"
                fontWeight="700"
                color="#fbbf24"
              >
                {invitationCode}
              </Text>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Team Members Section */}
      <Box
        bg={sectionBg}
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.05)"
        borderRadius="16px"
        p={4}
        backdropFilter="blur(20px)"
      >
        <VStack align="stretch" spacing={4}>
          <VStack
            align="flex-start"
            spacing={1}
            pb={3}
            borderBottom="1px solid rgba(255, 255, 255, 0.05)"
          >
            <Heading size="md" color={textPrimary}>
              Team Members
            </Heading>
            <Text fontSize="xs" color={textTertiary}>
              {members.length} members in this workspace
            </Text>
          </VStack>

          {members.length === 0 ? (
            <Text color={textTertiary}>No members yet</Text>
          ) : (
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={3}
            >
              {members.map((member) => {
                const roleColors = getRoleColor(member.role);
                const isOnline = onlineMembers.has(member.userId);

                return (
                  <GridItem key={member.userId}>
                    <Box
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor="rgba(255, 255, 255, 0.05)"
                      borderRadius="12px"
                      p={3}
                      transition="all 0.3s ease"
                      _hover={{
                        bg: "rgba(26, 26, 31, 0.7)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" align="flex-start">
                          <HStack spacing={2} flex={1}>
                            <Box position="relative">
                              <Avatar
                                size="md"
                                name={member.displayName || member.username}
                                src={member.avatar}
                              />
                              {isOnline && (
                                <AvatarBadge
                                  boxSize="12px"
                                  bg="rgb(34, 197, 94)"
                                  border="2px solid rgba(26, 26, 31, 0.8)"
                                />
                              )}
                            </Box>
                            <VStack align="flex-start" spacing={0}>
                              <Text
                                fontWeight="600"
                                fontSize="sm"
                                color={textPrimary}
                              >
                                {member.displayName || member.username}
                              </Text>
                              <Text fontSize="xs" color={textTertiary}>
                                {member.email}
                              </Text>
                            </VStack>
                          </HStack>

                          {currentUserRole === "admin" && !member.isOwner && (
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FaCog />}
                                size="sm"
                                variant="ghost"
                                color={textSecondary}
                              />
                              <MenuList
                                bg="rgba(26, 26, 31, 0.95)"
                                borderColor="rgba(255, 255, 255, 0.1)"
                              >
                                <MenuItem
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setNewRole(member.role);
                                    openRole();
                                  }}
                                  color={textPrimary}
                                  _hover={{ bg: "rgba(59, 130, 246, 0.2)" }}
                                >
                                  Change Role
                                </MenuItem>
                                <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                                <MenuItem
                                  onClick={() =>
                                    handleRemoveMember(
                                      member.userId,
                                      member.displayName,
                                    )
                                  }
                                  color="#ef4444"
                                  _hover={{ bg: "rgba(239, 68, 68, 0.2)" }}
                                >
                                  Remove Member
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </HStack>

                        <HStack justify="space-between" align="center">
                          <Badge
                            bg={roleColors.bg}
                            color={roleColors.color}
                            borderColor={roleColors.border}
                            border="1px solid"
                            fontWeight="600"
                            fontSize="xs"
                          >
                            {member.role}
                            {member.isOwner && " (Owner)"}
                          </Badge>
                          {isOnline && (
                            <Badge
                              bg="rgba(34, 197, 94, 0.2)"
                              color="#86efac"
                              borderColor="rgba(34, 197, 94, 0.3)"
                              border="1px solid"
                              fontWeight="600"
                              fontSize="xs"
                            >
                              Online
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  </GridItem>
                );
              })}
            </Grid>
          )}
        </VStack>
      </Box>

      {/* Pending Invitations Section - Admin Only */}
      {currentUserRole === "admin" && pendingInvites.length > 0 && (
        <Box
          bg={sectionBg}
          borderWidth="1px"
          borderColor="rgba(255, 255, 255, 0.05)"
          borderRadius="16px"
          p={4}
          backdropFilter="blur(20px)"
        >
          <VStack align="stretch" spacing={3}>
            <VStack
              align="flex-start"
              spacing={1}
              pb={3}
              borderBottom="1px solid rgba(255, 255, 255, 0.05)"
            >
              <Heading size="md" color={textPrimary}>
                Pending Invitations
              </Heading>
              <Text fontSize="xs" color={textTertiary}>
                {pendingInvites.length} invitation
                {pendingInvites.length !== 1 ? "s" : ""} awaiting response
              </Text>
            </VStack>

            {pendingInvites.map((invite, idx) => (
              <HStack
                key={idx}
                bg={cardBg}
                borderWidth="1px"
                borderColor="rgba(251, 191, 36, 0.2)"
                borderRadius="12px"
                p={3}
                justify="space-between"
              >
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight="600" fontSize="sm" color={textPrimary}>
                    {invite.email}
                  </Text>
                  <Text fontSize="xs" color={textTertiary}>
                    Invited as{" "}
                    <Badge
                      bg={getRoleColor(invite.role).bg}
                      color={getRoleColor(invite.role).color}
                      ms={1}
                      fontWeight="600"
                      fontSize="xs"
                    >
                      {invite.role}
                    </Badge>
                  </Text>
                </VStack>
                <Badge
                  bg="rgba(251, 191, 36, 0.2)"
                  color="#fbbf24"
                  borderColor="rgba(251, 191, 36, 0.3)"
                  border="1px solid"
                  fontWeight="600"
                  fontSize="xs"
                >
                  Pending
                </Badge>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Invite Modal */}
      <Modal isOpen={inviteOpen} onClose={closeInvite}>
        <ModalOverlay />
        <ModalContent
          bg="rgba(26, 26, 31, 0.95)"
          borderColor="rgba(255, 255, 255, 0.1)"
        >
          <ModalHeader color={textPrimary}>Invite Team Member</ModalHeader>
          <ModalCloseButton color={textSecondary} />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color={textSecondary} htmlFor="invite-email">
                  Email Address
                </FormLabel>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textSecondary} htmlFor="invite-role">
                  Role
                </FormLabel>
                <Select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={inviting}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="member">Member (Edit)</option>
                  <option value="admin">Admin (Full Control)</option>
                </Select>
              </FormControl>

              <Text fontSize="sm" color={textTertiary} mt={2}>
                An invitation will be sent to this email address. They can
                accept or decline the invitation.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={closeInvite}
              color={textSecondary}
            >
              Cancel
            </Button>
            <Button
              bg="rgba(59, 130, 246, 0.2)"
              color="#3b82f6"
              border="1px solid rgba(59, 130, 246, 0.3)"
              onClick={handleInviteMember}
              isLoading={inviting}
            >
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={roleOpen} onClose={closeRole}>
        <ModalOverlay />
        <ModalContent
          bg="rgba(26, 26, 31, 0.95)"
          borderColor="rgba(255, 255, 255, 0.1)"
        >
          <ModalHeader color={textPrimary}>Change Member Role</ModalHeader>
          <ModalCloseButton color={textSecondary} />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontWeight="600" color={textPrimary}>
                {selectedMember?.displayName || selectedMember?.username}
              </Text>

              <FormControl>
                <FormLabel color={textSecondary}>New Role</FormLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  color={textPrimary}
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="member">Member (Edit)</option>
                  <option value="admin">Admin (Full Control)</option>
                </Select>
              </FormControl>

              <Alert
                status="info"
                bg="rgba(59, 130, 246, 0.15)"
                borderColor="rgba(59, 130, 246, 0.3)"
                borderRadius="12px"
              >
                <AlertIcon color="#93c5fd" />
                <Box>
                  <Text fontSize="sm" color={textSecondary}>
                    <strong style={{ color: textPrimary }}>{newRole}</strong>:
                    Users can
                    {newRole === "viewer"
                      ? " view content but not edit"
                      : newRole === "member"
                        ? " create and edit content"
                        : " manage team members and workspace settings"}
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={closeRole}
              color={textSecondary}
            >
              Cancel
            </Button>
            <Button
              bg="rgba(59, 130, 246, 0.2)"
              color="#3b82f6"
              border="1px solid rgba(59, 130, 246, 0.3)"
              onClick={handleUpdateRole}
              isLoading={updating}
            >
              Update Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default TeamManagement;
