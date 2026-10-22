import { readBoard, writeBoard } from "@/lib/store";
import type { Board } from "@/lib/board";

export async function GET() {
  return Response.json(await readBoard());
}

export async function PUT(request: Request) {
  const board = (await request.json()) as Board;
  if (!Array.isArray(board) || !board.every((column) => column && typeof column.title === "string" && Array.isArray(column.cards))) {
    return Response.json({ error: "Invalid board payload" }, { status: 400 });
  }
  await writeBoard(board);
  return Response.json(board);
}