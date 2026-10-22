import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Board from "@/components/Board";
import { initialBoard } from "@/lib/board";

const COLUMN_TITLES = ["Backlog", "To Do", "In Progress", "In Review", "Done"];

/** Mock fetch; returns the mock so tests can assert on the recorded calls. */
function mockFetch() {
  const fetchMock = vi.fn(async () => {
    const response = new Response(JSON.stringify(initialBoard), {
      headers: { "Content-Type": "application/json" },
    });
    return Promise.resolve(response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderBoard() {
  const fetchMock = mockFetch();
  render(<Board />);
  await screen.findByTestId("column-5");
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

type FetchCall = [input: string, init?: { method?: string; body?: string }];

type SavedBoard = {
  title: string;
  cards: { id: string; title?: string; details?: string }[];
}[];

function savedBoards(fetchMock: ReturnType<typeof mockFetch>): SavedBoard[] {
  return (fetchMock.mock.calls as unknown as FetchCall[])
    .filter((call) => call[1]?.method === "PUT")
    .map((call) => JSON.parse(call[1]!.body!));
}

describe("Board", () => {
  it("loads the board from the API and renders the five columns", async () => {
    const fetchMock = await renderBoard();
    for (const title of COLUMN_TITLES) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByTestId("card-8")).toHaveTextContent("Build drag-and-drop board");
    expect((fetchMock.mock.calls as unknown as FetchCall[])[0][0]).toBe("/api/board");
  });

  it("shows an error message when the board cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("network down"))),
    );
    render(<Board />);
    expect(
      await screen.findByText(/Could not load the board\./),
    ).toBeInTheDocument();
  });

  it("renames a column and saves the change", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard();
    await user.click(screen.getByRole("button", { name: "In Review" }));
    const input = screen.getByLabelText("Column title");
    await user.clear(input);
    await user.type(input, "QA{Enter}");

    expect(screen.getByRole("button", { name: "QA" })).toBeInTheDocument();
    const saves = savedBoards(fetchMock);
    expect(saves.at(-1)).toMatchObject([{ title: "Backlog" }, {}, {}, { title: "QA" }, {}]);
  });

  it("keeps the old title when renaming is cancelled with Escape", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.click(screen.getByRole("button", { name: "Backlog" }));
    const input = screen.getByLabelText("Column title");
    await user.clear(input);
    await user.type(input, "Ideas{Escape}");
    expect(screen.getByRole("button", { name: "Backlog" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Column title")).not.toBeInTheDocument();
  });

  it("adds a card with title and details and saves the change", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard();
    const column = screen.getByTestId("column-2");
    await user.click(within(column).getByRole("button", { name: "+ Add card" }));
    await user.type(screen.getByLabelText("Card title"), "Book the venue");
    await user.type(screen.getByLabelText("Card details"), "Capacity for 120 guests.");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(within(column).getByText("Book the venue")).toBeInTheDocument();
    expect(within(column).getByText("Capacity for 120 guests.")).toBeInTheDocument();
    expect(screen.getByTestId("column-2-count")).toHaveTextContent("4");
    expect(screen.queryByLabelText("Card title")).not.toBeInTheDocument();

    const saved = savedBoards(fetchMock).at(-1) as SavedBoard;
    expect(saved[1].cards.at(-1)).toMatchObject({
      title: "Book the venue",
      details: "Capacity for 120 guests.",
    });
  });

  it("does not add a card when the form is cancelled", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard();
    const column = screen.getByTestId("column-2");
    await user.click(within(column).getByRole("button", { name: "+ Add card" }));
    await user.type(screen.getByLabelText("Card title"), "Never added");
    const savesBefore = savedBoards(fetchMock).length;
    await user.click(within(column).getByRole("button", { name: "Cancel" }));

    expect(within(column).queryByText("Never added")).not.toBeInTheDocument();
    expect(screen.getByTestId("column-2-count")).toHaveTextContent("3");
    expect(savedBoards(fetchMock).length).toBe(savesBefore);
  });

  it("deletes a card and saves the change", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard();
    await user.click(screen.getByRole("button", { name: "Delete card: Design empty states" }));

    await waitFor(() => expect(screen.queryByTestId("card-5")).not.toBeInTheDocument());
    expect(screen.getByTestId("column-2-count")).toHaveTextContent("2");
    const saved = savedBoards(fetchMock).at(-1) as SavedBoard;
    expect(saved[1].cards.map((card) => card.id)).not.toContain("card-5");
  });
});