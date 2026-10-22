# Kanban MVP Plan

One board, five fixed (renamable) columns, cards with title + details, drag and drop,
add/delete card, dummy data on load. Client-rendered Next.js app in `frontend/`.
No persistence, no user management. Slick, simple UI using the project color scheme.

## Phase 1 - Project scaffolding

- [x] Next.js app (App Router, TypeScript, Tailwind, `src/` dir) created in `frontend/`
- [x] `.gitignore` covers Next.js, Node and test artifacts
- [x] Dev server serves the app on port 3000
- [x] `npm run build` passes with no type errors

## Phase 2 - Board implementation

- [x] Board/column/card types and pure state logic in `src/lib/board.ts`
- [x] Dummy data: exactly 5 columns populated with realistic cards
- [x] Board, column and card UI following the color scheme (navy headings, blue key
      sections, purple actions, yellow accents, gray supporting text)
- [x] Column names renameable via inline edit (Enter saves, Escape cancels)
- [x] Add card form per column (title + details), purple submit
- [x] Delete card button on each card
- [x] Drag and drop: move cards between columns and reorder within a column
      (dnd-kit), with drag overlay and drop-target highlight
- [x] Keyboard drag-and-drop: focus a card, Space to lift, arrows to move,
      Space to drop (KeyboardSensor + sortableKeyboardCoordinates)

## Phase 3 - Rigorous unit testing (Vest + React Testing Library style: Vitest)

- [x] Unit tests for all pure board logic: add card, delete card, rename column,
      move card (cross-column, reorder up/down, empty target, invalid/no-op cases)
- [x] Component tests: renders 5 columns + dummy cards; rename column; add card;
      delete card; cancel add form
- [x] All unit tests pass (`npm test` in `frontend/`)

## Phase 4 - Integration testing (Playwright)

- [x] Playwright configured with a managed web server against `frontend/`
- [x] Spec: board renders with 5 named columns and dummy data
- [x] Spec: rename a column
- [x] Spec: add a card (title + details) to a column
- [x] Spec: delete a card
- [x] Spec: drag a card into a different column
- [x] Spec: reorder a card within a column
- [x] All specs pass; defects found are fixed
- [x] Regression check: no hydration-mismatch console errors on load (dnd-kit
      `aria-describedby` ids made deterministic via a stable `DndContext` id)

## Phase 5 - Finish

- [x] Production build passes
- [x] README kept minimal
- [x] Dev server left running for review

## Phase 6 - Server-side persistence (added on request)

- [x] Board state persisted server-side to `data/board.json` via `GET/PUT /api/board`
- [x] Client loads the board from the API on mount (skeleton while loading)
- [x] Every change (move/rename/add/delete) is saved; nothing saved mid-drag;
      a cancelled drag restores the pre-drag board
- [x] `data/` gitignored; README documents how to reset to dummy data
- [x] Unit tests for the file store (seed, roundtrip, error propagation)
- [x] Component tests: loads from API, saves changes, error state
- [x] E2E: card positions, renames and added cards survive page reloads
- [x] Verified: board survives a real server restart