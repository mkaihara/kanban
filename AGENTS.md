# Kanban Project

## Business Requirements

- An MVP of a Kanban style Project Management application as a web app  
- Multiple boards, shown as Excel-style tabs at the bottom (add, rename, delete, drag to reorder)
- The board has fixed 5 columns that can be renamed  
- Each card has a title and details only
- Drag and drop interface to move cards between columns
- Add a new card to a column; delete an existing card
- No more functionality: no archive, no search/filter. Keep it simple.
- The priority is a slick, professional, gorgeous UI/UX with very simple features
- The app should open with dummy data populated on first run

## Technical Details

- Implemented as a modern NextJS app, client rendered  
- The NextJS app should be created in a subdirectory `frontend`
- Persistence: one server-side JSON file at `$KANBAN_DATA_FILE` (default `frontend/data/kanban.json`; the installer sets iCloud Drive) via `GET/PUT /api/workspace`
- Starts at login via LaunchAgents (`scripts/install-autostart.sh`), served on http://localhost:3210
- No user management for the MVP
- Use popular libraries
- As simple as possible but with an elegant UI

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Strategy

1. Write plan with success criteria for each phase to be checked off. Include project scaffolding, including .gitignore, and rigorous unit testing.
2. Execute the plan ensuring all critiera are met
3. Carry out extensive integration testing with Playwright or similar, fixing defects
4. Only complete when the MVP is finished and tested, with the server running and ready for the user

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
