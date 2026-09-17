"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { fetchBoard, saveBoard } from "@/lib/board";
import {
  COLUMN_ACCENT_COLORS,
  createId,
  moveCard,
  type BoardData,
} from "@/lib/kanban";

const SAVE_DEBOUNCE_MS = 400;

type BoardSync = {
  board: BoardData;
  id: number;
};

type KanbanBoardProps = {
  onLogout?: () => void | Promise<void>;
  boardSync?: BoardSync | null;
  chatPanel?: ReactNode;
  onOpenChat?: () => void;
};

export const KanbanBoard = ({
  onLogout,
  boardSync,
  chatPanel,
  onOpenChat,
}: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const skipNextSave = useRef(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    if (!boardSync) {
      return;
    }
    skipNextSave.current = true;
    setBoard(boardSync.board);
    setLoadState("ready");
    setSaveError(null);
  }, [boardSync?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchBoard()
      .then((data) => {
        if (!cancelled) {
          setBoard(data);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadState !== "ready" || !board) {
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      saveBoard(board)
        .then(() => setSaveError(null))
        .catch(() => setSaveError("Failed to save changes."));
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [board, loadState]);

  const cardsById = useMemo(() => board?.cards ?? {}, [board?.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id || !board) {
      return;
    }

    setBoard((prev) =>
      prev
        ? {
            ...prev,
            columns: moveCard(
              prev.columns,
              active.id as string,
              over.id as string
            ),
          }
        : prev
    );
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    setBoard((prev) =>
      prev
        ? {
            ...prev,
            columns: prev.columns.map((column) =>
              column.id === columnId ? { ...column, title } : column
            ),
          }
        : prev
    );
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    setBoard((prev) =>
      prev
        ? {
            ...prev,
            cards: {
              ...prev.cards,
              [id]: { id, title, details: details || "No details yet." },
            },
            columns: prev.columns.map((column) =>
              column.id === columnId
                ? { ...column, cardIds: [...column.cardIds, id] }
                : column
            ),
          }
        : prev
    );
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    setBoard((prev) =>
      prev
        ? {
            ...prev,
            cards: Object.fromEntries(
              Object.entries(prev.cards).filter(([id]) => id !== cardId)
            ),
            columns: prev.columns.map((column) =>
              column.id === columnId
                ? {
                    ...column,
                    cardIds: column.cardIds.filter((id) => id !== cardId),
                  }
                : column
            ),
          }
        : prev
    );
  };

  if (loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--gray-text)]">
        Loading board...
      </div>
    );
  }

  if (loadState === "error" || !board) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-[#b00020]">
        Could not load your board. Try refreshing the page.
      </div>
    );
  }

  const activeCard = activeCardId ? cardsById[activeCardId] : null;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative flex h-full w-full min-h-0 flex-col gap-3 overflow-hidden px-6 py-4">
        {saveError && (
          <p
            role="alert"
            className="shrink-0 rounded-2xl border border-[#b00020]/20 bg-white/90 px-4 py-3 text-sm text-[#b00020]"
          >
            {saveError}
          </p>
        )}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--stroke)] bg-white/80 px-6 py-3 shadow-[var(--shadow)] backdrop-blur">
          <div>
            <h1 className="font-display text-xl font-semibold text-[var(--navy-dark)]">
              Kanban Studio
            </h1>
            <p className="text-xs text-[var(--gray-text)]">
              Keep momentum visible across your board.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {board.columns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--stroke)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--navy-dark)]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      COLUMN_ACCENT_COLORS[index % COLUMN_ACCENT_COLORS.length],
                  }}
                />
                {column.title}
              </div>
            ))}
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={() => onLogout()}
              className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)] transition hover:border-[var(--primary-blue)] hover:text-[var(--navy-dark)]"
            >
              Log out
            </button>
          )}
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section
            className={clsx(
              "grid min-h-0 flex-1 grid-rows-1 gap-3",
              chatPanel ? "grid-cols-[repeat(5,minmax(0,1fr))_300px]" : "grid-cols-5"
            )}
            data-testid="kanban-columns"
          >
            {board.columns.map((column, index) => (
              <KanbanColumn
                key={column.id}
                column={column}
                accentColor={
                  COLUMN_ACCENT_COLORS[index % COLUMN_ACCENT_COLORS.length]
                }
                cards={column.cardIds.map((cardId) => board.cards[cardId])}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
            {chatPanel && <div className="min-h-0">{chatPanel}</div>}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {!chatPanel && onOpenChat && (
        <button
          type="button"
          onClick={onOpenChat}
          aria-label="Open AI chat"
          data-testid="ai-chat-open"
          className="fixed bottom-6 right-6 z-40 rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-[var(--shadow)] transition hover:brightness-110"
        >
          AI chat
        </button>
      )}
    </div>
  );
};
