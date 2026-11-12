import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Board } from "./board";
import { initialWorkspace, toWorkspace, type Workspace } from "./workspace";

/** The single-board file used before sheets existed; migrated on first run. */
const LEGACY_FILE = path.join(process.cwd(), "data", "board.json");

export function dataFile(): string {
  return process.env.KANBAN_DATA_FILE || path.join(process.cwd(), "data", "kanban.json");
}

async function readJson(file: string): Promise<Workspace | Board | null> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readWorkspace(file = dataFile(), legacyFile = LEGACY_FILE): Promise<Workspace> {
  const stored = await readJson(file);
  if (stored) return toWorkspace(stored);
  // First run at this location: migrate the old board, or seed the dummy data.
  const legacy = await readJson(legacyFile);
  const workspace = legacy ? toWorkspace(legacy) : initialWorkspace;
  await writeWorkspace(workspace, file);
  return workspace;
}

/** Write via a temp file and rename, so a sync client never sees a partial file. */
export async function writeWorkspace(workspace: Workspace, file = dataFile()): Promise<void> {
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ temp, `${JSON.stringify(workspace, null, 2)}\n`);
  await rename(/*turbopackIgnore: true*/ temp, file);
}
