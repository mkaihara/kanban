"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardForm from "@/components/CardForm";
import CardTile from "@/components/CardTile";
import type { Card } from "@/lib/board";

interface SortableCardProps {
  card: Card;
  onEdit: (title: string, details: string) => void;
  onDelete: () => void;
}

export default function SortableCard({ card, onEdit, onDelete }: SortableCardProps) {
  const [editing, setEditing] = useState(false);
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
    disabled: editing,
  });

  if (editing) {
    return (
      <div ref={setNodeRef} data-testid={`card-${card.id}`}>
        <CardForm
          initialTitle={card.title}
          initialDetails={card.details}
          submitLabel="Save"
          onSubmit={(title, details) => {
            onEdit(title, details);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-testid={`card-${card.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onDoubleClick={() => setEditing(true)}
      title="Double-click to edit"
      className={isDragging ? "opacity-40" : undefined}
    >
      <CardTile card={card} onDelete={onDelete} />
    </div>
  );
}
