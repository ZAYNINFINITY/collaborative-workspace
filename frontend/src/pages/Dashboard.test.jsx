import { vi } from 'vitest';
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import API from "../api";

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    user: { username: "john_doe", displayName: "John Doe", _id: null },
    loading: false,
    error: "",
    logout: vi.fn(),
    refreshUser: vi.fn(),
    setUser: vi.fn(),
    notifications: [],
    notificationsLoading: false,
    refreshNotifications: vi.fn(),
  }),
}));

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("../assets/collab-logo.png", () => ({ default: "collab-logo.png" }));
vi.mock("react-icons/fa", () => ({
  __esModule: true,
  FaGithub: () => null,
  FaPlus: () => null,
  FaUsers: () => null,
  FaChartLine: () => null,
  FaBolt: () => null,
  FaTasks: () => null,
  FaCalendarAlt: () => null,
}));

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
