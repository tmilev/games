# Architecture & State Management Rules

## 1. Modular Subfolder Organization
- Every standalone game must live in its own subfolder (e.g. `spider/`, `minesweeper/`).
- Each game folder must separate concerns cleanly into three files:
  - `index.html`: Structure and markup only.
  - `style.css`: All styling, animations, and responsive layout.
  - `<gamename>.js`: Pure game logic and DOM bindings.
- The root `index.html` acts as the hub/portal linking to all games.

## 2. URL Parameters & LocalStorage Pattern
Whenever user preferences (difficulty, zoom, board size, sound, theme) or game states are stored:
1. **URL Parameter Precedence**:
   - On load, check `window.location.search`. If a valid URL parameter is present, it takes precedence and immediately overwrites `localStorage`.
2. **LocalStorage Fallback**:
   - If no URL parameter is provided, load the value from `localStorage`.
   - If found, synchronize the URL parameter via `window.history.replaceState(...)` without triggering a page reload.
   - If no `localStorage` value exists, use a sensible default, save it to `localStorage`, and sync to the URL.
3. **Interactive Changes**:
   - When the user changes a setting via the UI, update both `localStorage` and the URL parameter simultaneously.

## 3. Game State Persistence & Controls
- **Auto-Save**: Persist current active game state to `localStorage` on each move or deal, and restore it automatically on page refresh.
- **Undo / Redo**: Provide both on-screen buttons and standard keyboard shortcuts (`Ctrl+Z` / `Cmd+Z` for undo, `Ctrl+Shift+Z` or `Ctrl+Y` for redo).
