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
## Phase 7 - Multiple boards as sheet tabs (added on request)

- [x] Workspace model: ordered list of boards (id, name, 5 columns); pure functions
      to add, rename, delete (never the last) and reorder boards
- [x] New board gets the 5 standard columns, empty, named "Board N"
- [x] Migration: the old single-board file becomes the first tab, "Launch Board"
- [x] Excel-style tab bar at the bottom: `+` adds and selects, double-click renames
      (Enter saves, Escape cancels), delete with confirmation, drag to reorder
- [x] Heading shows the active board's name; last active tab remembered per browser
- [x] `GET/PUT /api/workspace` replaces `/api/board`
- [x] Unit tests for workspace logic and migration; component tests for tabs
- [x] E2E: add/rename/delete/reorder tabs, boards keep separate cards, survives reload

## Phase 8 - Configurable data location

- [x] Data file comes from `KANBAN_DATA_FILE` (default `frontend/data/kanban.json`;
      the install script sets it to iCloud Drive)
- [x] Atomic writes (temp file + rename) so iCloud never syncs a half-written file
- [x] If the data file is missing, migrate `frontend/data/board.json` into it
- [x] Footer shows the data file in use
- [x] Store tests: custom path, atomic write, legacy migration; E2E uses its own temp file
      (port 3100, one worker); client sends saves one at a time so they land in order

## Phase 9 - Start at login

- [x] `scripts/install-autostart.sh [data-file]` builds the app and installs two
      LaunchAgents: the server (`next start -p 3210`, RunAtLoad + KeepAlive) and a
      login job that opens http://localhost:3210 in the browser once the server is up
- [x] `scripts/uninstall-autostart.sh` removes them; logs in `~/Library/Logs/kanban/`
- [x] Verified: server reachable on 3210 under launchd, reading/writing iCloud Drive,
      survives `launchctl kickstart -k`, existing board present as first tab
- [x] README updated (minimal)
