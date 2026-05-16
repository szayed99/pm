import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { initialData } from "@/lib/kanban";

vi.mock("@/lib/board", () => ({
  fetchBoard: vi.fn(),
  saveBoard: vi.fn(),
}));

import { fetchBoard, saveBoard } from "@/lib/board";

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.mocked(fetchBoard).mockResolvedValue(initialData);
    vi.mocked(saveBoard).mockResolvedValue(initialData);
  });

  it("renders five columns after load", async () => {
    render(<KanbanBoard />);
    expect(await screen.findAllByTestId(/column-/i)).toHaveLength(5);
  });

  it("renames a column and saves", async () => {
    render(<KanbanBoard />);
    const column = await waitFor(() => getFirstColumn());
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");

    await waitFor(() => expect(saveBoard).toHaveBeenCalled());
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    const column = await waitFor(() => getFirstColumn());
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });
});
