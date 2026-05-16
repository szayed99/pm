"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { sendChat, type ChatTurn } from "@/lib/ai";
import type { BoardData } from "@/lib/kanban";

type AiChatSidebarProps = {
  onBoardUpdate: (board: BoardData) => void;
  onClose: () => void;
};

export const AiChatSidebar = ({ onBoardUpdate, onClose }: AiChatSidebarProps) => {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list && "scrollTo" in list) {
      list.scrollTo({ top: list.scrollHeight });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) {
      return;
    }

    const userTurn: ChatTurn = { role: "user", content: text };
    const history = [...messages, userTurn];
    setMessages(history);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendChat(text, messages);
      setMessages([...history, { role: "assistant", content: result.message }]);
      if (result.board) {
        onBoardUpdate(result.board);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      data-testid="ai-chat-sidebar"
      role="dialog"
      aria-label="Board chat"
      className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/40 bg-white/65 shadow-[var(--shadow)] backdrop-blur-xl"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/30 bg-white/20 px-5 py-4 backdrop-blur-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            Assistant
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[var(--navy-dark)]">
            Board chat
          </h2>
          <p className="mt-2 text-xs leading-5 text-[var(--gray-text)]">
            Ask about your Kanban. The assistant can update cards and columns when
            needed.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          data-testid="ai-chat-close"
          className="shrink-0 rounded-full border border-[var(--stroke)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)] transition hover:border-[var(--primary-blue)] hover:text-[var(--navy-dark)]"
        >
          Close
        </button>
      </header>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-[var(--gray-text)]">
            Try: &quot;Summarize my board&quot; or &quot;Add a card called Ship
            v1 to Backlog&quot;
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <p
              data-testid={
                message.role === "user" ? "ai-message-user" : "ai-message-assistant"
              }
              className={
                message.role === "user"
                  ? "max-w-[90%] rounded-2xl bg-[var(--secondary-purple)] px-4 py-3 text-sm leading-6 text-white"
                  : "max-w-[90%] rounded-2xl border border-white/40 bg-white/55 px-4 py-3 text-sm leading-6 text-[var(--navy-dark)] backdrop-blur-sm"
              }
            >
              {message.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <p className="text-sm text-[var(--gray-text)]">Thinking...</p>
        )}
      </div>

      <footer className="border-t border-white/30 bg-white/20 p-4 backdrop-blur-sm">
        {error && (
          <p role="alert" className="mb-3 text-sm text-[#b00020]">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your board..."
            aria-label="Chat message"
            disabled={isLoading}
            className="min-w-0 flex-1 rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm text-[var(--navy-dark)] outline-none backdrop-blur-sm transition focus:border-[var(--primary-blue)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </footer>
    </aside>
  );
};
