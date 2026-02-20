import React, { useState } from "react";
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
  FormErrorMessage,
  useColorModeValue,
  useToast,
  Link as ChakraLink,
  Divider,
  Icon,
  Image,
} from "@chakra-ui/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import logoImage from "../assets/collab-logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "white");

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await API.post("/auth/signup", {
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
      });

      toast({
        title: "Account created!",
        description: "You can now login with your email and password.",
        status: "success",
        duration: 3,
        isClosable: true,
      });

      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.msg || "Failed to create account";
      toast({
        title: "Error",
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

  return (
    <Box minH="100vh" bg={bg} py={12}>
      <Container maxW="md">
        <VStack spacing={8}>
          <VStack spacing={2} textAlign="center">
            <HStack justifyContent="center">
              <Image src={logoImage} alt="Collab" h="12" w="12" />
            </HStack>
            <Heading size="lg" color="blue.600">
              Create Account
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Join Collab and start collaborating with your team
            </Text>
          </VStack>

          {/* Email/Password Signup Form */}
          <Box
            w="full"
            bg={cardBg}
            rounded="lg"
            p={8}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="md"
          >
            <form onSubmit={handleSignup}>
              <VStack spacing={4}>
                {/* Full Name */}
                <FormControl isInvalid={!!errors.displayName}>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Full Name
                  </FormLabel>
                  <Input
                    type="text"
                    name="displayName"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={handleChange}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    border="1px solid"
                    borderColor={borderColor}
                  />
                  {errors.displayName && (
                    <FormErrorMessage>{errors.displayName}</FormErrorMessage>
                  )}
                </FormControl>

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

                {/* Confirm Password */}
                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Confirm Password
                  </FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    bg={useColorModeValue("gray.50", "gray.700")}
                    border="1px solid"
                    borderColor={borderColor}
                  />
                  {errors.confirmPassword && (
                    <FormErrorMessage>
                      {errors.confirmPassword}
                    </FormErrorMessage>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  w="full"
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="Creating Account..."
                >
                  Create Account
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
                    const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
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
                    const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
                    window.location.href = `${apiBase}/auth/google`;
                  }}
                >
                  Google
                </Button>
              </HStack>
            </VStack>
          </Box>

          {/* Login Link */}
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Already have an account?{" "}
            <ChakraLink as={Link} to="/login" color="blue.600" fontWeight="600">
              Sign In
            </ChakraLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default Signup;
