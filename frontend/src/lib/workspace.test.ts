import { describe, expect, it } from "vitest";
import { addCard, initialBoard } from "./board";
import {
  addSheet,
  deleteSheet,
  initialWorkspace,
  moveSheet,
  renameSheet,
  toWorkspace,
  updateSheet,
  type Workspace,
} from "./workspace";

function workspaceOf(...names: string[]): Workspace {
  return {
    sheets: names.map((name, index) => ({ id: `s${index + 1}`, name, columns: [] })),
  };
}

describe("initialWorkspace", () => {
  it("holds the dummy board as a single sheet", () => {
    expect(initialWorkspace.sheets).toHaveLength(1);
    expect(initialWorkspace.sheets[0]).toMatchObject({ name: "Launch Board", columns: initialBoard });
  });
});

describe("toWorkspace", () => {
  it("wraps a legacy single board as the first sheet", () => {
    const workspace = toWorkspace(initialBoard);
    expect(workspace.sheets).toHaveLength(1);
    expect(workspace.sheets[0].name).toBe("Launch Board");
    expect(workspace.sheets[0].columns).toBe(initialBoard);
  });

  it("returns a workspace unchanged", () => {
    const workspace = workspaceOf("A", "B");
    expect(toWorkspace(workspace)).toBe(workspace);
  });
});

describe("addSheet", () => {
  it("appends an empty board with the five standard columns", () => {
    const { workspace, id } = addSheet(workspaceOf("Board 1"));
    expect(workspace.sheets).toHaveLength(2);
    const sheet = workspace.sheets[1];
    expect(sheet.id).toBe(id);
    expect(sheet.name).toBe("Board 2");
    expect(sheet.columns.map((column) => column.title)).toEqual([
      "Backlog",
      "To Do",
      "In Progress",
      "In Review",
      "Done",
    ]);
    expect(sheet.columns.every((column) => column.cards.length === 0)).toBe(true);
  });

  it("picks the next unused name", () => {
    const { workspace } = addSheet(workspaceOf("Board 2", "Board 3"));
    expect(workspace.sheets[2].name).toBe("Board 4");
  });
});

describe("renameSheet", () => {
  it("renames only the given sheet", () => {
    const workspace = renameSheet(workspaceOf("A", "B"), "s2", "Roadmap");
    expect(workspace.sheets.map((sheet) => sheet.name)).toEqual(["A", "Roadmap"]);
  });
});

describe("deleteSheet", () => {
  it("removes the given sheet", () => {
    const workspace = deleteSheet(workspaceOf("A", "B", "C"), "s2");
    expect(workspace.sheets.map((sheet) => sheet.name)).toEqual(["A", "C"]);
  });

  it("never deletes the last sheet", () => {
    const original = workspaceOf("A");
    expect(deleteSheet(original, "s1")).toBe(original);
  });
});

describe("moveSheet", () => {
  it("moves a sheet forward", () => {
    const workspace = moveSheet(workspaceOf("A", "B", "C"), "s1", "s3");
    expect(workspace.sheets.map((sheet) => sheet.name)).toEqual(["B", "C", "A"]);
  });

  it("moves a sheet backward", () => {
    const workspace = moveSheet(workspaceOf("A", "B", "C"), "s3", "s1");
    expect(workspace.sheets.map((sheet) => sheet.name)).toEqual(["C", "A", "B"]);
  });

  it("ignores unknown ids", () => {
    const original = workspaceOf("A", "B");
    expect(moveSheet(original, "s1", "nope")).toBe(original);
  });
});

describe("updateSheet", () => {
  it("applies a board update to only the given sheet", () => {
    const original: Workspace = {
      sheets: [
        { id: "a", name: "A", columns: initialBoard },
        { id: "b", name: "B", columns: initialBoard },
      ],
    };
    const workspace = updateSheet(original, "b", (board) => addCard(board, "1", "New", "Card"));
    expect(workspace.sheets[0].columns).toBe(initialBoard);
    expect(workspace.sheets[1].columns[0].cards.at(-1)).toMatchObject({ title: "New" });
  });
});
