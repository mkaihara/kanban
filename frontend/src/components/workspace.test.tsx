import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Workspace from "@/components/Workspace";
import { initialBoard } from "@/lib/board";
import type { Workspace as WorkspaceData } from "@/lib/workspace";

const COLUMN_TITLES = ["Backlog", "To Do", "In Progress", "In Review", "Done"];

const twoSheets: WorkspaceData = {
  sheets: [
    { id: "launch", name: "Launch Board", columns: initialBoard },
    {
      id: "ops",
      name: "Ops",
      columns: [{ id: "1", title: "Queue", cards: [{ id: "z", title: "Rotate keys", details: "" }] }],
    },
  ],
};

/** Mock fetch; returns the mock so tests can assert on the recorded calls. */
function mockFetch(workspace: WorkspaceData) {
  const fetchMock = vi.fn(async () =>
    Promise.resolve(
      new Response(JSON.stringify(workspace), {
        headers: {
          "Content-Type": "application/json",
          "X-Data-File": encodeURIComponent("/Users/me/Library/Mobile Documents/com~apple~CloudDocs/Kanban/kanban.json"),
        },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderBoard(workspace: WorkspaceData = { sheets: [twoSheets.sheets[0]] }) {
  const fetchMock = mockFetch(workspace);
  render(<Workspace />);
  await screen.findByTestId("column-1");
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

type FetchCall = [input: string, init?: { method?: string; body?: string }];

function savedWorkspaces(fetchMock: ReturnType<typeof mockFetch>): WorkspaceData[] {
  return (fetchMock.mock.calls as unknown as FetchCall[])
    .filter((call) => call[1]?.method === "PUT")
    .map((call) => JSON.parse(call[1]!.body!));
}

type SavedBoard = WorkspaceData["sheets"][number]["columns"];

function savedBoards(fetchMock: ReturnType<typeof mockFetch>): SavedBoard[] {
  return savedWorkspaces(fetchMock).map((workspace) => workspace.sheets[0].columns);
}

describe("Workspace board", () => {
  it("loads the workspace from the API and renders the five columns without saving", async () => {
    const fetchMock = await renderBoard();
    for (const title of COLUMN_TITLES) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByTestId("card-8")).toHaveTextContent("Build drag-and-drop board");
    expect((fetchMock.mock.calls as unknown as FetchCall[])[0][0]).toBe("/api/workspace");
    expect(screen.getByRole("heading", { name: "Launch Board" })).toBeInTheDocument();
    expect(screen.getByTestId("data-file")).toHaveTextContent("Saved to iCloud Drive/Kanban/kanban.json");
    expect(savedWorkspaces(fetchMock)).toEqual([]);
  });

  it("shows an error message when the board cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("network down"))),
    );
    render(<Workspace />);
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
describe("Workspace tabs", () => {
  it("shows a tab per board and switches boards", async () => {
    const user = userEvent.setup();
    await renderBoard(twoSheets);
    expect(screen.getByRole("tab", { name: "Launch Board" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "Ops" }));
    expect(screen.getByRole("heading", { name: "Ops" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ops" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Rotate keys")).toBeInTheDocument();
    expect(screen.queryByTestId("card-1")).not.toBeInTheDocument();
    expect(localStorage.getItem("kanban.activeSheet")).toBe("ops");
  });

  it("reopens the last active board", async () => {
    localStorage.setItem("kanban.activeSheet", "ops");
    await renderBoard(twoSheets);
    expect(screen.getByRole("heading", { name: "Ops" })).toBeInTheDocument();
  });

  it("adds an empty board, selects it and saves", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard();
    await user.click(screen.getByRole("button", { name: "Add board" }));

    expect(screen.getByRole("heading", { name: "Board 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Board 2" })).toHaveAttribute("aria-selected", "true");
    for (const title of COLUMN_TITLES) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByText("No cards yet")).toHaveLength(5);
    expect(savedWorkspaces(fetchMock).at(-1)!.sheets.map((sheet) => sheet.name)).toEqual([
      "Launch Board",
      "Board 2",
    ]);
  });

  it("changes cards only on the active board", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard(twoSheets);
    await user.click(screen.getByRole("tab", { name: "Ops" }));
    await user.click(screen.getByRole("button", { name: "Delete card: Rotate keys" }));

    const saved = savedWorkspaces(fetchMock).at(-1)!;
    expect(saved.sheets[1].columns[0].cards).toEqual([]);
    expect(saved.sheets[0].columns).toEqual(initialBoard);
  });

  it("renames a board by double-clicking its tab", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard(twoSheets);
    await user.dblClick(screen.getByRole("tab", { name: "Ops" }));
    const input = screen.getByLabelText("Board name");
    await user.clear(input);
    await user.type(input, "Operations{Enter}");

    expect(screen.getByRole("tab", { name: "Operations" })).toBeInTheDocument();
    expect(savedWorkspaces(fetchMock).at(-1)!.sheets[1].name).toBe("Operations");
  });

  it("keeps the board name when renaming is cancelled with Escape", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard(twoSheets);
    await user.dblClick(screen.getByRole("tab", { name: "Ops" }));
    await user.type(screen.getByLabelText("Board name"), "xyz{Escape}");

    expect(screen.getByRole("tab", { name: "Ops" })).toBeInTheDocument();
    expect(savedWorkspaces(fetchMock)).toEqual([]);
  });

  it("deletes a board after confirmation", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard(twoSheets);
    await user.click(screen.getByRole("button", { name: "Delete board: Ops" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Delete “Ops”?");
    await user.click(within(dialog).getByRole("button", { name: "Delete board" }));

    expect(screen.queryByRole("tab", { name: "Ops" })).not.toBeInTheDocument();
    expect(savedWorkspaces(fetchMock).at(-1)!.sheets.map((sheet) => sheet.id)).toEqual(["launch"]);
  });

  it("keeps the board when deletion is cancelled", async () => {
    const user = userEvent.setup();
    const fetchMock = await renderBoard(twoSheets);
    await user.click(screen.getByRole("button", { name: "Delete board: Ops" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ops" })).toBeInTheDocument();
    expect(savedWorkspaces(fetchMock)).toEqual([]);
  });

  it("cannot delete the only board", async () => {
    await renderBoard();
    expect(screen.queryByRole("button", { name: /Delete board/ })).not.toBeInTheDocument();
  });
});

describe("Workspace reload", () => {
  it("reloads the workspace when the window regains focus, without saving it back", async () => {
    const fetchMock = await renderBoard(twoSheets);
    const edited = structuredClone(twoSheets);
    edited.sheets[0].name = "Edited elsewhere";
    fetchMock.mockImplementation(async () =>
      Promise.resolve(new Response(JSON.stringify(edited), { headers: { "Content-Type": "application/json" } })),
    );

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(await screen.findByRole("heading", { name: "Edited elsewhere" })).toBeInTheDocument();
    expect(savedWorkspaces(fetchMock)).toEqual([]);
  });
});
