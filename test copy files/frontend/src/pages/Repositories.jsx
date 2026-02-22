import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Link,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Badge,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import API from "../api";

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const bg = "gray.50";
  const cardBg = "white";
  const borderColor = "gray.200";

  useEffect(() => {
    let isMounted = true;

    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get("/auth/repos");
        if (!isMounted) return;
        setRepos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          // Session expired – send user back to login
          navigate("/", { replace: true });
          return;
        }
        setError("Failed to load repositories from GitHub.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRepos();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <Box minH="100vh" bg={bg} py={10} px={4}>
      <Box maxW="5xl" mx="auto">
        <HStack justify="space-between" align="center" mb={6}>
          <HStack spacing={3}>
            <Box
              bg="gray.900"
              color="white"
              rounded="full"
              p={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <FaGithub />
            </Box>
            <Heading size="lg">GitHub repositories</Heading>
          </HStack>
          <Button as={RouterLink} to="/dashboard" variant="ghost" size="sm">
            Back to dashboard
          </Button>
        </HStack>

        {loading && (
          <Box py={10} textAlign="center">
            <Spinner size="lg" />
          </Box>
        )}

        {!loading && error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <VStack align="stretch" spacing={3}>
            {repos.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                No repositories found. Make sure your GitHub account has
                repositories and that you granted repo access when authorizing
                the app.
              </Text>
            ) : (
              repos.map((repo) => (
                <Box
                  key={repo.id}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  rounded="md"
                  p={4}
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1}>
                      <Link
                        href={repo.html_url}
                        isExternal
                        fontWeight="semibold"
                      >
                        {repo.full_name}
                      </Link>
                      {repo.description && (
                        <Text fontSize="sm" color="gray.500">
                          {repo.description}
                        </Text>
                      )}
                      <HStack spacing={2} pt={1}>
                        {repo.language && (
                          <Badge colorScheme="purple" fontSize="xs">
                            {repo.language}
                          </Badge>
                        )}
                        <Badge colorScheme="gray" fontSize="xs">
                          ★ {repo.stargazers_count}
                        </Badge>
                        <Badge colorScheme="gray" fontSize="xs">
                          Updated{" "}
                          {new Date(repo.updated_at).toLocaleDateString()}
                        </Badge>
                      </HStack>
                    </VStack>
                    <Badge
                      colorScheme={repo.private ? "red" : "green"}
                      fontSize="xs"
                    >
                      {repo.private ? "Private" : "Public"}
                    </Badge>
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

export default Repositories;


