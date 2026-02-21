import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Link as ChakraLink,
  Divider,
  Icon,
  FormErrorMessage,
  Image,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import logoImage from "../assets/collab-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        await API.get("/auth/user");
        navigate("/dashboard");
      } catch {
        // Not logged in, show login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrors({ form: "Email and password required" });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const res = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      toast({
        title: "Welcome back!",
        description: `Logged in as ${res.data.user.displayName}`,
        status: "success",
        duration: 2,
        isClosable: true,
      });

      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.msg || "Login failed";
      setErrors({ form: message });
      toast({
        title: "Login Error",
        description: message,
        status: "error",
        duration: 3,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const MotionBox = motion(Box);
  const MotionVStack = motion(VStack);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } },
  };

  return (
    <Box minH="100vh" bg={bg} py={12}>
      <Container maxW="md">
        <MotionVStack
          spacing={8}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <MotionVStack spacing={2} textAlign="center" variants={itemVariants}>
            <HStack justifyContent="center">
              <Image src={logoImage} alt="Collab" h="12" w="12" />
            </HStack>
            <Heading size="lg" color="blue.600">
              Collaborative Workspace
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Sign in to your account
            </Text>
          </MotionVStack>

          {/* Email/Password Login Form */}
          <MotionBox
            w="full"
            bg={cardBg}
            rounded="lg"
            p={8}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="md"
          >
            <form onSubmit={handleEmailLogin}>
              <VStack spacing={4}>
                {errors.form && (
                  <Box
                    w="full"
                    bg="red.100"
                    border="1px solid"
                    borderColor="red.300"
                    p={3}
                    rounded="md"
                    color="red.800"
                    fontSize="sm"
                  >
                    {errors.form}
                  </Box>
                )}

                {/* Email */}
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Email
                  </FormLabel>
                  <Input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    border="1px solid"
                    borderColor={borderColor}
                  />
                  {errors.email && (
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  )}
                </FormControl>

                {/* Password */}
                <FormControl isInvalid={!!errors.password}>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Password
                  </FormLabel>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    border="1px solid"
                    borderColor={borderColor}
                  />
                  {errors.password && (
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  w="full"
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="Signing in..."
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            <Divider my={6} />

            {/* OAuth Options */}
            <VStack spacing={3}>
              <Text fontSize="sm" color="gray.500" textAlign="center" w="full">
                Or continue with
              </Text>

              <HStack w="full" spacing={3}>
                <Button
                  flex={1}
                  variant="outline"
                  leftIcon={<Icon as={FaGithub} />}
                  onClick={() => {
                    const apiBase =
                      process.env.REACT_APP_API_BASE_URL ||
                      "http://localhost:5000/api";
                    window.location.href = `${apiBase}/auth/github`;
                  }}
                >
                  GitHub
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  leftIcon={<Icon as={FaGoogle} />}
                  onClick={() => {
                    const apiBase =
                      process.env.REACT_APP_API_BASE_URL ||
                      "http://localhost:5000/api";
                    window.location.href = `${apiBase}/auth/google`;
                  }}
                >
                  Google
                </Button>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Signup Link */}
          <MotionBox variants={itemVariants}>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Don't have an account?{" "}
              <ChakraLink
                as={Link}
                to="/signup"
                color="blue.600"
                fontWeight="600"
              >
                Create one
              </ChakraLink>
            </Text>
          </MotionBox>
        </MotionVStack>
      </Container>
    </Box>
  );
};

export default Login;
