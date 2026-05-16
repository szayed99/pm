import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/LoginForm";

describe("LoginForm", () => {
  it("shows an error when login fails", async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Username"), "wrong");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid/i);
    expect(onLogin).toHaveBeenCalledWith("wrong", "wrong");
  });

  it("calls onSuccess when login succeeds", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(<LoginForm onLogin={onLogin} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(onLogin).toHaveBeenCalledWith("user", "password");
    expect(onSuccess).toHaveBeenCalled();
  });
});
