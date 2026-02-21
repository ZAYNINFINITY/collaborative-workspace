import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./components/AmbientAIAssistant", () => () => null);
jest.mock("./components/CommandPalette", () => () => null);
jest.mock("./components/PageTransition", () => ({ children }) => children);
jest.mock("./components/BootLoader", () => () => <div>Loading...</div>);
jest.mock("./pages/Home", () => () => <div>Home Page</div>);
jest.mock("./pages/Login", () => () => <div>Login Page</div>);
jest.mock("./pages/Signup", () => () => <div>Signup Page</div>);
jest.mock("./pages/Dashboard", () => () => <div>Dashboard Page</div>);
jest.mock("./pages/Repositories", () => () => <div>Repositories Page</div>);
jest.mock("./pages/Workspaces", () => () => <div>Workspaces Page</div>);
jest.mock("./pages/Workspace", () => () => <div>Workspace Page</div>);
jest.mock("./pages/InvitationHandler", () => () => <div>Invitation Page</div>);

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
    Divider: MockComponent,
  };
});

test("renders app shell", () => {
  render(<App />);
  const loadingElement = screen.getByText(/loading/i);
  expect(loadingElement).toBeInTheDocument();
});

