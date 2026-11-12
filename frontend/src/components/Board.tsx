"use client";

import { useState } from "react";
import {
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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import CardTile from "@/components/CardTile";
import ColumnView from "@/components/Column";
import {
  addCard,
  deleteCard,
  dropTarget,
  findColumnByCardId,
  moveCard,
  renameColumn,
  type Board as BoardData,
} from "@/lib/board";

const collisionDetection: CollisionDetection = (args) => {
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
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const shown = dragBoard ?? board;

  const activeCard = activeCardId
    ? (findColumnByCardId(shown, activeCardId)?.cards.find((card) => card.id === activeCardId) ??
      null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setDragBoard(board);
    setActiveCardId(String(event.active.id));
  }

  // Moves between columns happen while dragging; within a column the sortable
  // animation shows the new spot and the reorder is applied on drop. Reordering
  // in state mid-drag makes `over` flip-flop in long columns (infinite updates).
  function handleDragOver({ active, over }: DragOverEvent) {
    const activeId = String(active.id);
    if (!over || activeId === String(over.id)) return;
    setDragBoard((current) => {
      if (!current) return current;
      const target = dropTarget(current, over.id);
      if (!target || target.columnId === findColumnByCardId(current, activeId)?.id) return current;
      return moveCard(current, activeId, target.columnId, target.index);
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    let dropped = dragBoard;
    const target = dropped && over ? dropTarget(dropped, over.id) : null;
    if (dropped && target) dropped = moveCard(dropped, String(active.id), target.columnId, target.index);
    if (dropped && dropped !== board) onChange(() => dropped);
    setDragBoard(null);
    setActiveCardId(null);
  }

  function handleDragCancel() {
    // A cancelled drag leaves the board where it started.
    setDragBoard(null);
    setActiveCardId(null);
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
        {shown.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            onRename={(title) => onChange((current) => renameColumn(current, column.id, title))}
            onAddCard={(title, details) =>
              onChange((current) => addCard(current, column.id, title, details))
            }
            onDeleteCard={(cardId) => onChange((current) => deleteCard(current, cardId))}
          />
        ))}
      </div>
      <DragOverlay>{activeCard ? <CardTile card={activeCard} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}