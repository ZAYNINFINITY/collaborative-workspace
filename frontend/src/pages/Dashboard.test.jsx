import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import API from "../api";

jest.mock("../api");
jest.mock("../components/DashboardNavbar", () => () => <div>Navbar</div>);
jest.mock("../components/DashboardSidebar", () => () => <div>Sidebar</div>);

// Mock Chakra UI to avoid depending on internal utils packages in tests
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
    Flex: MockComponent,
    Heading: MockComponent,
    Text: MockComponent,
    Button: MockComponent,
    Avatar: MockComponent,
    HStack: MockComponent,
    VStack: MockComponent,
    SimpleGrid: MockComponent,
    Grid: MockComponent,
    GridItem: MockComponent,
    Spinner: MockComponent,
    Alert: MockComponent,
    AlertIcon: MockComponent,
  };
});

describe("Dashboard page", () => {
  it("shows user name and recent workspaces", async () => {
    API.get.mockImplementation((url) => {
      if (url === "/auth/user") {
        return Promise.resolve({
          data: {
            username: "john_doe",
            displayName: "John Doe",
          },
        });
      }
      if (url === "/workspaces") {
        return Promise.resolve({
          data: [
            {
              _id: "1",
              name: "Workspace One",
              description: "Test workspace",
              currentUserRole: "admin",
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected URL in mock: ${url}`));
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/workspace one/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });
});


