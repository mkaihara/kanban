import { createId, initialBoard, type Board } from "./board";

export interface Sheet {
  id: string;
  name: string;
  columns: Board;
}

export interface Workspace {
  sheets: Sheet[];
}

const COLUMN_TITLES = ["Backlog", "To Do", "In Progress", "In Review", "Done"];

export const initialWorkspace: Workspace = {
  sheets: [{ id: "launch", name: "Launch Board", columns: initialBoard }],
};

/** Accept a stored workspace, or a legacy single board (which becomes the first sheet). */
export function toWorkspace(data: Workspace | Board): Workspace {
  return Array.isArray(data)
    ? { sheets: [{ id: createId(), name: "Launch Board", columns: data }] }
    : data;
}

export function addSheet(workspace: Workspace): { workspace: Workspace; id: string } {
  const names = new Set(workspace.sheets.map((sheet) => sheet.name));
  let number = workspace.sheets.length + 1;
  while (names.has(`Board ${number}`)) number += 1;
  const sheet: Sheet = {
    id: createId(),
    name: `Board ${number}`,
    columns: COLUMN_TITLES.map((title, index) => ({ id: String(index + 1), title, cards: [] })),
  };
  return { workspace: { sheets: [...workspace.sheets, sheet] }, id: sheet.id };
}

export function renameSheet(workspace: Workspace, id: string, name: string): Workspace {
  return {
    sheets: workspace.sheets.map((sheet) => (sheet.id === id ? { ...sheet, name } : sheet)),
  };
}

export function deleteSheet(workspace: Workspace, id: string): Workspace {
  if (workspace.sheets.length <= 1) return workspace;
  return { sheets: workspace.sheets.filter((sheet) => sheet.id !== id) };
}

export function moveSheet(workspace: Workspace, id: string, overId: string): Workspace {
  const from = workspace.sheets.findIndex((sheet) => sheet.id === id);
  const to = workspace.sheets.findIndex((sheet) => sheet.id === overId);
  if (from === -1 || to === -1 || from === to) return workspace;
  const sheets = [...workspace.sheets];
  sheets.splice(to, 0, ...sheets.splice(from, 1));
  return { sheets };
}

export function updateSheet(
  workspace: Workspace,
  id: string,
  update: (board: Board) => Board,
): Workspace {
  return {
    sheets: workspace.sheets.map((sheet) =>
      sheet.id === id ? { ...sheet, columns: update(sheet.columns) } : sheet,
    ),
  };
}
