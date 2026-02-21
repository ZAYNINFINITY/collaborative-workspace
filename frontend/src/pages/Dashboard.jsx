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
  Grid,
  GridItem,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGithub, FaPlus, FaUsers, FaChartLine, FaBolt, FaTerminal } from "react-icons/fa";
import API from "../api";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardSidebar from "../components/DashboardSidebar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const navigate = useNavigate();

  // ✨ Gemini Color Tokens
  const bg = "transparent";
  const cardBg = "rgba(26, 26, 31, 0.8)";
  const borderColor = "rgba(255, 255, 255, 0.05)";
  const textPrimary = "white";
  // const "rgba(255, 255, 255, 0.7)" = "rgba(255, 255, 255, 0.7)";
  const textTertiary = "rgba(255, 255, 255, 0.5)";

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
          // Not authenticated – send back to login
          navigate("/", { replace: true });
          return;
        }

        setError("Failed to load dashboard data. Please try again.");
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

  const MotionBox = motion(Box);
  const MotionFlex = motion(Flex);
  const MotionGrid = motion(Grid);
  const MotionGridItem = motion(GridItem);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 200, damping: 20, mass: 1 }
    },
  };

  return (
    <Box minH="100vh" bg={bg}>
      {/* ✨ Top Navigation Bar */}
      <DashboardNavbar
        title="Dashboard"
        user={user}
        onBack={() => window.history.back()}
      />

      {/* ✨ Sidebar + Main Content */}
      <Flex>
        {/* Sidebar */}
        <DashboardSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <Box w="full" ml="250px" pt="70px" px={4} py={10}>
          <MotionBox
            maxW="6xl"
            mx="auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* ✨ Header Section */}
            <MotionFlex justify="space-between" align="center" mb={8} variants={itemVariants}>
              <HStack spacing={3}>
                <Avatar
                  size="md"
                  name={user?.displayName || user?.username || "User"}
                  src={user?.avatar}
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color={"rgba(255, 255, 255, 0.7)"}>
                    Welcome back,
                  </Text>
                  <Heading size="md" color={textPrimary}>
                    {user?.displayName || user?.username || "Collaborator"}
                  </Heading>
                </VStack>
              </HStack>

              {/* ✨ Action Buttons */}
              <HStack spacing={3}>
                <Button
                  as="a"
                  href={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/logout`}
                  bg="rgba(239, 68, 68, 0.2)"
                  border="1px solid rgba(239, 68, 68, 0.3)"
                  color="#ef4444"
                  size="sm"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: "rgba(239, 68, 68, 0.3)",
                    boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  Logout
                </Button>
                <Button
                  as={RouterLink}
                  to="/workspaces"
                  bg="rgba(59, 130, 246, 0.15)"
                  border="1px solid rgba(59, 130, 246, 0.3)"
                  color="#3b82f6"
                  leftIcon={<FaUsers />}
                  transition="all 0.2s ease"
                  _hover={{
                    bg: "rgba(59, 130, 246, 0.25)",
                    boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  View workspaces
                </Button>
                <Button
                  as={RouterLink}
                  to="/repos"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  leftIcon={<FaGithub />}
                  transition="all 0.2s ease"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 0 20px rgba(0, 217, 255, 0.2)",
                  }}
                >
                  GitHub repos
                </Button>
              </HStack>
            </MotionFlex>

            {loading && (
              <Flex justify="center" align="center" py={20}>
                <Spinner size="lg" color="#3b82f6" />
              </Flex>
            )}

            {!loading && error && (
              <Alert
                status="error"
                mb={6}
                bg="rgba(239, 68, 68, 0.2)"
                borderColor="rgba(239, 68, 68, 0.3)"
              >
                <AlertIcon color="#ef4444" />
                <Text color={textPrimary}>{error}</Text>
              </Alert>
            )}

            {!loading && !error && (
              <MotionGrid
                templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                templateRows={{ base: "auto", md: "repeat(2, auto)" }}
                gap={6}
                variants={itemVariants}
              >
                {/* ✨ Main Welcome/Overview Tile (Spans 2 columns) */}
                <MotionGridItem colSpan={{ base: 1, md: 2 }}>
                  <MotionBox
                    whileHover={{ scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="xl"
                    p={8}
                    h="100%"
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    style={{ backdropFilter: "blur(12px)" }}
                    transition="all 0.4s ease"
                    _hover={{
                      bg: "rgba(30, 30, 35, 0.9)",
                      borderColor: "rgba(59, 130, 246, 0.4)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 40px rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    {/* Subtle gradient orb background inside the card */}
                    <Box
                      position="absolute"
                      top="-50%" left="-20%" width="140%" height="200%"
                      bg="radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 60%)"
                      zIndex={0} pointerEvents="none"
                    />
                    <VStack align="start" spacing={6} h="100%" justify="space-between" position="relative" zIndex={1}>
                      <Box>
                        <Heading size="lg" color={textPrimary} mb={2}>
                          Collaborate in real-time
                        </Heading>
                        <Text color={"rgba(255, 255, 255, 0.7)"} fontSize="md" maxW="lg">
                          Jump back into your recent workspaces, collaborate with
                          your team, and keep repos, tasks, notes, and
                          chat all in a unified, synchronized environment.
                        </Text>
                      </Box>
                      <HStack spacing={4} w="full">
                        <Button
                          as={RouterLink}
                          to="/workspaces"
                          bg="rgba(59, 130, 246, 0.2)"
                          border="1px solid rgba(59, 130, 246, 0.3)"
                          color="#3b82f6"
                          leftIcon={<FaPlus />}
                          transition="all 0.2s ease"
                          _hover={{
                            bg: "rgba(59, 130, 246, 0.3)",
                            boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          New workspace
                        </Button>
                        <Button
                          as={RouterLink}
                          to="/repos"
                          bg="rgba(255, 255, 255, 0.05)"
                          border="1px solid rgba(255, 255, 255, 0.1)"
                          color="white"
                          leftIcon={<FaGithub />}
                          transition="all 0.2s ease"
                          _hover={{
                            bg: "rgba(255, 255, 255, 0.1)",
                            boxShadow: "0 0 20px rgba(0, 217, 255, 0.2)",
                          }}
                        >
                          Connect repos
                        </Button>
                      </HStack>
                    </VStack>
                  </MotionBox>
                </MotionGridItem>

                {/* ✨ Quick Actions Tile (1 column) */}
                <MotionGridItem colSpan={{ base: 1, md: 1 }}>
                  <MotionBox
                    whileHover={{ scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="xl"
                    p={6}
                    h="100%"
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    style={{ backdropFilter: "blur(12px)" }}
                    transition="all 0.4s ease"
                    _hover={{
                      bg: "rgba(30, 30, 35, 0.9)",
                      borderColor: "rgba(168, 85, 247, 0.4)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 40px rgba(168, 85, 247, 0.2)",
                    }}
                  >
                    {/* Subtle gradient orb background inside the card */}
                    <Box
                      position="absolute"
                      top="-50%" right="-50%" width="150%" height="150%"
                      bg="radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 60%)"
                      zIndex={0} pointerEvents="none"
                    />
                    <VStack align="stretch" spacing={5} h="100%" position="relative" zIndex={1}>
                      <HStack>
                        <FaBolt color="#9333ea" />
                        <Heading size="sm" color={textPrimary}>
                          Quick Actions
                        </Heading>
                      </HStack>
                      <SimpleGrid columns={2} spacing={4} flex="1">
                        <Button variant="outline" h="auto" py={4} flexDirection="column" gap={2} borderColor="whiteAlpha.100" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.100", color: "cyan.400", borderColor: "cyan.400" }}>
                          <FaUsers size={20} />
                          <Text fontSize="xs">Team</Text>
                        </Button>
                        <Button variant="outline" h="auto" py={4} flexDirection="column" gap={2} borderColor="whiteAlpha.100" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.100", color: "purple.400", borderColor: "purple.400" }}>
                          <FaTerminal size={20} />
                          <Text fontSize="xs">Console</Text>
                        </Button>
                        <Button variant="outline" h="auto" py={4} flexDirection="column" gap={2} borderColor="whiteAlpha.100" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.100", color: "blue.400", borderColor: "blue.400" }}>
                          <FaGithub size={20} />
                          <Text fontSize="xs">Commits</Text>
                        </Button>
                        <Button variant="outline" h="auto" py={4} flexDirection="column" gap={2} borderColor="whiteAlpha.100" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.100", color: "emerald.400", borderColor: "emerald.400" }}>
                          <FaChartLine size={20} />
                          <Text fontSize="xs">Metrics</Text>
                        </Button>
                      </SimpleGrid>
                    </VStack>
                  </MotionBox>
                </MotionGridItem>

                {/* ✨ System Analytics Tile (1 column) */}
                <MotionGridItem colSpan={{ base: 1, md: 1 }}>
                  <MotionBox
                    whileHover={{ scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="xl"
                    p={6}
                    h="100%"
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    style={{ backdropFilter: "blur(12px)" }}
                    transition="all 0.4s ease"
                    _hover={{
                      bg: "rgba(30, 30, 35, 0.9)",
                      borderColor: "rgba(236, 72, 153, 0.4)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 40px rgba(236, 72, 153, 0.2)",
                    }}
                  >
                    <Box
                      position="absolute"
                      bottom="-20%" left="-20%" width="120%" height="120%"
                      bg="radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 60%)"
                      zIndex={0} pointerEvents="none"
                    />
                    <VStack align="stretch" spacing={5} h="100%" position="relative" zIndex={1}>
                      <HStack>
                        <FaChartLine color="#3b82f6" />
                        <Heading size="sm" color={textPrimary}>
                          System Status
                        </Heading>
                      </HStack>
                      <Box flex="1" bg="whiteAlpha.50" borderRadius="8px" p={4} border="1px solid" borderColor="whiteAlpha.100">
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color={"rgba(255, 255, 255, 0.7)"}>API Latency</Text>
                              <Text fontSize="xs" color="cyan.400" fontFamily="mono">24ms</Text>
                            </HStack>
                            <Box w="100%" h="4px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
                              <Box w="30%" h="100%" bg="cyan.400" />
                            </Box>
                          </Box>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color={"rgba(255, 255, 255, 0.7)"}>Socket Connection</Text>
                              <Text fontSize="xs" color="emerald.400" fontFamily="mono">Stable</Text>
                            </HStack>
                            <Box w="100%" h="4px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
                              <Box w="100%" h="100%" bg="emerald.400" />
                            </Box>
                          </Box>
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color={"rgba(255, 255, 255, 0.7)"}>Active Workspaces</Text>
                              <Text fontSize="xs" color="purple.400" fontFamily="mono">{workspaces.length}</Text>
                            </HStack>
                            <Box w="100%" h="4px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
                              <Box w={`${Math.min((workspaces.length / 10) * 100, 100)}%`} h="100%" bg="purple.400" />
                            </Box>
                          </Box>
                        </VStack>
                      </Box>
                    </VStack>
                  </MotionBox>
                </MotionGridItem>

                {/* ✨ Recent Workspaces Tile (2 columns) */}
                <MotionGridItem colSpan={{ base: 1, md: 2 }}>
                  <MotionBox
                    whileHover={{ scale: 1.01, transition: { duration: 0.3, ease: "easeOut" } }}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    rounded="xl"
                    p={6}
                    h="100%"
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    style={{ backdropFilter: "blur(12px)" }}
                    transition="all 0.4s ease"
                    _hover={{
                      bg: "rgba(30, 30, 35, 0.9)",
                      borderColor: "rgba(16, 185, 129, 0.4)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 40px rgba(16, 185, 129, 0.1)",
                    }}
                  >
                    <Box
                      position="absolute"
                      top="10%" right="-10%" width="60%" height="80%"
                      bg="radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 60%)"
                      zIndex={0} pointerEvents="none"
                    />
                    <VStack align="stretch" spacing={5} position="relative" zIndex={1}>
                      <HStack>
                        <FaUsers color="#fbbf24" />
                        <Heading size="sm" color={textPrimary}>
                          Recent workspaces
                        </Heading>
                      </HStack>
                      {recentWorkspaces.length === 0 ? (
                        <Text fontSize="sm" color={textTertiary}>
                          You don&apos;t have any workspaces yet. Create one to
                          get started.
                        </Text>
                      ) : (
                        recentWorkspaces.map((ws) => (
                          <Box
                            key={ws._id}
                            borderWidth="1px"
                            borderColor="rgba(255, 255, 255, 0.05)"
                            rounded="12px"
                            p={3}
                            bg="rgba(255, 255, 255, 0.02)"
                            transition="all 0.2s ease"
                            _hover={{
                              bg: "rgba(59, 130, 246, 0.15)",
                              borderColor: "rgba(59, 130, 246, 0.3)",
                              cursor: "pointer",
                              boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
                            }}
                            as={RouterLink}
                            to={`/workspaces/${ws._id}`}
                          >
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="semibold" color={textPrimary}>
                                  {ws.name}
                                </Text>
                                {ws.description && (
                                  <Text
                                    fontSize="sm"
                                    color={"rgba(255, 255, 255, 0.7)"}
                                    noOfLines={2}
                                  >
                                    {ws.description}
                                  </Text>
                                )}
                              </VStack>
                              {ws.currentUserRole && (
                                <Text
                                  fontSize="xs"
                                  textTransform="uppercase"
                                  color="rgba(255, 255, 255, 0.5)"
                                  bg="rgba(59, 130, 246, 0.2)"
                                  px={2}
                                  py={1}
                                  borderRadius="6px"
                                  fontWeight="600"
                                >
                                  {ws.currentUserRole}
                                </Text>
                              )}
                            </HStack>
                          </Box>
                        ))
                      )}
                    </VStack>
                  </MotionBox>
                </MotionGridItem>
              </MotionGrid>
            )}
          </MotionBox>
        </Box>
      </Flex>
    </Box>
  );
};

export default Dashboard;


