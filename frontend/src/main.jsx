import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "./index.css";
import App from "./App";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "whiteAlpha.900",
      },
    },
  },
  fonts: {
    heading: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  shadows: {
    neonBlue: "0 0 10px rgba(0, 217, 255, 0.5), 0 0 20px rgba(0, 217, 255, 0.3)",
    neonPurple: "0 0 10px rgba(147, 51, 234, 0.5), 0 0 20px rgba(147, 51, 234, 0.3)",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
        borderRadius: "12px",
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === "blue" ? "cyan.500" : undefined,
          color: props.colorScheme === "blue" ? "gray.900" : undefined,
          _hover: {
            bg: props.colorScheme === "blue" ? "cyan.400" : undefined,
            boxShadow:
              props.colorScheme === "blue"
                ? "var(--chakra-shadows-neonBlue)"
                : undefined,
            transform: "translateY(-2px)",
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }),
        outline: {
          border: "2px solid",
          color: "cyan.400",
          borderColor: "cyan.500",
          _hover: {
            bg: "whiteAlpha.100",
            boxShadow: "var(--chakra-shadows-neonBlue)",
            transform: "translateY(-2px)",
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    Heading: {
      baseStyle: {
        letterSpacing: "-0.02em",
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: "whiteAlpha.50",
            border: "1px solid",
            borderColor: "whiteAlpha.200",
            _hover: {
              borderColor: "whiteAlpha.300",
            },
            _focus: {
              borderColor: "cyan.400",
              boxShadow:
                "0 0 0 1px var(--chakra-colors-cyan-400), var(--chakra-shadows-neonBlue)",
              bg: "whiteAlpha.100",
            },
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "rgba(26, 26, 31, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          boxShadow:
            "0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
);
