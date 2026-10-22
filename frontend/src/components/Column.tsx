"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import AddCardForm from "@/components/AddCardForm";
import EditableColumnTitle from "@/components/EditableColumnTitle";
import SortableCard from "@/components/SortableCard";
import { columnDroppableId, type Column } from "@/lib/board";

interface ColumnViewProps {
  column: Column;
  onRename: (title: string) => void;
  onAddCard: (title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function ColumnView({
  column,
  onRename,
  onAddCard,
  onDeleteCard,
}: ColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(column.id) });

  return (
    <section
      data-testid={`column-${column.id}`}
      aria-label={column.title}
      className="flex h-full w-[300px] min-w-[300px] flex-col rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
        <EditableColumnTitle title={column.title} onRename={onRename} />
        <span
          data-testid={`column-${column.id}-count`}
          className="rounded-full bg-page px-2 py-0.5 text-xs font-semibold text-muted"
        >
          {column.cards.length}
        </span>
      </header>
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors ${
            isOver ? "bg-primary/5" : ""
          }`}
        >
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} onDelete={() => onDeleteCard(card.id)} />
          ))}
          {column.cards.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-slate-200 py-6 text-center text-xs text-muted">
              No cards yet
            </p>
          ) : null}
        </div>
      </SortableContext>
      <div className="mt-2 px-3 pb-3">
        <AddCardForm onSubmit={onAddCard} />
      </div>
    </section>
  );
}