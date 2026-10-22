"use client";

import { useState, type FormEvent } from "react";

interface AddCardFormProps {
  onSubmit: (title: string, details: string) => void;
}

export default function AddCardForm({ onSubmit }: AddCardFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function close() {
    setOpen(false);
    setTitle("");
    setDetails("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, details.trim());
    close();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border-2 border-dashed border-primary/40 py-2 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/5"
      >
        + Add card
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm"
    >
      <input
        autoFocus
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Card title"
        aria-label="Card title"
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-navy outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <textarea
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Details"
        aria-label="Card details"
        rows={2}
        className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-navy outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-secondary/90"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-md px-2 py-1.5 text-sm font-medium text-muted transition hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}