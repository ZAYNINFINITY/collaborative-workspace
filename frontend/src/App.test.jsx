import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

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
