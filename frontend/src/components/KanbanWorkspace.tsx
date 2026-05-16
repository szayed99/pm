"use client";

import { useState } from "react";
import { AiChatSidebar } from "@/components/AiChatSidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { BoardData } from "@/lib/kanban";

type KanbanWorkspaceProps = {
  onLogout: () => Promise<void>;
};

export const KanbanWorkspace = ({ onLogout }: KanbanWorkspaceProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [boardSync, setBoardSync] = useState<{
    board: BoardData;
    id: number;
  } | null>(null);

  const handleBoardFromAi = (board: BoardData) => {
    setBoardSync({ board, id: Date.now() });
  };

  return (
    <div className="relative min-h-screen w-full">
      <KanbanBoard onLogout={onLogout} boardSync={boardSync} />

      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open AI chat"
          data-testid="ai-chat-open"
          className="fixed bottom-6 right-6 z-40 rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-[var(--shadow)] transition hover:brightness-110"
        >
          AI chat
        </button>
      )}

      {isChatOpen && (
        <>
          <button
            type="button"
            aria-label="Close AI chat backdrop"
            className="fixed inset-0 z-40 bg-[var(--navy-dark)]/25"
            onClick={() => setIsChatOpen(false)}
          />
          <div className="fixed bottom-4 right-4 top-4 z-50 w-full max-w-[380px]">
            <AiChatSidebar
              onClose={() => setIsChatOpen(false)}
              onBoardUpdate={handleBoardFromAi}
            />
          </div>
        </>
      )}
    </div>
  );
};
