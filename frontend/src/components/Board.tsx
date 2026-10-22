"use client";

import { useEffect, useRef, useState } from "react";
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

export default function Board() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const dragSnapshot = useRef<BoardData | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let active = true;
    fetch("/api/board")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<BoardData>;
      })
      .then((data) => {
        if (active) setBoard(data);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist the board whenever it changes. Skipped mid-drag (the drop lands here).
  useEffect(() => {
    if (!board || activeCardId) return;
    void fetch("/api/board", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(board),
    });
  }, [board, activeCardId]);

  const activeCard = activeCardId
    ? (findColumnByCardId(board ?? [], activeCardId)?.cards.find(
        (card) => card.id === activeCardId,
      ) ?? null)
    : null;

  function mutate(updater: (current: BoardData) => BoardData) {
    setBoard((current) => (current ? updater(current) : current));
  }

  function handleDragStart(event: DragStartEvent) {
    dragSnapshot.current = board;
    setActiveCardId(String(event.active.id));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    const activeId = String(active.id);
    if (!over || activeId === String(over.id)) return;
    mutate((current) => {
      const target = dropTarget(current, over.id);
      return target ? moveCard(current, activeId, target.columnId, target.index) : current;
    });
  }

  function handleDragEnd() {
    setActiveCardId(null);
  }

  function handleDragCancel() {
    // A cancelled drag puts the card back where it started.
    setBoard((current) => dragSnapshot.current ?? current);
    setActiveCardId(null);
  }

  if (loadFailed) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        Could not load the board. Please check the server and reload.
      </p>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-4" aria-busy>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="w-[300px] min-w-[300px] animate-pulse rounded-2xl border border-slate-200/70 bg-white/60 p-3"
          >
            <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
            <div className="mb-2 h-16 rounded-xl bg-slate-200/70" />
            <div className="mb-2 h-16 rounded-xl bg-slate-200/70" />
          </div>
        ))}
      </div>
    );
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
        {board.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            onRename={(title) => mutate((current) => renameColumn(current, column.id, title))}
            onAddCard={(title, details) =>
              mutate((current) => addCard(current, column.id, title, details))
            }
            onDeleteCard={(cardId) => mutate((current) => deleteCard(current, cardId))}
          />
        ))}
      </div>
      <DragOverlay>{activeCard ? <CardTile card={activeCard} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}