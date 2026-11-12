import { connection } from "next/server";
import { dataFile, readWorkspace, writeWorkspace } from "@/lib/store";
import type { Workspace } from "@/lib/workspace";

export async function GET() {
  await connection();
  return Response.json(await readWorkspace(), {
    headers: { "X-Data-File": encodeURIComponent(dataFile()) },
  });
}

export async function PUT(request: Request) {
  const workspace = (await request.json()) as Workspace;
  const valid =
    Array.isArray(workspace?.sheets) &&
    workspace.sheets.length > 0 &&
    workspace.sheets.every(
      (sheet) =>
        typeof sheet?.id === "string" &&
        typeof sheet.name === "string" &&
        Array.isArray(sheet.columns) &&
        sheet.columns.every((column) => typeof column?.title === "string" && Array.isArray(column.cards)),
    );
  if (!valid) return Response.json({ error: "Invalid workspace payload" }, { status: 400 });
  await writeWorkspace(workspace);
  return Response.json(workspace);
}
