"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Sheet } from "@/lib/workspace";

interface SheetTabsProps {
  sheets: Sheet[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, overId: string) => void;
}

export default function SheetTabs({
  sheets,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onMove,
}: SheetTabsProps) {
  const [confirming, setConfirming] = useState<Sheet | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  }

  return (
    <>
      <div className="flex min-w-0 items-end gap-1">
        <DndContext
          id="sheet-tabs"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sheets.map((sheet) => sheet.id)} strategy={horizontalListSortingStrategy}>
            <div role="tablist" aria-label="Boards" className="flex min-w-0 items-end gap-1 overflow-x-auto">
              {sheets.map((sheet) => (
                <SheetTab
                  key={sheet.id}
                  sheet={sheet}
                  active={sheet.id === activeId}
                  deletable={sheets.length > 1}
                  onSelect={() => onSelect(sheet.id)}
                  onRename={(name) => onRename(sheet.id, name)}
                  onDelete={() => setConfirming(sheet)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add board"
          title="Add board"
          className="mb-1 ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-muted transition hover:bg-white hover:text-secondary hover:shadow-sm"
        >
          +
        </button>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-6 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-board-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="delete-board-title" className="text-lg font-semibold text-navy">
              Delete &ldquo;{confirming.name}&rdquo;?
            </h2>
            <p className="mt-2 text-sm text-muted">
              The board and all of its cards will be removed. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(confirming.id);
                  setConfirming(null);
                }}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
              >
                Delete board
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

interface SheetTabProps {
  sheet: Sheet;
  active: boolean;
  deletable: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function SheetTab({ sheet, active, deletable, onSelect, onRename, onDelete }: SheetTabProps) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sheet.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sheet.name);

  function commit() {
    setEditing(false);
    const value = draft.trim();
    if (value && value !== sheet.name) onRename(value);
  }

  return (
    <div
      ref={setNodeRef}
      data-testid={`sheet-tab-${sheet.id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...listeners}
      className={`group relative flex shrink-0 items-center rounded-b-lg border-x border-b transition-colors ${
        active
          ? "z-10 -mt-px border-slate-200 bg-white text-navy shadow-sm"
          : "border-transparent text-muted hover:bg-white/70 hover:text-navy"
      } ${isDragging ? "z-20 opacity-80 shadow-md" : ""}`}
    >
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" aria-hidden="true" />
      ) : null}
      {editing ? (
        <input
          autoFocus
          aria-label="Board name"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setEditing(false);
          }}
          className="mx-2 my-1.5 w-36 rounded-md border border-primary/40 bg-white px-2 py-0.5 text-sm font-semibold text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <button
          type="button"
          role="tab"
          aria-selected={active}
          title="Double-click to rename, drag to reorder"
          onClick={onSelect}
          onDoubleClick={() => {
            setDraft(sheet.name);
            setEditing(true);
          }}
          className={`max-w-56 truncate py-2 text-sm ${deletable ? "pl-4 pr-1" : "px-4"} ${
            active ? "font-semibold" : "font-medium"
          }`}
        >
          {sheet.name}
        </button>
      )}
      {deletable && !editing ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete board: ${sheet.name}`}
          title="Delete board"
          className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-secondary focus:opacity-100 ${
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="h-3 w-3">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
