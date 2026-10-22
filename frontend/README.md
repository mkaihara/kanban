# Launch Board

A single-board kanban MVP built with Next.js (App Router), Tailwind CSS and dnd-kit.
One board with five fixed, renameable columns; cards have a title and details and can be
dragged between and within columns (mouse or keyboard), added, and deleted.

## Persistence

The board is saved server-side to `data/board.json` (gitignored) via `GET/PUT /api/board`.
Delete that file (or `PUT` the dummy data) to reset the board.

## Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
npm test          # unit and component tests (Vitest)
npm run test:e2e  # end-to-end tests (Playwright; reuses the dev server on :3000)
```