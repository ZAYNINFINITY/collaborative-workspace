import React, { useState } from "react";
import { Box, Tooltip, IconButton } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaRobot } from "react-icons/fa";
import { motion } from "framer-motion";

// Animations
const pulseRing = keyframes`
  0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
  100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const AmbientAIAssistant = ({ onOpenCommandPalette }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Box
            position="fixed"
            bottom="24px"
            right="24px"
            zIndex={1000}
            animation={`${float} 4s ease-in-out infinite`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Tooltip
                label="Ask AI (Cmd+K)"
                placement="left"
                hasArrow
                bg="rgba(15, 15, 20, 0.9)"
                color="white"
                border="1px solid rgba(59, 130, 246, 0.4)"
                borderRadius="8px"
                px={3}
                py={2}
                backdropFilter="blur(10px)"
            >
                <Box position="relative">
                    {/* Pulsing ring behind the button */}
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        borderRadius="full"
                        animation={`${pulseRing} 3s cubic-bezier(0.4, 0, 0.6, 1) infinite`}
                        opacity={isHovered ? 0 : 1}
                        transition="opacity 0.2s"
                        zIndex={-1}
                    />

                    <IconButton
                        as={motion.button}
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        icon={<FaRobot size={24} />}
                        onClick={onOpenCommandPalette}
                        isRound
                        size="lg"
                        h="60px"
                        w="60px"
                        bg="linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                        color="white"
                        boxShadow="0 8px 32px rgba(59,130,246, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)"
                        border="1px solid rgba(255,255,255,0.1)"
                        _hover={{
                            bg: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                            boxShadow: "0 12px 40px rgba(139, 92, 246, 0.6), inset 0 2px 0 rgba(255,255,255,0.3)"
                        }}
                        _active={{
                            bg: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)",
                        }}
                    />
                </Box>
            </Tooltip>
        </Box>
    );
};

export default AmbientAIAssistant;
