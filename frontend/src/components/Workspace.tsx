"use client";

import { useEffect, useRef, useState } from "react";
import Board from "@/components/Board";
import SheetTabs from "@/components/SheetTabs";
import type { Board as BoardData } from "@/lib/board";
import {
  addSheet,
  deleteSheet,
  moveSheet,
  renameSheet,
  updateSheet,
  type Workspace as WorkspaceData,
} from "@/lib/workspace";

const ACTIVE_SHEET_KEY = "kanban.activeSheet";

export default function Workspace() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [file, setFile] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const saved = useRef<WorkspaceData | null>(null);
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let current = true;
    fetch("/api/workspace")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (current) setFile(decodeURIComponent(response.headers.get("X-Data-File") ?? ""));
        return response.json() as Promise<WorkspaceData>;
      })
      .then((data) => {
        if (!current) return;
        saved.current = data;
        setWorkspace(data);
        setActiveId(localStorage.getItem(ACTIVE_SHEET_KEY));
      })
      .catch(() => {
        if (current) setLoadFailed(true);
      });
    return () => {
      current = false;
    };
  }, []);

  // Save every change, one request at a time so they land in order.
  // The workspace as loaded is already on disk.
  useEffect(() => {
    if (!workspace || workspace === saved.current) return;
    saved.current = workspace;
    const body = JSON.stringify(workspace);
    saving.current = saving.current.then(() =>
      fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => undefined),
    );
  }, [workspace]);

  // Other programs (such as an AI agent) may edit the data file. Reload it when the
  // window regains focus, after pending saves, unless the board changed meanwhile.
  useEffect(() => {
    function reload() {
      saving.current = saving.current.then(async () => {
        const before = saved.current;
        const response = await fetch("/api/workspace").catch(() => null);
        if (!response?.ok) return;
        const data = (await response.json()) as WorkspaceData;
        if (saved.current !== before) return;
        saved.current = data;
        setWorkspace(data);
      });
    }
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  function select(id: string) {
    setActiveId(id);
    localStorage.setItem(ACTIVE_SHEET_KEY, id);
  }

  if (loadFailed) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        Could not load the board. Please check the server and reload.
      </p>
    );
  }

  if (!workspace) return <Skeleton />;

  const active = workspace.sheets.find((sheet) => sheet.id === activeId) ?? workspace.sheets[0];

  function updateBoard(update: (board: BoardData) => BoardData) {
    setWorkspace((current) => current && updateSheet(current, active.id, update));
  }

  function add() {
    const result = addSheet(workspace!);
    setWorkspace(result.workspace);
    select(result.id);
  }

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Kanban</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-navy">{active.name}</h1>
          <div className="mt-2.5 h-1 w-14 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <p className="pb-1 text-sm text-muted">Drag cards between columns to update their status.</p>
      </header>
      <Board key={active.id} board={active.columns} onChange={updateBoard} />
      <footer className="flex items-start justify-between gap-6 border-t border-slate-200 pb-3">
        <SheetTabs
          sheets={workspace.sheets}
          activeId={active.id}
          onSelect={select}
          onAdd={add}
          onRename={(id, name) => setWorkspace(renameSheet(workspace, id, name))}
          onDelete={(id) => setWorkspace(deleteSheet(workspace, id))}
          onMove={(id, overId) => setWorkspace(moveSheet(workspace, id, overId))}
        />
        <p data-testid="data-file" title={file} className="mt-2.5 min-w-0 truncate text-xs text-muted">
          Saved to {file.replace(/^.*\/Library\/Mobile Documents\/com~apple~CloudDocs\//, "iCloud Drive/")}
        </p>
      </footer>
    </>
  );
}

function Skeleton() {
  return (
    <div className="flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-4" aria-busy>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="w-[300px] min-w-[300px] animate-pulse rounded-2xl border border-slate-200/70 bg-white/60 p-3"
        >
          <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
          <div className="mb-2 h-16 rounded-xl bg-slate-200/70" />
          <div className="mb-2 h-16 rounded-xl bg-slate-200/70" />
        </div>
      ))}
    </div>
  );
}
