import { vi } from 'vitest';
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Repositories from "./Repositories";
import API from "../api";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

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



