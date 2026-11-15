# Agent Guidelines & Repository Architecture

Welcome to the **Games Portal** repository. This document and the rules in [`.agents/rules/`](.agents/rules/) guide AI assistants and developers contributing to this codebase.

## Directory Structure

- `index.html`: Portal home page linking to all available games.
- `emily.html`: Emily's Reversi canvas game.
- `spider/`: Self-contained Spider Solitaire game.
  - `index.html`: HTML layout for Spider Solitaire.
  - `style.css`: All styling, animations, and card layouts.
  - `spider.js`: Vanilla JavaScript game logic.
- `.agents/rules/`: Rules and constraints for AI agents.

## Core Rules Summary

1. **[Code Style](.agents/rules/codestyle.md)**:
   - Always use explicit curly braces `{ ... }` on all `if`, `else`, `for`, and `while` statements.
   - Zero external scripts, libraries, fonts, or CDNs. Pure vanilla JavaScript, CSS, and HTML only.
2. **[Architecture & State](.agents/rules/architecture.md)**:
   - Each game lives in its own dedicated subfolder with separate `.html`, `.css`, and `.js` files.
   - Synchronize game settings to both `localStorage` and URL parameters (URL parameter takes precedence; fallback to `localStorage` and sync to URL).
   - Support undo/redo where applicable.
3. **[Git & Commits](.agents/rules/git.md)**:
   - Unless requested otherwise, all commits made by the AI agent must start with `✨<ModelName>: ` (e.g. `✨Gemini: ...`).
