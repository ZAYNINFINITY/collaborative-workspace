import { vi } from 'vitest';
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Workspaces from "./Workspaces";
import API from "../api";

vi.mock("../api");

// Mock Chakra UI to avoid depending on internal utils packages in tests
vi.mock("@chakra-ui/react", () => {
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
    Heading: MockComponent,
    Text: MockComponent,
    VStack: MockComponent,
    HStack: MockComponent,
    Flex: MockComponent,
    Input: MockComponent,
    Textarea: MockComponent,
    SimpleGrid: MockComponent,
    Spinner: MockComponent,
    Alert: MockComponent,
    AlertIcon: MockComponent,
    FormControl: MockComponent,
    FormLabel: MockComponent,
  };
});

describe("Workspaces page", () => {
  it("lists workspaces from the API", async () => {
    API.get.mockResolvedValueOnce({
      data: [
        { _id: "1", name: "Workspace A", description: "First", currentUserRole: "admin" },
        { _id: "2", name: "Workspace B", description: "Second", currentUserRole: "member" },
      ],
    });

    render(
      <MemoryRouter>
        <Workspaces />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/workspace a/i)).toBeInTheDocument();
    });
    // There may be multiple matches due to descriptive text; just ensure at least one
    const matches = screen.getAllByText(/workspace b/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});



