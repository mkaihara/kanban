# Kanban

A kanban app built with Next.js (App Router), Tailwind CSS and dnd-kit. Boards live in
Excel-style tabs at the bottom: `+` adds one, double-click renames, drag reorders, the x
deletes. A new board starts with five columns; double-click a column title to rename it,
drag its header to move it, `+` at the end adds one and the x deletes it (asking first if it
has cards). Cards have a title and details; double-click one to edit it. Cards can be
dragged between and within columns (mouse or keyboard), added, and deleted.

## Data

All boards are saved to one JSON file via `GET/PUT /api/workspace`. The file is
`$KANBAN_DATA_FILE`, or `data/kanban.json` if unset. On first run at a new location, an
old `data/board.json` is imported as the first tab.

## Start at login

```bash
../scripts/install-autostart.sh [data-file]   # default: iCloud Drive/Kanban/kanban.json
../scripts/uninstall-autostart.sh
```

The installer builds the app, runs it at http://localhost:3210 at every login and opens it
in the browser. Rerun it after pulling changes. Logs: `~/Library/Logs/kanban/`. To move the
data, copy the file to the new place and rerun the installer with that path.

## Develop and test

```bash
npm install
npm run dev       # http://localhost:3000 (this machine only), data in data/kanban.json
npm test          # unit and component tests (Vitest)
npm run test:e2e  # end-to-end tests (Playwright; own server on :3100 and a temp data file)
```
