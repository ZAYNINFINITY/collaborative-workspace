# 🎨 IMPROVED COMPONENTS - Part 2

Continue from Part 1 with these additional enhancements.

---

## 4️⃣ IMPROVED DASHBOARD.JSX

**File**: `frontend/src/pages/Dashboard.jsx`

```jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Avatar,
  HStack,
  VStack,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
  Badge,
  Divider,
  Skeleton,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaPlus,
  FaUsers,
  FaLogout,
  FaArrowRight,
  FaClock,
} from "react-icons/fa";
import API from "../api";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const statBg = useColorModeValue("blue.50", "blue.900");

  // ✨ Fetch user and workspaces data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, wsRes] = await Promise.all([
          API.get("/auth/user"),
          API.get("/workspaces"),
        ]);

        if (!isMounted) return;

        setUser(userRes.data);
        setWorkspaces(Array.isArray(wsRes.data) ? wsRes.data : []);
      } catch (err) {
        if (!isMounted) return;

        if (err.response?.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        setError("Failed to load dashboard. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const recentWorkspaces = workspaces.slice(0, 3);
  const totalMembers = workspaces.reduce(
    (sum, ws) => sum + (ws.members?.length || 0),
    0,
  );
  const adminCount = workspaces.filter(
    (ws) => ws.currentUserRole === "admin",
  ).length;

  return (
    <Box minH="100vh" bg={bg} py={10} px={4}>
      <Box maxW="7xl" mx="auto">
        {/* ✨ Welcome Header Section */}
        <Box
          bg={useColorModeValue(
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
          )}
          borderRadius="2xl"
          p={8}
          mb={10}
          color="white"
          boxShadow="0 10px 30px rgba(0, 0, 0, 0.2)"
        >
          <HStack
            justify="space-between"
            align="flex-start"
            flexWrap="wrap"
            gap={6}
          >
            {/* ✨ Left side: Welcome message */}
            <HStack spacing={5} flex={1} minW={{ base: "100%", md: "auto" }}>
              {user && (
                <Avatar
                  size="xl"
                  name={user.displayName || user.username}
                  src={user.avatar}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                />
              )}
              <VStack align="start" spacing={1}>
                {!user && <Skeleton h={6} w={40} />}
                {user && (
                  <>
                    <Text fontSize="sm" opacity={0.9} fontWeight="500">
                      {new Date().getHours() < 12
                        ? "Good morning"
                        : new Date().getHours() < 18
                          ? "Good afternoon"
                          : "Good evening"}
                      ,
                    </Text>
                    <Heading size="lg" fontWeight="800" letterSpacing="-0.5px">
                      {user.displayName || user.username}
                    </Heading>
                  </>
                )}
              </VStack>
            </HStack>

            {/* ✨ Right side: Action buttons */}
            <HStack spacing={3} flexShrink={0}>
              <Button
                as={RouterLink}
                to="/workspaces"
                colorScheme="whiteAlpha"
                leftIcon={<FaUsers />}
                size="sm"
                fontWeight="600"
                _hover={{ bg: "whiteAlpha.200" }}
              >
                Workspaces
              </Button>
              <Button
                as={RouterLink}
                to="/repos"
                variant="outline"
                colorScheme="whiteAlpha"
                leftIcon={<FaGithub />}
                size="sm"
                fontWeight="600"
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Repos
              </Button>
              <Button
                as="a"
                href={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/logout`}
                variant="outline"
                colorScheme="whiteAlpha"
                leftIcon={<FaLogout />}
                size="sm"
                fontWeight="600"
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Logout
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* ✨ Error Alert */}
        {!loading && error && (
          <Alert status="error" mb={6} borderRadius="lg" boxShadow="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* ✨ Stats Cards */}
        {!loading && !error && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={10}>
            {/* Total Workspaces */}
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              rounded="xl"
              p={5}
              transition="all 0.3s ease"
              _hover={{
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                transform: "translateY(-2px)",
              }}
            >
              <VStack align="start" spacing={3}>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm" fontWeight="600" color="gray.600">
                    Active Workspaces
                  </Text>
                  <Icon as={FaUsers} color="blue.500" boxSize={5} />
                </HStack>
                <Heading size="2xl" fontWeight="800">
                  {workspaces.length}
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Workspaces you're part of
                </Text>
              </VStack>
            </Box>

            {/* Total Members */}
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              rounded="xl"
              p={5}
              transition="all 0.3s ease"
              _hover={{
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                transform: "translateY(-2px)",
              }}
            >
              <VStack align="start" spacing={3}>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm" fontWeight="600" color="gray.600">
                    Team Members
                  </Text>
                  <Icon as={FaUsers} color="green.500" boxSize={5} />
                </HStack>
                <Heading size="2xl" fontWeight="800">
                  {totalMembers}
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Across all workspaces
                </Text>
              </VStack>
            </Box>

            {/* Admin Workspaces */}
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              rounded="xl"
              p={5}
              transition="all 0.3s ease"
              _hover={{
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                transform: "translateY(-2px)",
              }}
            >
              <VStack align="start" spacing={3}>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm" fontWeight="600" color="gray.600">
                    Workspaces Managed
                  </Text>
                  <Icon as={FaUsers} color="purple.500" boxSize={5} />
                </HStack>
                <Heading size="2xl" fontWeight="800">
                  {adminCount}
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Where you're an admin
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>
        )}

        {/* ✨ Recent Workspaces Section */}
        {!loading && !error && (
          <Box>
            <HStack justify="space-between" align="center" mb={6}>
              <VStack align="start" spacing={1}>
                <Heading size="md" fontWeight="700">
                  Recent Workspaces
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Quick access to your active projects
                </Text>
              </VStack>
              <Button
                as={RouterLink}
                to="/workspaces"
                variant="outline"
                rightIcon={<FaArrowRight />}
                size="sm"
              >
                View All
              </Button>
            </HStack>

            {/* ✨ Loading skeleton */}
            {loading && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h="200px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            )}

            {/* ✨ Workspace cards */}
            {!loading && recentWorkspaces.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                {recentWorkspaces.map((workspace) => (
                  <Box
                    key={workspace._id}
                    as={RouterLink}
                    to={`/workspaces/${workspace._id}`}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="xl"
                    overflow="hidden"
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                      transform: "translateY(-4px)",
                      borderColor: "blue.300",
                      textDecoration: "none",
                    }}
                    cursor="pointer"
                    textDecoration="none"
                  >
                    {/* ✨ Card gradient header */}
                    <Box
                      bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
                      h={100}
                      display="flex"
                      alignItems="flex-end"
                      justifyContent="space-between"
                      p={4}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="whiteAlpha.800">
                          Workspace
                        </Text>
                        <Heading size="sm" color="white" fontWeight="700">
                          {workspace.name}
                        </Heading>
                      </VStack>
                    </Box>

                    {/* ✨ Card content */}
                    <Box p={5}>
                      <VStack align="start" spacing={4}>
                        {workspace.description && (
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {workspace.description}
                          </Text>
                        )}

                        <Divider my={0} />

                        {/* ✨ Footer with stats */}
                        <HStack w="full" justify="space-between">
                          <HStack spacing={1} fontSize="xs" color="gray.500">
                            <Icon as={FaClock} />
                            <Text>
                              {workspace.members?.length || 0} member
                              {workspace.members?.length !== 1 ? "s" : ""}
                            </Text>
                          </HStack>
                          <Badge
                            colorScheme={
                              workspace.currentUserRole === "admin"
                                ? "green"
                                : "blue"
                            }
                            fontSize="xs"
                            fontWeight="600"
                          >
                            {workspace.currentUserRole || "member"}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                ))}

                {/* ✨ Create new wspcae card */}
                <Box
                  as={RouterLink}
                  to="/workspaces"
                  bg={cardBg}
                  borderWidth="2px"
                  borderColor={borderColor}
                  borderStyle="dashed"
                  rounded="xl"
                  p={8}
                  textAlign="center"
                  transition="all 0.3s ease"
                  cursor="pointer"
                  textDecoration="none"
                  _hover={{
                    borderColor: "blue.400",
                    boxShadow: "0 4px 12px rgba(66, 153, 225, 0.1)",
                    transform: "translateY(-2px)",
                  }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minH="200px"
                >
                  <VStack spacing={3}>
                    <Icon as={FaPlus} boxSize={8} color="blue.400" />
                    <Text fontWeight="600" color="blue.600">
                      Create Workspace
                    </Text>
                    <Text fontSize="xs" color="gray.500" maxW="200px">
                      Start a new collaborative project
                    </Text>
                  </VStack>
                </Box>
              </SimpleGrid>
            )}

            {/* ✨ Empty state */}
            {!loading && recentWorkspaces.length === 0 && (
              <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                rounded="xl"
                p={12}
                textAlign="center"
              >
                <VStack spacing={4}>
                  <Icon as={FaUsers} boxSize={12} color="gray.300" />
                  <VStack spacing={2}>
                    <Heading size="md" color="gray.600">
                      No workspaces yet
                    </Heading>
                    <Text color="gray.500" fontSize="sm">
                      Create your first workspace to get started
                    </Text>
                  </VStack>
                  <Button
                    as={RouterLink}
                    to="/workspaces"
                    colorScheme="blue"
                    leftIcon={<FaPlus />}
                    mt={4}
                  >
                    Create Workspace
                  </Button>
                </VStack>
              </Box>
            )}
          </Box>
        )}

        {/* ✨ Loading state */}
        {loading && (
          <Flex justify="center" align="center" py={20}>
            <VStack spacing={4}>
              <Spinner size="lg" color="blue.500" thickness="4px" />
              <Text color="gray.500">Loading your workspace...</Text>
            </VStack>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
```

**Key Improvements:**

- ✨ Gradient header with welcome message
- ✨ Personalized greeting based on time of day
- ✨ Stats cards with icons and hover effects
- ✨ Loading skeletons for better UX
- ✨ Better workspace card layout with gradient headers
- ✨ Create workspace card in grid
- ✨ Empty state messaging
- ✨ Improved color scheme and spacing

---

## 5️⃣ IMPROVED TEAMMANAGEMENT.JSX (Enhanced Version)

**File**: `frontend/src/components/TeamManagement.jsx` (Key sections)

```jsx
// ✨ Key improvements to TeamManagement component
// This shows the enhanced form and member display sections

// Add these imports at the top:
import {
  // ... existing imports
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  CloseButton,
} from "@chakra-ui/react";

// ✨ Enhanced rendering section - Replace the entire return/render with this:

// Inside the component, in the return statement, add this improved structure:

return (
  <Box w="full">
    {/* ✨ Header with tabs */}
    <VStack align="start" spacing={6}>
      <VStack align="start" spacing={2} w="full">
        <Heading size="lg" fontWeight="700">
          Team Management
        </Heading>
        <Text color="gray.500" fontSize="sm">
          Manage workspace members, roles, and pending invitations
        </Text>
      </VStack>

      {/* ✨ Tab navigation for better organization */}
      <Tabs w="full" colorScheme="blue" variant="soft-rounded">
        <TabList mb={4}>
          <Tab fontWeight="600">Members ({members.length})</Tab>
          <Tab fontWeight="600">Pending Invites ({pendingInvites.length})</Tab>
          {currentUserRole === "admin" && (
            <Tab fontWeight="600">Invite Team</Tab>
          )}
        </TabList>

        <TabPanels>
          {/* ✨ MEMBERS TAB */}
          <TabPanel>
            {loading && (
              <Flex justify="center" py={8}>
                <Spinner size="lg" />
              </Flex>
            )}

            {error && (
              <Alert status="error" borderRadius="lg" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}

            {!loading && members.length === 0 && (
              <Box textAlign="center" py={8} color="gray.500">
                <Text>No members in this workspace yet</Text>
              </Box>
            )}

            {!loading && members.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {members.map((member) => (
                  <Card
                    key={member.userId}
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    _hover={{
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    }}
                    transition="all 0.3s ease"
                  >
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        {/* ✨ Member info with avatar */}
                        <HStack spacing={3} w="full">
                          <Avatar
                            size="md"
                            name={
                              member.user?.displayName || member.user?.username
                            }
                            src={member.user?.avatar}
                            boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
                          />
                          <VStack align="start" spacing={0} flex={1} minW={0}>
                            <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                              {member.user?.displayName ||
                                member.user?.username}
                            </Text>
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              {member.user?.email}
                            </Text>
                          </VStack>
                        </HStack>

                        {/* ✨ Role badge and actions */}
                        <HStack w="full" justify="space-between">
                          <Badge
                            colorScheme={
                              member.role === "admin"
                                ? "red"
                                : member.role === "member"
                                  ? "blue"
                                  : "gray"
                            }
                            fontSize="xs"
                            fontWeight="600"
                            p={1}
                            px={2}
                          >
                            {member.role?.toUpperCase()}
                          </Badge>

                          {/* ✨ Actions */}
                          {currentUserRole === "admin" && (
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<SettingsIcon boxSize={4} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="gray"
                                aria-label="Member options"
                              />
                              <MenuList fontSize="sm">
                                <MenuItem
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setNewRole(member.role);
                                    openRole();
                                  }}
                                  icon={<Icon as={FaEdit} />}
                                >
                                  Change Role
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem
                                  onClick={() =>
                                    handleRemoveMember(member.userId)
                                  }
                                  icon={<DeleteIcon />}
                                  color="red.500"
                                >
                                  Remove Member
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </TabPanel>

          {/* ✨ PENDING INVITES TAB */}
          <TabPanel>
            {!loading && pendingInvites.length === 0 && (
              <Box textAlign="center" py={8} color="gray.500">
                <Text>No pending invitations</Text>
              </Box>
            )}

            {!loading && pendingInvites.length > 0 && (
              <VStack align="start" spacing={3} w="full">
                {pendingInvites.map((invite) => (
                  <Box
                    key={invite.token}
                    bg="blue.50"
                    borderLeftWidth="4px"
                    borderLeftColor="blue.400"
                    p={4}
                    borderRadius="md"
                    w="full"
                  >
                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600" fontSize="sm">
                          {invite.email}
                        </Text>
                        <HStack spacing={2} mt={1}>
                          <Badge colorScheme="blue" fontSize="xs">
                            {invite.role}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            Pending since{" "}
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </Text>
                        </HStack>
                      </VStack>

                      {currentUserRole === "admin" && (
                        <Tooltip label="Cancel invitation">
                          <IconButton
                            icon={<CloseButton />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleCancelInvite(invite.token)}
                            aria-label="Cancel invitation"
                          />
                        </Tooltip>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* ✨ INVITE TAB */}
          {currentUserRole === "admin" && (
            <TabPanel>
              <Box
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                rounded="lg"
                p={6}
              >
                <VStack align="stretch" spacing={5}>
                  {inviting && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      Sending invitation...
                    </Alert>
                  )}

                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm">
                      Email Address
                    </FormLabel>
                    <Input
                      placeholder="team@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      size="md"
                      borderRadius="lg"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)",
                      }}
                      aria-label="Email to invite"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="600" fontSize="sm">
                      Role
                    </FormLabel>
                    <Select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      size="md"
                      borderRadius="lg"
                      _focus={{
                        borderColor: "blue.400",
                      }}
                      aria-label="User role"
                    >
                      <option value="viewer">Viewer (Read-only)</option>
                      <option value="member">Member (Edit)</option>
                      <option value="admin">Admin (Full control)</option>
                    </Select>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Viewers can only read content. Members can edit. Admins
                      manage team and settings.
                    </Text>
                  </FormControl>

                  <HStack spacing={3} justify="flex-end">
                    <Button variant="outline">Cancel</Button>
                    <Button
                      colorScheme="blue"
                      leftIcon={<AddIcon />}
                      isLoading={inviting}
                      onClick={handleInviteMember}
                    >
                      Send Invitation
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </VStack>

    {/* ✨ Role change modal */}
    <Modal isOpen={roleOpen} onClose={closeRole} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader fontWeight="700">Change Member Role</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            {selectedMember && (
              <>
                <Text fontSize="sm" color="gray.600">
                  Update role for{" "}
                  <strong>{selectedMember.user?.displayName}</strong>
                </Text>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  size="md"
                  borderRadius="lg"
                  aria-label="New role"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </Select>
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={closeRole}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => handleChangeRole(selectedMember.userId, newRole)}
              isLoading={updating}
            >
              Update Role
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </Box>
);
```

**Key Improvements:**

- ✨ Tab-based organization (Members, Pending, Invite)
- ✨ Card-based member display with gradual hover effects
- ✨ Better visual hierarchy with improved spacing
- ✨ Pending invites with date information
- ✨ Clearer role descriptions
- ✨ Modal with better styling
- ✨ Improved form inputs and validation
- ✨ Better accessibility with ARIA labels
