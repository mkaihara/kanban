import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialBoard } from "./board";
import { dataFile, readWorkspace, writeWorkspace } from "./store";
import { initialWorkspace, type Workspace } from "./workspace";

const dirs: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "kanban-test-"));
  dirs.push(dir);
  return dir;
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
  dirs.length = 0;
});

describe("dataFile", () => {
  it("defaults to data/kanban.json in the working directory", () => {
    vi.stubEnv("KANBAN_DATA_FILE", undefined);
    expect(dataFile()).toBe(path.join(process.cwd(), "data", "kanban.json"));
  });

  it("uses KANBAN_DATA_FILE when set", () => {
    vi.stubEnv("KANBAN_DATA_FILE", "/somewhere/else/kanban.json");
    expect(dataFile()).toBe("/somewhere/else/kanban.json");
  });
});

describe("readWorkspace", () => {
  it("seeds the data file with the initial workspace when nothing exists", async () => {
    const dir = await tempDir();
    const file = path.join(dir, "kanban.json");
    expect(await readWorkspace(file, path.join(dir, "board.json"))).toEqual(initialWorkspace);
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual(initialWorkspace);
  });

  it("migrates a legacy single-board file into the first sheet", async () => {
    const dir = await tempDir();
    const file = path.join(dir, "icloud", "kanban.json");
    const legacy = path.join(dir, "board.json");
    const board = structuredClone(initialBoard);
    board[0].title = "Ideas";
    await writeFile(legacy, JSON.stringify(board));

    const workspace = await readWorkspace(file, legacy);
    expect(workspace.sheets).toHaveLength(1);
    expect(workspace.sheets[0]).toMatchObject({ name: "Launch Board", columns: board });
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual(workspace);
  });

  it("returns the persisted workspace and ignores the legacy file", async () => {
    const dir = await tempDir();
    const file = path.join(dir, "kanban.json");
    const legacy = path.join(dir, "board.json");
    await writeFile(legacy, JSON.stringify([]));
    const saved: Workspace = { sheets: [{ id: "x", name: "Mine", columns: initialBoard }] };
    await writeWorkspace(saved, file);

    expect(await readWorkspace(file, legacy)).toEqual(saved);
  });

  it("propagates read errors other than a missing file", async () => {
    const dir = await tempDir();
    const file = path.join(dir, "kanban.json");
    await writeFile(file, "{ not json", "utf8");
    await expect(readWorkspace(file, path.join(dir, "board.json"))).rejects.toThrow();
  });
});

describe("writeWorkspace", () => {
  it("creates parent directories and leaves no temp files behind", async () => {
    const dir = await tempDir();
    const file = path.join(dir, "nested", "kanban.json");
    await writeWorkspace(initialWorkspace, file);
    await writeWorkspace(initialWorkspace, file);

    expect(JSON.parse(await readFile(file, "utf8"))).toEqual(initialWorkspace);
    expect(await readdir(path.dirname(file))).toEqual(["kanban.json"]);
  });
});
