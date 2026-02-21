import { render, screen } from "@testing-library/react";
import App from "./App";

// Mock Chakra UI so tests don't depend on its internal utils package
jest.mock("@chakra-ui/react", () => {
  // eslint-disable-next-line global-require
  const React = require("react");

  const MockComponent = ({ children, ...props }) => (
    <div {...props}>{children}</div>
  );

  const useColorModeValue = (light, dark) =>
    light !== undefined ? light : dark;

  return {
    __esModule: true,
    Box: MockComponent,
    Button: MockComponent,
    Container: MockComponent,
    Flex: MockComponent,
    Heading: MockComponent,
    HStack: MockComponent,
    Icon: MockComponent,
    Text: MockComponent,
    VStack: MockComponent,
    Divider: MockComponent, };
});

test("renders login page heading", () => {
  render(<App />);
  const headingElement = screen.getByText(/welcome back/i);
  expect(headingElement).toBeInTheDocument();
});

