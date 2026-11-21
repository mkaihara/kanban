"use client";

import { useState, type FormEvent } from "react";

interface CardFormProps {
  initialTitle?: string;
  initialDetails?: string;
  submitLabel: string;
  onSubmit: (title: string, details: string) => void;
  onCancel: () => void;
}

export default function CardForm({
  initialTitle = "",
  initialDetails = "",
  submitLabel,
  onSubmit,
  onCancel,
}: CardFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [details, setDetails] = useState(initialDetails);

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, details.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit();
      }}
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
        rows={3}
        className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-navy outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-secondary/90"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1.5 text-sm font-medium text-muted transition hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
