import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  Icon,
  Image, } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaRocket, FaUsers, FaLock, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../api";
import logoImage from "../assets/collab-logo.png";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const featureCardBg = useColorModeValue("gray.50", "gray.700");
  // const textColor = useColorModeValue("gray.900", "white");
  // const textSecondary = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await API.get("/auth/user");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const features = [
    {
      icon: FaUsers,
      title: "Team Collaboration",
      desc: "Work together with your team in real-time",
    },
    {
      icon: FaLock,
      title: "Secure & Private",
      desc: "Your data is encrypted and secure",
    },
    {
      icon: FaClock,
      title: "Real-time Sync",
      desc: "Changes sync instantly across all devices",
    },
    {
      icon: FaRocket,
      title: "Lightning Fast",
      desc: "Optimized for speed and performance",
    },
  ];

  if (loading) return null;

  const MotionBox = motion(Box);
  const MotionVStack = motion(VStack);
  const MotionGridItem = motion(GridItem);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } },
  };

  return (
    <Box minH="100vh" bg={bg}>
      {/* Navbar */}
      <Box
        bg={cardBg}
        borderBottom="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        py={4}
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
      >
        <Container maxW="7xl">
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Image src={logoImage} alt="Collab" h="10" w="10" />
              <Heading size="lg" color="blue.600">
                Collab
              </Heading>
            </HStack>
            <HStack spacing={4}>
              {user ? (
                <>
                  <Text color={textColor} fontWeight="500">
                    Welcome, {user.displayName || user.username}!
                  </Text>
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate("/dashboard")}
                  >
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    color={textColor}
                  >
                    Login
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bg={bg} py={20}>
        <Container maxW="4xl">
          <MotionVStack
            spacing={8}
            textAlign="center"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <MotionVStack spacing={4} variants={itemVariants}>
              <Heading
                size="2xl"
                color={textColor}
                fontWeight="bold"
                lineHeight="1.3"
              >
                Collaborate in Real-Time
              </Heading>
              <Text fontSize="xl" color={textSecondary} maxW="2xl">
                Build amazing things together. Chat, share documents, manage
                tasks, and track progress all in one place.
              </Text>
            </MotionVStack>

            <MotionBox variants={itemVariants}>
              <HStack spacing={4}>
                {!user && (
                  <>
                    <Button
                      size="lg"
                      colorScheme="blue"
                      onClick={() => navigate("/signup")}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/login")}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </HStack>
            </MotionBox>
          </MotionVStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box bg={cardBg} py={20}>
        <Container maxW="6xl">
          <MotionVStack
            spacing={12}
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <MotionVStack textAlign="center" spacing={2} variants={itemVariants}>
              <Heading size="lg" color={textColor}>
                Why Choose Collab?
              </Heading>
              <Text color={textSecondary}>
                Everything you need for seamless team collaboration
              </Text>
            </MotionVStack>

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={8}
              w="full"
            >
              {features.map((feature, idx) => (
                <MotionGridItem key={idx} variants={itemVariants}>
                  <MotionBox
                    bg={featureCardBg}
                    p={8}
                    borderRadius="lg"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <VStack spacing={4} align="start">
                      <Icon as={feature.icon} w={8} h={8} color="blue.600" />
                      <Heading size="md" color={textColor}>
                        {feature.title}
                      </Heading>
                      <Text color={textSecondary}>{feature.desc}</Text>
                    </VStack>
                  </MotionBox>
                </MotionGridItem>
              ))}
            </Grid>
          </MotionVStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg={bg} py={20}>
        <Container maxW="4xl" textAlign="center">
          <VStack spacing={6}>
            <Heading size="xl" color={textColor}>
              Ready to get started?
            </Heading>
            <Text fontSize="lg" color={textSecondary}>
              Join thousands of teams already collaborating on Collab.
            </Text>
            {!user && (
              <Button
                size="lg"
                colorScheme="blue"
                onClick={() => navigate("/signup")}
              >
                Create Free Account
              </Button>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

