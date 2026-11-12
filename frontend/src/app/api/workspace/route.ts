import { connection } from "next/server";
import { isLocalRequest } from "@/lib/local-request";
import { dataFile, readWorkspace, writeWorkspace } from "@/lib/store";
import type { Workspace } from "@/lib/workspace";

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 });

export async function GET(request: Request) {
  await connection();
  if (!isLocalRequest(request)) return forbidden();
  return Response.json(await readWorkspace(), {
    headers: { "X-Data-File": encodeURIComponent(dataFile()) },
  });
}

export async function PUT(request: Request) {
  if (!isLocalRequest(request)) return forbidden();
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
