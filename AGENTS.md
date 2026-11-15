# Agent Guidelines & Repository Architecture

Welcome to the **Games Portal** repository. This document and the rules in [`.agents/rules/`](.agents/rules/) guide AI assistants and developers contributing to this codebase.

## Repository Overview

This repository hosts lightweight, zero-dependency browser games served by a custom C++ web server (and available live at [milevi.org](https://milevi.org:8778/games/index.html)).

## Directory Structure

- `index.html`: Main game portal hub linking to all playable games.
- `reversiemily/`: Emily's Reversi (a two-player / vs computer Reversi game).
  - `emily.html`: Canvas game board and scoring UI.
  - `reversiemily.js`: Game logic and AI moves.
- `spider/`: Self-contained Spider Solitaire game.
  - `index.html`: Game UI and controls.
  - `style.css`: Styling, card visuals, 4-corner symbols, and animations.
  - `spider.js`: Game engine (drag-and-drop, validation, undo/redo, auto-save).
- `.agents/`:
  - `rules/codestyle.md`: Syntax rules (mandatory curly braces `{ ... }`, zero external dependencies).
  - `rules/architecture.md`: State rules (URL params + `localStorage` dual-sync, subfolder layout).
  - `rules/git.md`: Agent commit message formatting conventions.
  - `rules/personal/`: Local, gitignored developer notes and preferences.

## Core Rules Summary

1. **[Code Style](.agents/rules/codestyle.md)**:
   - **Always** use explicit curly braces `{ ... }` on all `if`, `else`, `for`, and `while` statements.
   - **Zero external dependencies**: No CDNs, no external scripts or remote fonts. Pure native web technologies (HTML, CSS, Vanilla JS) only.
   - **Strictly no `innerHTML`**: Build DOM structures explicitly with `document.createElement(...)`, `textContent`, and `appendChild(...)` (Closure Compiler / Trusted Types compliance).
2. **[Architecture & State](.agents/rules/architecture.md)**:
   - Each game lives in its own dedicated subfolder with cleanly separated files.
   - Synchronize game settings to both `localStorage` and URL parameters (URL parameter takes precedence; fallback to `localStorage` and sync to URL).
3. **[Git & Commits](.agents/rules/git.md)**:
   - Unless explicitly requested otherwise, commits made by the AI agent should start with the sparkles emoji, and a model name, as in: `✨<ModelFamily> <Flavor>: ` (for example `✨Gemini Flash: ...` or `✨Gemini Pro: ...`).
