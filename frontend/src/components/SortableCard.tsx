"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardTile from "@/components/CardTile";
import type { Card } from "@/lib/board";

interface SortableCardProps {
  card: Card;
  onDelete: () => void;
}

export default function SortableCard({ card, onDelete }: SortableCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`card-${card.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : undefined}
    >
      <CardTile card={card} onDelete={onDelete} />
    </div>
  );
}