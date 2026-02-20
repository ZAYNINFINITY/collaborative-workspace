import React from "react";
import { Center, Box, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const BootLoader = () => {
  return (
    <Center h="100vh" w="100vw" bg="gray.900" position="fixed" top={0} left={0} zIndex={9999}>
      <VStack spacing={8}>
        <Box position="relative" w="80px" h="80px">
          {/* Outer glowing ring */}
          <MotionBox
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            borderRadius="full"
            border="2px solid transparent"
            borderTopColor="cyan.400"
            borderRightColor="blue.500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{
              filter: "drop-shadow(0 0 10px rgba(0, 217, 255, 0.5))",
            }}
          />
          {/* Inner pulse orb */}
          <MotionBox
            position="absolute"
            top="50%"
            left="50%"
            w="20px"
            h="20px"
            bg="cyan.300"
            borderRadius="full"
            style={{ x: "-50%", y: "-50%" }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            boxShadow="0 0 20px rgba(0, 217, 255, 0.8)"
          />
        </Box>
        <MotionBox
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Text
            fontFamily="'JetBrains Mono', monospace"
            color="cyan.400"
            fontSize="sm"
            letterSpacing="2px"
            textTransform="uppercase"
          >
            Initializing Workspace...
          </Text>
        </MotionBox>
      </VStack>
    </Center>
  );
};

export default BootLoader;
