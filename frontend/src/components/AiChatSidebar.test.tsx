import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiChatSidebar } from "@/components/AiChatSidebar";
import { initialData } from "@/lib/kanban";

vi.mock("@/lib/ai", () => ({
  sendChat: vi.fn(),
}));

import { sendChat } from "@/lib/ai";

describe("AiChatSidebar", () => {
  it("sends a message and shows the assistant reply", async () => {
    vi.mocked(sendChat).mockResolvedValue({
      message: "You have five columns.",
      board: null,
    });
    const onBoardUpdate = vi.fn();

    render(<AiChatSidebar onBoardUpdate={onBoardUpdate} onClose={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText("Chat message"),
      "Summarize the board"
    );
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByTestId("ai-message-user")).toHaveTextContent(
      "Summarize the board"
    );
    expect(await screen.findByTestId("ai-message-assistant")).toHaveTextContent(
      "You have five columns."
    );
    expect(onBoardUpdate).not.toHaveBeenCalled();
  });

  it("applies board updates from the assistant", async () => {
    const updated = structuredClone(initialData);
    updated.columns[0].title = "Ideas";
    vi.mocked(sendChat).mockResolvedValue({
      message: "Renamed the column.",
      board: updated,
    });
    const onBoardUpdate = vi.fn();

    render(<AiChatSidebar onBoardUpdate={onBoardUpdate} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Chat message"), "Rename backlog");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(onBoardUpdate).toHaveBeenCalledWith(updated));
  });

  it("shows an error when the chat API fails", async () => {
    vi.mocked(sendChat).mockRejectedValue(new Error("AI request failed"));

    render(<AiChatSidebar onBoardUpdate={vi.fn()} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Chat message"), "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("AI request failed");
  });
});
