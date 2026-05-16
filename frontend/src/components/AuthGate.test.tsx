import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthGate } from "@/components/AuthGate";
import * as auth from "@/lib/auth";

vi.mock("@/lib/auth");

describe("AuthGate", () => {
  beforeEach(() => {
    vi.mocked(auth.fetchCurrentUser).mockResolvedValue(null);
    vi.mocked(auth.login).mockResolvedValue({ username: "user" });
    vi.mocked(auth.logout).mockResolvedValue();
  });

  it("shows the login form when unauthenticated", async () => {
    render(
      <AuthGate>{() => <p>Board</p>}</AuthGate>
    );
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
    expect(screen.queryByText("Board")).not.toBeInTheDocument();
  });

  it("shows children after a successful login", async () => {
    render(
      <AuthGate>{() => <p>Board</p>}</AuthGate>
    );

    await userEvent.type(await screen.findByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Board")).toBeInTheDocument();
  });

  it("returns to login after logout", async () => {
    vi.mocked(auth.fetchCurrentUser).mockResolvedValue({ username: "user" });

    render(
      <AuthGate>
        {({ onLogout }) => (
          <button type="button" onClick={() => onLogout()}>
            Log out
          </button>
        )}
      </AuthGate>
    );

    await userEvent.click(await screen.findByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });
  });
});
