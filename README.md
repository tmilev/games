# Games Portal

A collection of lightweight, zero-dependency browser games created with pure HTML5, CSS3, and Vanilla JavaScript.

🌐 **Live Demo:** [https://milevi.org:8778/games/](https://milevi.org:8778/games/)

---

## 🎮 Included Games

### 1. [Spider Solitaire](spider/)
A full-featured Spider Solitaire card game.
- **Suits & Difficulty**: 1 Suit (Easy), 2 Suits (Medium), and 4 Suits (Hard).
- **Controls & Interaction**:
  - Drag-and-drop multi-card cascade stacks with preview.
  - Double-click to auto-move sequences to the best valid column.
  - Full **Undo** (`Ctrl + Z`) and **Redo** (`Ctrl + Shift + Z` / `Ctrl + Y`).
  - **Zoom In / Zoom Out** buttons to adjust scale from 60% to 180%.
- **State Persistence**:
  - Automatically saves board state and resumes on page reload.
  - Difficulty and zoom levels are synced across both `localStorage` and URL parameters (e.g. `?difficulty=1&zoom=100`).
- **Cards**: Rendered with HTML/CSS DOM elements displaying rank and suit in all four corners.

### 2. [Emily's Reversi](reversiemily/)
A classic Reversi / Othello board game crafted by Todor and his daughter Emily.
- Playable player vs. computer.
- Multiple color schemes (Emily's scheme and Evelyn's scheme).
- Built on HTML5 Canvas.

---

## 🛠️ Architecture & Philosophy

- **Zero External Dependencies**: No npm, no external JS frameworks, no CDNs, no remote fonts. Fast loading and works offline.
- **Self-Contained**: Each game lives in its own dedicated subfolder with separated markup, styling, and logic.
- **Hosted**: Served directly by Todor's custom-built RFC-compliant C++ web server from the parent CAS project.

---

## 📜 Development Guidelines

For AI assistants or contributors modifying this repository, please review [AGENTS.md](AGENTS.md) and the rules in [`.agents/rules/`](.agents/rules/):
- **Brace Style**: Mandatory curly braces `{ ... }` on all control flow statements.
- **State Sync**: URL parameters take precedence over `localStorage`, syncing automatically via `history.replaceState`.
