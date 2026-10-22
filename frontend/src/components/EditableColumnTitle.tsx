"use client";

import { useState } from "react";

interface EditableColumnTitleProps {
  title: string;
  onRename: (title: string) => void;
}

export default function EditableColumnTitle({ title, onRename }: EditableColumnTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  function startEditing() {
    setDraft(title);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const value = draft.trim();
    if (value) onRename(value);
    else setDraft(title);
  }

  function cancel() {
    setDraft(title);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        data-testid="column-title-input"
        aria-label="Column title"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") cancel();
        }}
        className="w-36 rounded-md border border-primary/40 bg-white px-2 py-0.5 text-sm font-semibold text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      title="Rename column"
      className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-left transition hover:bg-slate-50"
    >
      <h2 className="text-sm font-semibold text-navy">{title}</h2>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className="h-3 w-3 text-muted opacity-0 transition group-hover:opacity-100"
      >
        <path d="M12 20h9" strokeLinecap="round" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}