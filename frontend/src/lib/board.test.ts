import { describe, expect, it } from "vitest";
import {
  addCard,
  columnDroppableId,
  deleteCard,
  dropTarget,
  findColumnByCardId,
  initialBoard,
  moveCard,
  renameColumn,
  type Board,
} from "./board";

function fixture(): Board {
  return [
    {
      id: "col-1",
      title: "Backlog",
      cards: [
        { id: "a", title: "A", details: "a" },
        { id: "b", title: "B", details: "b" },
      ],
    },
    {
      id: "col-2",
      title: "To Do",
      cards: [{ id: "c", title: "C", details: "c" }],
    },
  ];
}

describe("initialBoard", () => {
  it("has exactly five populated columns", () => {
    expect(initialBoard).toHaveLength(5);
    const cardIds = initialBoard.flatMap((column) => column.cards.map((card) => card.id));
    expect(new Set(cardIds).size).toBe(cardIds.length);
    for (const column of initialBoard) {
      expect(column.title).toBeTruthy();
      expect(column.cards.length).toBeGreaterThan(0);
      for (const card of column.cards) {
        expect(card.title).toBeTruthy();
        expect(typeof card.details).toBe("string");
      }
    }
  });
});

describe("addCard", () => {
  it("appends the card to the target column only", () => {
    const board = fixture();
    const next = addCard(board, "col-2", "New card", "Some details");
    expect(next[1].cards).toHaveLength(2);
    expect(next[1].cards[1]).toMatchObject({ title: "New card", details: "Some details" });
    expect(next[1].cards[0]).toBe(board[1].cards[0]);
    expect(next[0]).toBe(board[0]);
  });

  it("gives the card a unique id", () => {
    const next = addCard(fixture(), "col-1", "New", "");
    const newId = next[0].cards[2].id;
    expect(newId).not.toBe("a");
    expect(newId).not.toBe("b");
  });

  it("leaves the board unchanged for an unknown column", () => {
    const board = fixture();
    expect(addCard(board, "nope", "New", "")).toEqual(board);
  });
});

describe("deleteCard", () => {
  it("removes the card from its column", () => {
    const next = deleteCard(fixture(), "a");
    expect(next[0].cards.map((card) => card.id)).toEqual(["b"]);
    expect(next[1].cards).toHaveLength(1);
  });

  it("leaves the board unchanged for an unknown card", () => {
    const board = fixture();
    expect(deleteCard(board, "nope")).toEqual(board);
  });
});

describe("renameColumn", () => {
  it("renames only the target column", () => {
    const board = fixture();
    const next = renameColumn(board, "col-2", "Sprint backlog");
    expect(next[1].title).toBe("Sprint backlog");
    expect(next[0]).toBe(board[0]);
  });

  it("leaves the board unchanged for an unknown column", () => {
    const board = fixture();
    expect(renameColumn(board, "nope", "X")).toEqual(board);
  });
});

describe("moveCard", () => {
  it("reorders a card within the same column", () => {
    const next = moveCard(fixture(), "a", "col-1", 1);
    expect(next[0].cards.map((card) => card.id)).toEqual(["b", "a"]);
  });

  it("moves a card to the start of another column", () => {
    const next = moveCard(fixture(), "b", "col-2", 0);
    expect(next[0].cards.map((card) => card.id)).toEqual(["a"]);
    expect(next[1].cards.map((card) => card.id)).toEqual(["b", "c"]);
  });

  it("clamps an out-of-range index to the end of the target column", () => {
    const next = moveCard(fixture(), "b", "col-2", 99);
    expect(next[1].cards.map((card) => card.id)).toEqual(["c", "b"]);
  });

  it("inserts into an empty column", () => {
    const board: Board = [
      { id: "col-1", title: "A", cards: [{ id: "a", title: "A", details: "" }] },
      { id: "col-2", title: "B", cards: [] },
    ];
    const next = moveCard(board, "a", "col-2", 0);
    expect(next[0].cards).toHaveLength(0);
    expect(next[1].cards.map((card) => card.id)).toEqual(["a"]);
  });

  it("returns the same board reference for a no-op move", () => {
    const board = fixture();
    expect(moveCard(board, "a", "col-1", 0)).toBe(board);
  });

  it("returns the same board reference for an unknown card", () => {
    const board = fixture();
    expect(moveCard(board, "nope", "col-2", 0)).toBe(board);
  });

  it("returns the same board reference for an unknown target column", () => {
    const board = fixture();
    expect(moveCard(board, "a", "nope", 0)).toBe(board);
  });
});

describe("dropTarget", () => {
  it("targets the end of the column for a column droppable", () => {
    const board = fixture();
    expect(dropTarget(board, columnDroppableId("col-2"))).toEqual({
      columnId: "col-2",
      index: 1,
    });
  });

  it("targets the position of the hovered card", () => {
    const board = fixture();
    expect(dropTarget(board, "b")).toEqual({ columnId: "col-1", index: 1 });
  });

  it("returns null for an unknown or missing over id", () => {
    const board = fixture();
    expect(dropTarget(board, "nope")).toBeNull();
    expect(dropTarget(board, columnDroppableId("nope"))).toBeNull();
    expect(dropTarget(board, undefined)).toBeNull();
  });
});

describe("findColumnByCardId", () => {
  it("finds the column containing the card", () => {
    expect(findColumnByCardId(fixture(), "c")?.id).toBe("col-2");
    expect(findColumnByCardId(fixture(), "nope")).toBeUndefined();
  });
});