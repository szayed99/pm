import { apiFetch } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatResponse = {
  message: string;
  board: BoardData | null;
};

export const sendChat = async (
  message: string,
  history: ChatTurn[]
): Promise<AiChatResponse> => {
  const response = await apiFetch("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }
  if (response.status === 422) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(body?.detail ?? "Invalid AI response");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(body?.detail ?? "AI request failed");
  }

  return response.json() as Promise<AiChatResponse>;
};
