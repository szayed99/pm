import { apiFetch } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

export const fetchBoard = async (): Promise<BoardData> => {
  const response = await apiFetch("/api/board");
  if (response.status === 401) {
    throw new Error("Not authenticated");
  }
  if (!response.ok) {
    throw new Error("Failed to load board");
  }
  return response.json() as Promise<BoardData>;
};

export const saveBoard = async (board: BoardData): Promise<BoardData> => {
  const response = await apiFetch("/api/board", {
    method: "PUT",
    body: JSON.stringify(board),
  });
  if (response.status === 401) {
    throw new Error("Not authenticated");
  }
  if (!response.ok) {
    throw new Error("Failed to save board");
  }
  return response.json() as Promise<BoardData>;
};
