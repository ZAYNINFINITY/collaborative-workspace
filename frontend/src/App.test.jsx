import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./api", () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: null, headers: {} })),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("./socket", () => ({
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  },
}));

vi.mock("./auth/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: "",
    refreshUser: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    notifications: [],
    notificationsLoading: false,
    refreshNotifications: vi.fn(),
  }),
}));

vi.mock("./components/AmbientAIAssistant", () => ({ default: () => null }));
vi.mock("./components/CommandPalette", () => ({ default: () => null }));
vi.mock("./components/PageTransition", () => ({
  default: ({ children }) => children,
}));
vi.mock("./pages/Home", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./pages/Login", () => ({ default: () => <div>Login Page</div> }));
vi.mock("./pages/Signup", () => ({ default: () => <div>Signup Page</div> }));
vi.mock("./pages/Dashboard", () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock("./pages/Repositories", () => ({ default: () => <div>Repositories Page</div> }));
vi.mock("./pages/Workspaces", () => ({ default: () => <div>Workspaces Page</div> }));
vi.mock("./pages/Workspace", () => ({ default: () => <div>Workspace Page</div> }));
vi.mock("./pages/InvitationHandler", () => ({
  default: () => <div>Invitation Page</div>,
}));

test("renders app shell", () => {
  render(<App />);
  const homeElement = screen.getByText(/home page/i);
  expect(homeElement).toBeInTheDocument();
});
