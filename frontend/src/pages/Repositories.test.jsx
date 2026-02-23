import { vi } from 'vitest';
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Repositories from "./Repositories";
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
    Heading: MockComponent,
    Text: MockComponent,
    VStack: MockComponent,
    HStack: MockComponent,
    Badge: MockComponent,
    Link: MockComponent,
    Spinner: MockComponent,
    Alert: MockComponent,
    AlertIcon: MockComponent,
    Button: MockComponent,
  };
});

describe("Repositories page", () => {
  it("shows repositories from GitHub", async () => {
    API.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          full_name: "user/repo-one",
          html_url: "https://github.com/user/repo-one",
          description: "First repo",
          language: "JavaScript",
          stargazers_count: 10,
          private: false,
          updated_at: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter>
        <Repositories />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/user\/repo-one/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/first repo/i)).toBeInTheDocument();
  });
});



