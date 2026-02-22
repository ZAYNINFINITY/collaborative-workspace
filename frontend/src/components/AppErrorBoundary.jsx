import React from "react";
import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Keep this visible in production logs until external monitoring is wired.
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box minH="100vh" bg="gray.900" color="white" display="grid" placeItems="center" px={6}>
        <VStack spacing={4} maxW="lg" textAlign="center">
          <Heading size="md">Something went wrong</Heading>
          <Text color="gray.300">
            The workspace UI hit an unexpected error. Please retry.
          </Text>
          <Button colorScheme="blue" onClick={this.handleRetry}>
            Retry
          </Button>
        </VStack>
      </Box>
    );
  }
}

export default AppErrorBoundary;
