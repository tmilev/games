# Code Style Rules

## 1. Braces & Control Flow
- **ALWAYS** use explicit curly braces `{ ... }` for all control flow blocks (`if`, `else`, `for`, `while`, `do-while`), even for single-line statements or early returns.
- **NEVER** write brace-less `if (condition) return;` or `if (condition) doSomething();`.

### Good:
```javascript
if (x > 0) {
  return true;
}

if (!element) {
  doCleanup();
}
```

### Forbidden:
```javascript
if (x > 0) return true;

if (!element)
  doCleanup();
```

## 2. Dependencies & External Scripts
- **Strictly zero external dependencies**:
  - No remote scripts (`<script src="https://...">`).
  - No remote stylesheets or web fonts (Google Fonts, FontAwesome, Bootstrap, Tailwind, etc.).
  - No npm modules or build tools unless explicitly requested by the user.
- Use only native browser APIs (Vanilla JavaScript, DOM, HTML5 drag-and-drop, Canvas, `localStorage`, `history.replaceState`).
- Use Unicode characters or SVG for symbols (`♠`, `♥`, `♣`, `♦`, `+`, `−`, etc.).

## 3. Formatting
- 2-space indentation.
- Semicolons are required.
- Clear, readable variable and function names.
