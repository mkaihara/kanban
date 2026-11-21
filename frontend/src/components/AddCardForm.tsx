"use client";

import { useState } from "react";
import CardForm from "@/components/CardForm";

interface AddCardFormProps {
  onSubmit: (title: string, details: string) => void;
}

export default function AddCardForm({ onSubmit }: AddCardFormProps) {
  const [open, setOpen] = useState(false);

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
    <CardForm
      submitLabel="Add card"
      onSubmit={(title, details) => {
        onSubmit(title, details);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  );
}
