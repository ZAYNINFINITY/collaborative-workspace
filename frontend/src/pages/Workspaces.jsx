import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Input,
  Textarea,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import API from "../api";

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();

  const bg = "transparent";
  const cardBg = "rgba(26, 26, 31, 0.8)";
  const borderColor = "rgba(255, 255, 255, 0.05)";

  useEffect(() => {
    let isMounted = true;

    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await API.get("/workspaces");
        if (!isMounted) return;
        setWorkspaces(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        setError("Failed to load workspaces. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError("Name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const res = await API.post("/workspaces", {
        name: name.trim(),
        description: description.trim(),
      });

      setWorkspaces((prev) => [res.data, ...prev]);
      setName("");
      setDescription("");
    } catch (err) {
      const msg =
        err.response?.data?.msg ||
        "Failed to create workspace. Please try again.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box minH="100vh" bg={bg} py={10} px={4}>
      <Box maxW="6xl" mx="auto">
        <HStack justify="space-between" align="center" mb={8}>
          <Heading size="lg">Workspaces</Heading>
          <Button as={RouterLink} to="/dashboard" variant="ghost" size="sm">
            Back to dashboard
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
          {/* Create workspace form */}
          <Box
            as="form"
            onSubmit={handleCreateWorkspace}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            rounded="lg"
            p={6}
            boxShadow="lg"
          >
            <VStack align="stretch" spacing={4}>
              <Heading size="sm">Create Workspace</Heading>
              <FormControl isRequired>
                <FormLabel htmlFor="workspace-name">Workspace Name</FormLabel>
                <Input
                  id="workspace-name"
                  placeholder="Enter workspace name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="sm"
                  required
                  aria-label="Workspace name"
                  aria-required="true"
                  maxLength="100"
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="workspace-description">
                  Description (Optional)
                </FormLabel>
                <Textarea
                  id="workspace-description"
                  placeholder="Short description of your workspace"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="sm"
                  rows={3}
                  aria-label="Workspace description"
                  maxLength="500"
                />
              </FormControl>
              {createError && (
                <Alert status="error" fontSize="sm" role="alert">
                  <AlertIcon />
                  {createError}
                </Alert>
              )}
              <Button
                type="submit"
                colorScheme="blue"
                leftIcon={<FaPlus />}
                isLoading={creating}
                size="sm"
                alignSelf="flex-start"
              >
                Create
              </Button>
            </VStack>
          </Box>

          {/* Summary card */}
          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            rounded="lg"
            p={6}
            boxShadow="lg"
            gridColumn={{ base: "auto", md: "span 2" }}
          >
            <VStack align="start" spacing={3}>
              <Heading size="sm">Collaborate with your team</Heading>
              <Text fontSize="sm" color="gray.600">
                Each workspace brings together GitHub repositories, real-time
                notes, tasks, documents, and chat so your team can stay aligned
                in one place.
              </Text>
            </VStack>
          </Box>
        </SimpleGrid>

        {loading && (
          <Flex justify="center" align="center" py={10}>
            <Spinner size="lg" />
          </Flex>
        )}

        {!loading && error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <VStack align="stretch" spacing={4}>
            {workspaces.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                You don&apos;t have any workspaces yet. Create one above to get
                started.
              </Text>
            ) : (
              workspaces.map((ws) => (
                <Box
                  key={ws._id}
                  as={RouterLink}
                  to={`/workspaces/${ws._id}`}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  rounded="md"
                  p={4}
                  _hover={{
                    borderColor: "blue.400",
                    transform: "translateY(-1px)",
                  }}
                  transition="all 0.1s ease-in-out"
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold">{ws.name}</Text>
                      {ws.description && (
                        <Text fontSize="sm" color="gray.500" noOfLines={2}>
                          {ws.description}
                        </Text>
                      )}
                    </VStack>
                    {ws.currentUserRole && (
                      <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        color="gray.500"
                      >
                        {ws.currentUserRole}
                      </Text>
                    )}
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default Workspaces;
