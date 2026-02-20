import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Icon,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { FaGithub, FaGoogle } from "react-icons/fa";

const Login = () => {
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box minH="100vh" bg={bg} py={12}>
      <Container maxW="md">
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading size="xl" color="blue.600">
              Collaborative Workspace
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Work together in real-time with your team
            </Text>
          </VStack>

          <Box
            bg={cardBg}
            p={8}
            rounded="lg"
            boxShadow="lg"
            borderWidth="1px"
            borderColor={borderColor}
            w="full"
          >
            <VStack spacing={6}>
              <VStack spacing={2} textAlign="center">
                <Heading size="md">Welcome Back</Heading>
                <Text color="gray.600">
                  Sign in to continue to your workspace
                </Text>
              </VStack>

              <VStack spacing={3} w="full">
                <Button
                  as="a"
                  href="http://localhost:5000/api/auth/github"
                  colorScheme="gray"
                  size="lg"
                  w="full"
                  leftIcon={<Icon as={FaGithub} />}
                  _hover={{ bg: "gray.700" }}
                >
                  Continue with GitHub
                </Button>

                <Button
                  as="a"
                  href="http://localhost:5000/api/auth/google"
                  colorScheme="red"
                  size="lg"
                  w="full"
                  leftIcon={<Icon as={FaGoogle} />}
                  _hover={{ bg: "red.600" }}
                >
                  Continue with Google
                </Button>
              </VStack>

              <Text fontSize="sm" color="gray.500" textAlign="center">
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
