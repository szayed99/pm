import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanWorkspace } from "@/components/KanbanWorkspace";

vi.mock("@/components/KanbanBoard", () => ({
  KanbanBoard: ({
    chatPanel,
    onOpenChat,
  }: {
    chatPanel?: React.ReactNode;
    onOpenChat?: () => void;
  }) => (
    <div data-testid="kanban-board">
      {chatPanel}
      {!chatPanel && onOpenChat ? (
        <button type="button" data-testid="ai-chat-open" onClick={onOpenChat}>
          Open
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/AiChatSidebar", () => ({
  AiChatSidebar: ({ onClose }: { onClose: () => void }) => (
    <aside data-testid="ai-chat-sidebar">
      <button type="button" data-testid="ai-chat-close" onClick={onClose}>
        Close
      </button>
    </aside>
  ),
}));

describe("KanbanWorkspace", () => {
  it("opens and closes the AI chat beside the board", async () => {
    render(<KanbanWorkspace onLogout={async () => {}} />);

    expect(screen.queryByTestId("ai-chat-sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-open")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("ai-chat-open"));
    expect(screen.getByTestId("ai-chat-sidebar")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-chat-open")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("ai-chat-close"));
    expect(screen.queryByTestId("ai-chat-sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-open")).toBeInTheDocument();
  });
});
