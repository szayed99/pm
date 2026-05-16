import { initialData } from "@/lib/kanban";
import { fetchBoard, saveBoard } from "@/lib/board";

describe("board api", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/board" && (!init || init.method === undefined)) {
          return new Response(JSON.stringify(initialData), { status: 200 });
        }
        if (url === "/api/board" && init?.method === "PUT") {
          return new Response(init.body as string, { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the board", async () => {
    const board = await fetchBoard();
    expect(board.columns).toHaveLength(5);
  });

  it("saves the board", async () => {
    const saved = await saveBoard(initialData);
    expect(saved.columns[0].id).toBe("col-backlog");
    expect(fetch).toHaveBeenCalledWith(
      "/api/board",
      expect.objectContaining({ method: "PUT", credentials: "include" })
    );
  });
});
