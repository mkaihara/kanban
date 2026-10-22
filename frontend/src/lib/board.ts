export interface Card {
  id: string;
  title: string;
  details: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export type Board = Column[];

const COLUMN_PREFIX = "column:";

export function columnDroppableId(columnId: string): string {
  return `${COLUMN_PREFIX}${columnId}`;
}

export function createId(): string {
  return crypto.randomUUID();
}

export interface DropTarget {
  columnId: string;
  index: number;
}

/**
 * Resolve a dnd-kit `over` id (a column droppable or a card) to the column
 * and index a dragged card should land at.
 */
export function dropTarget(board: Board, overId: string | number | undefined): DropTarget | null {
  if (overId == null) return null;
  const key = String(overId);
  if (key.startsWith(COLUMN_PREFIX)) {
    const column = board.find((candidate) => columnDroppableId(candidate.id) === key);
    return column ? { columnId: column.id, index: column.cards.length } : null;
  }
  const column = board.find((candidate) => candidate.cards.some((card) => card.id === key));
  if (!column) return null;
  return { columnId: column.id, index: column.cards.findIndex((card) => card.id === key) };
}

export function findColumnByCardId(board: Board, cardId: string): Column | undefined {
  return board.find((column) => column.cards.some((card) => card.id === cardId));
}

export function addCard(board: Board, columnId: string, title: string, details: string): Board {
  return board.map((column) =>
    column.id === columnId
      ? { ...column, cards: [...column.cards, { id: createId(), title, details }] }
      : column,
  );
}

export function deleteCard(board: Board, cardId: string): Board {
  return board.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => card.id !== cardId),
  }));
}

export function renameColumn(board: Board, columnId: string, title: string): Board {
  return board.map((column) => (column.id === columnId ? { ...column, title } : column));
}

export function moveCard(board: Board, cardId: string, toColumnId: string, toIndex: number): Board {
  const source = findColumnByCardId(board, cardId);
  if (!source) return board;
  if (!board.some((column) => column.id === toColumnId)) return board;
  const card = source.cards.find((candidate) => candidate.id === cardId);
  if (!card) return board;
  if (source.id === toColumnId && source.cards.indexOf(card) === toIndex) return board;

  const stripped = board.map((column) =>
    column.id === source.id
      ? { ...column, cards: column.cards.filter((candidate) => candidate.id !== cardId) }
      : column,
  );
  return stripped.map((column) => {
    if (column.id !== toColumnId) return column;
    const index = Math.max(0, Math.min(toIndex, column.cards.length));
    const cards = [...column.cards];
    cards.splice(index, 0, card);
    return { ...column, cards };
  });
}

export const initialBoard: Board = [
  {
    id: "1",
    title: "Backlog",
    cards: [
      {
        id: "1",
        title: "Audit accessibility across the app",
        details: "Run automated checks and log violations with severity.",
      },
      {
        id: "2",
        title: "Draft onboarding email sequence",
        details: "Three-email welcome flow for new signups.",
      },
      {
        id: "3",
        title: "Research competitor pricing",
        details: "Compare tiers, feature gates, and trial lengths.",
      },
      {
        id: "4",
        title: "Spike: offline read-only mode",
        details: "Estimate effort for caching board state locally.",
      },
    ],
  },
  {
    id: "2",
    title: "To Do",
    cards: [
      {
        id: "5",
        title: "Design empty states",
        details: "Illustrations plus helper copy for first-run screens.",
      },
      {
        id: "6",
        title: "Write API error documentation",
        details: "Document 4xx/5xx codes and retry guidance.",
      },
      {
        id: "7",
        title: "Set up staging analytics",
        details: "Enable event tracking behind a feature flag.",
      },
    ],
  },
  {
    id: "3",
    title: "In Progress",
    cards: [
      {
        id: "8",
        title: "Build drag-and-drop board",
        details: "Sortable columns with keyboard-accessible handles.",
      },
      {
        id: "9",
        title: "Inline column renaming",
        details: "Click a title to edit; Enter saves, Escape cancels.",
      },
      {
        id: "10",
        title: "Wire up activity feed",
        details: "Stream project events over websockets.",
      },
    ],
  },
  {
    id: "4",
    title: "In Review",
    cards: [
      {
        id: "11",
        title: "Login rate limiting",
        details: "Throttle by IP and account. See PR #284.",
      },
      {
        id: "12",
        title: "Refactor board state",
        details: "Move pure logic into lib and cover with unit tests.",
      },
    ],
  },
  {
    id: "5",
    title: "Done",
    cards: [
      {
        id: "13",
        title: "Set up CI pipeline",
        details: "Lint, typecheck, and unit tests on every pull request.",
      },
      {
        id: "14",
        title: "Accessibility pass on forms",
        details: "Labels, focus rings, and inline error messages.",
      },
      {
        id: "15",
        title: "Upgrade design tokens",
        details: "Palette, radii, and shadows now source from one file.",
      },
    ],
  },
];