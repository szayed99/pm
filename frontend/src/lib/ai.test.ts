import { initialData } from "@/lib/kanban";
import { sendChat } from "@/lib/ai";

describe("sendChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts message and history to the chat API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            message: "You have eight cards.",
            board: null,
          }),
          { status: 200 }
        );
      })
    );

    const result = await sendChat("How many cards?", [
      { role: "user", content: "Hello" },
    ]);

    expect(result.message).toBe("You have eight cards.");
    expect(fetch).toHaveBeenCalledWith(
      "/api/ai/chat",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  it("returns board updates from the API", async () => {
    const updated = { ...initialData, columns: [...initialData.columns] };
    updated.columns[0] = { ...updated.columns[0], title: "Ideas" };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({ message: "Renamed.", board: updated }),
          { status: 200 }
        );
      })
    );

    const result = await sendChat("Rename backlog", []);
    expect(result.board?.columns[0].title).toBe("Ideas");
  });
});
