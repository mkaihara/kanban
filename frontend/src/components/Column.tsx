"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddCardForm from "@/components/AddCardForm";
import EditableColumnTitle from "@/components/EditableColumnTitle";
import SortableCard from "@/components/SortableCard";
import { columnDroppableId, type Column } from "@/lib/board";

interface ColumnViewProps {
  column: Column;
  onRename: (title: string) => void;
  onDelete?: () => void;
  onAddCard: (title: string, details: string) => void;
  onEditCard: (cardId: string, title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function ColumnView({
  column,
  onRename,
  onDelete,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: ColumnViewProps) {
  // The whole column is the drop zone for cards; its header is the handle for moving it.
  const {
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({
    id: columnDroppableId(column.id),
    data: { type: "column", columnId: column.id },
  });
  const cardOver = isOver && active?.data.current?.type !== "column";

  return (
    <section
      ref={setNodeRef}
      data-testid={`column-${column.id}`}
      aria-label={column.title}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex h-full w-[300px] min-w-[300px] flex-col rounded-2xl border border-slate-200/70 bg-white shadow-sm ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <header
        ref={setActivatorNodeRef}
        {...listeners}
        title="Drag to move column"
        className="group/header flex cursor-grab items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 active:cursor-grabbing"
      >
        <EditableColumnTitle title={column.title} onRename={onRename} />
        <div className="flex items-center gap-1">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete column: ${column.title}`}
              title="Delete column"
              className="rounded-md p-1 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover/header:opacity-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="h-3 w-3">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
          <span
            data-testid={`column-${column.id}-count`}
            className="rounded-full bg-page px-2 py-0.5 text-xs font-semibold text-muted"
          >
            {column.cards.length}
          </span>
        </div>
      </header>
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors ${
            cardOver ? "bg-primary/5" : ""
          }`}
        >
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={(title, details) => onEditCard(card.id, title, details)}
              onDelete={() => onDeleteCard(card.id)}
            />
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
