import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initialBoard } from "./board";
import { readBoard, writeBoard } from "./store";

const dirs: string[] = [];

async function tempFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "kanban-test-"));
  dirs.push(dir);
  return path.join(dir, "board.json");
}

afterEach(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { recursive: true, force: true })),
  );
  dirs.length = 0;
});

describe("readBoard", () => {
  it("seeds the data file with the initial board when it does not exist", async () => {
    const file = await tempFile();
    expect(await readBoard(file)).toEqual(initialBoard);
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual(initialBoard);
  });

  it("returns the persisted board", async () => {
    const file = await tempFile();
    const saved = structuredClone(initialBoard);
    saved[0].cards.push({ id: "new", title: "New", details: "Fresh card" });
    await writeBoard(saved, file);

    expect(await readBoard(file)).toEqual(saved);
    expect(await readBoard(file)).not.toEqual(initialBoard);
  });

  it("propagates read errors other than a missing file", async () => {
    const file = await tempFile();
    const { writeFile } = await import("node:fs/promises");
    await writeFile(file, "{ not json", "utf8");
    await expect(readBoard(file)).rejects.toThrow();
  });
});

describe("writeBoard", () => {
  it("creates parent directories and roundtrips the board", async () => {
    const file = path.join(await tempFile(), "nested", "board.json");
    const board = structuredClone(initialBoard);
    board[0].title = "Renamed";
    await writeBoard(board, file);
    expect(await readBoard(file)).toEqual(board);
  });
});