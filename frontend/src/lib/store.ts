import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { initialBoard, type Board } from "./board";

const DATA_FILE = path.join(process.cwd(), "data", "board.json");

export async function readBoard(file = DATA_FILE): Promise<Board> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ file, "utf8")) as Board;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // First run: seed the store with the dummy board.
    await writeBoard(initialBoard, file);
    return initialBoard;
  }
}

export async function writeBoard(board: Board, file = DATA_FILE): Promise<void> {
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ file, `${JSON.stringify(board, null, 2)}\n`);
}