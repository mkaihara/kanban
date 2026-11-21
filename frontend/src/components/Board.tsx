"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import CardTile from "@/components/CardTile";
import ColumnView from "@/components/Column";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  addCard,
  addColumn,
  columnDroppableId,
  deleteCard,
  deleteColumn,
  dropTarget,
  editCard,
  findColumnByCardId,
  moveCard,
  moveColumn,
  renameColumn,
  type Board as BoardData,
  type Column,
} from "@/lib/board";

const collisionDetection: CollisionDetection = (args) => {
  // A dragged column only lands on other columns.
  if (args.active.data.current?.type === "column") {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => container.data.current?.type === "column",
      ),
    });
  }
  const collisions = pointerWithin(args);
  return collisions.length > 0 ? collisions : rectIntersection(args);
};

interface BoardProps {
  board: BoardData;
  onChange: (update: (current: BoardData) => BoardData) => void;
}

export default function Board({ board, onChange }: BoardProps) {
  // While a card is dragged, moves happen on this local copy; the drop commits it.
  const [dragBoard, setDragBoard] = useState<BoardData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Column | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const shown = dragBoard ?? board;

  const activeCard = activeId
    ? (findColumnByCardId(shown, activeId)?.cards.find((card) => card.id === activeId) ?? null)
    : null;
  const activeColumn = activeId
    ? (shown.find((column) => columnDroppableId(column.id) === activeId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setDragBoard(board);
    setActiveId(String(event.active.id));
  }

  // Moves between columns happen while dragging; within a column the sortable
  // animation shows the new spot and the reorder is applied on drop. Reordering
  // in state mid-drag makes `over` flip-flop in long columns (infinite updates).
  function handleDragOver({ active, over }: DragOverEvent) {
    const activeId = String(active.id);
    if (!over || activeId === String(over.id) || active.data.current?.type === "column") return;
    setDragBoard((current) => {
      if (!current) return current;
      const target = dropTarget(current, over.id);
      if (!target || target.columnId === findColumnByCardId(current, activeId)?.id) return current;
      return moveCard(current, activeId, target.columnId, target.index);
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    let dropped = dragBoard;
    const from = active.data.current;
    if (dropped && over && from?.type === "column") {
      const to = over.data.current?.columnId;
      if (to) dropped = moveColumn(dropped, from.columnId, to);
    } else {
      const target = dropped && over ? dropTarget(dropped, over.id) : null;
      if (dropped && target) dropped = moveCard(dropped, String(active.id), target.columnId, target.index);
    }
    if (dropped && dropped !== board) onChange(() => dropped);
    setDragBoard(null);
    setActiveId(null);
  }

  function handleDragCancel() {
    // A cancelled drag leaves the board where it started.
    setDragBoard(null);
    setActiveId(null);
  }

  function remove(column: Column) {
    if (column.cards.length > 0) setConfirming(column);
    else onChange((current) => deleteColumn(current, column.id));
  }

  return (
    <DndContext
      id="launch-board"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-4">
        <SortableContext
          items={shown.map((column) => columnDroppableId(column.id))}
          strategy={horizontalListSortingStrategy}
        >
          {shown.map((column) => (
            <ColumnView
              key={column.id}
              column={column}
              onRename={(title) => onChange((current) => renameColumn(current, column.id, title))}
              onDelete={shown.length > 1 ? () => remove(column) : undefined}
              onAddCard={(title, details) =>
                onChange((current) => addCard(current, column.id, title, details))
              }
              onEditCard={(cardId, title, details) =>
                onChange((current) => editCard(current, cardId, title, details))
              }
              onDeleteCard={(cardId) => onChange((current) => deleteCard(current, cardId))}
            />
          ))}
        </SortableContext>
        <button
          type="button"
          onClick={() => onChange(addColumn)}
          aria-label="Add column"
          title="Add column"
          className="flex w-11 min-w-11 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-xl leading-none text-muted transition hover:border-primary hover:bg-white/60 hover:text-primary"
        >
          +
        </button>
      </div>
      <DragOverlay>
        {activeCard ? <CardTile card={activeCard} dragging /> : null}
        {activeColumn ? (
          <div className="w-[300px] rotate-1 rounded-2xl border border-primary/50 bg-white px-4 py-3 shadow-xl ring-2 ring-primary/30">
            <h2 className="text-sm font-semibold text-navy">{activeColumn.title}</h2>
            <p className="mt-1 text-xs text-muted">
              {activeColumn.cards.length} {activeColumn.cards.length === 1 ? "card" : "cards"}
            </p>
          </div>
        ) : null}
      </DragOverlay>
      {confirming ? (
        <ConfirmDialog
          title={`Delete “${confirming.title}”?`}
          message={`The column and its ${confirming.cards.length} ${
            confirming.cards.length === 1 ? "card" : "cards"
          } will be removed. This cannot be undone.`}
          confirmLabel="Delete column"
          onConfirm={() => {
            onChange((current) => deleteColumn(current, confirming.id));
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </DndContext>
  );
}
