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
    <KanbanBoard
      onLogout={onLogout}
      boardSync={boardSync}
      onOpenChat={() => setIsChatOpen(true)}
      chatPanel={
        isChatOpen ? (
          <AiChatSidebar
            onClose={() => setIsChatOpen(false)}
            onBoardUpdate={handleBoardFromAi}
          />
        ) : undefined
      }
    />
  );
};
