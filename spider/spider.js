/**
 * Built by Gemini+Antigravity with prompting by Todor.
 *
 * Prompts history:
 * 1. ... make me a spider solitaire game.
 * 2. Put the game in a single subfolder. Make it three files: html, css and .js
 * 3. Please use curly braces for all teh if clauses.
 * 4. Don't forget to update the index.html links
 * 5. Did you use any external scripts? Please no external dependencies
 * 6. Make sure that the game remembers my difficulty settings. 
 *    Connect these settings to an URL parameter and to localstorage. 
 *    URL parameter takes precendence and overwrites localstorage. 
 *    If no url parameter specified, load from localstorage and set url parameter
 * 7. You are the awesome-est
 */

const SUITS = {
  spades: { symbol: '♠', color: 'black' },
  hearts: { symbol: '♥', color: 'red' },
  clubs: { symbol: '♣', color: 'black' },
  diamonds: { symbol: '♦', color: 'red' }
};

const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let difficulty = 1; // 1, 2, or 4 suits
let tableau = [[], [], [], [], [], [], [], [], [], []];
let stock = []; // 5 batches of 10 cards
let completedRuns = 0;
let moves = 0;
let score = 500;
let moveHistory = [];

// Drag-and-drop state
let draggedData = null; // { fromCol, startIdx, count }

const tableauContainer = document.getElementById('tableauContainer');
const stockContainer = document.getElementById('stockContainer');
const completedContainer = document.getElementById('completedContainer');
const movesCountEl = document.getElementById('movesCount');
const scoreValEl = document.getElementById('scoreVal');
const difficultySelect = document.getElementById('difficultySelect');
const banner = document.getElementById('banner');
const winOverlay = document.getElementById('winOverlay');
const winStats = document.getElementById('winStats');

function showBanner(text) {
  banner.textContent = text;
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 2500);
}

function createDeck() {
  let suitsUsed = [];
  if (difficulty === 1) {
    suitsUsed = Array(8).fill('spades');
  } else if (difficulty === 2) {
    suitsUsed = [...Array(4).fill('spades'), ...Array(4).fill('hearts')];
  } else {
    suitsUsed = [
      'spades', 'spades',
      'hearts', 'hearts',
      'clubs', 'clubs',
      'diamonds', 'diamonds'
    ];
  }

  let deck = [];
  for (const suit of suitsUsed) {
    for (let val = 1; val <= 13; val++) {
      deck.push({ suit, value: val, faceUp: false });
    }
  }

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function saveState() {
  const state = {
    tableau: tableau.map(col => col.map(c => ({ ...c }))),
    stock: stock.map(batch => batch.map(c => ({ ...c }))),
    completedRuns,
    moves,
    score
  };
  moveHistory.push(state);
  if (moveHistory.length > 30) moveHistory.shift();
}

function undo() {
  if (moveHistory.length === 0) return;
  const prev = moveHistory.pop();
  tableau = prev.tableau;
  stock = prev.stock;
  completedRuns = prev.completedRuns;
  moves = prev.moves;
  score = prev.score;
  updateUI();
}

const STORAGE_KEY = 'spider_solitaire_difficulty';

function syncDifficultyURL(val) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('difficulty') !== String(val)) {
      url.searchParams.set('difficulty', String(val));
      window.history.replaceState({}, '', url.toString());
    }
  } catch (e) {
    // Graceful fallback if running in environments without full history API support
  }
}

function initDifficultySettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramDiff = urlParams.get('difficulty');
  let selected = null;

  if (paramDiff && ['1', '2', '4'].includes(paramDiff)) {
    selected = parseInt(paramDiff, 10);
    try {
      localStorage.setItem(STORAGE_KEY, String(selected));
    } catch (e) { }
  } else {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) { }

    if (stored && ['1', '2', '4'].includes(stored)) {
      selected = parseInt(stored, 10);
    } else {
      selected = 1;
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch (e) { }
    }
    syncDifficultyURL(selected);
  }

  difficulty = selected;
  difficultySelect.value = String(selected);
}

function onDifficultyChanged() {
  const selected = parseInt(difficultySelect.value, 10);
  try {
    localStorage.setItem(STORAGE_KEY, String(selected));
  } catch (e) { }
  syncDifficultyURL(selected);
  startNewGame();
}

function startNewGame() {
  difficulty = parseInt(difficultySelect.value, 10);
  const deck = createDeck();

  tableau = [[], [], [], [], [], [], [], [], [], []];
  stock = [];
  completedRuns = 0;
  moves = 0;
  score = 500;
  moveHistory = [];
  winOverlay.classList.add('hidden');

  let cardIdx = 0;
  for (let c = 0; c < 10; c++) {
    const totalInCol = c < 4 ? 6 : 5;
    for (let r = 0; r < totalInCol; r++) {
      const card = deck[cardIdx++];
      if (r === totalInCol - 1) {
        card.faceUp = true;
      }
      tableau[c].push(card);
    }
  }

  while (cardIdx < deck.length) {
    const dealBatch = [];
    for (let i = 0; i < 10; i++) {
      const card = deck[cardIdx++];
      card.faceUp = true;
      dealBatch.push(card);
    }
    stock.push(dealBatch);
  }

  updateUI();
}

function canPickSequence(colIdx, startCardIdx) {
  const col = tableau[colIdx];
  if (startCardIdx < 0 || startCardIdx >= col.length) return false;
  if (!col[startCardIdx].faceUp) return false;

  for (let i = startCardIdx; i < col.length - 1; i++) {
    const curr = col[i];
    const next = col[i + 1];
    if (!next.faceUp) return false;
    if (curr.suit !== next.suit) return false;
    if (curr.value !== next.value + 1) return false;
  }
  return true;
}

function canDropOnCol(movingTopCard, targetColIdx) {
  const targetCol = tableau[targetColIdx];
  if (targetCol.length === 0) return true;
  const targetTop = targetCol[targetCol.length - 1];
  return targetTop.value === movingTopCard.value + 1;
}

function checkAndClearCompletedRuns() {
  let anyCleared = false;
  for (let c = 0; c < 10; c++) {
    const col = tableau[c];
    if (col.length < 13) continue;

    for (let start = col.length - 13; start >= 0; start--) {
      if (!col[start].faceUp || col[start].value !== 13) continue;

      let isComplete = true;
      const suit = col[start].suit;
      for (let step = 0; step < 13; step++) {
        const card = col[start + step];
        if (!card.faceUp || card.suit !== suit || card.value !== 13 - step) {
          isComplete = false;
          break;
        }
      }

      if (isComplete) {
        col.splice(start, 13);
        completedRuns++;
        score += 100;
        anyCleared = true;

        if (col.length > 0 && !col[col.length - 1].faceUp) {
          col[col.length - 1].faceUp = true;
        }
        break;
      }
    }
  }

  if (anyCleared) {
    if (completedRuns === 8) {
      winStats.textContent = `Completed in ${moves} moves with a score of ${score}!`;
      winOverlay.classList.remove('hidden');
    }
  }
}

function dealStock() {
  if (stock.length === 0) return;

  const hasEmptyCol = tableau.some(col => col.length === 0);
  if (hasEmptyCol) {
    showBanner("Cannot deal while any column is empty!");
    return;
  }

  saveState();
  const batch = stock.pop();
  for (let i = 0; i < 10; i++) {
    tableau[i].push(batch[i]);
  }
  moves++;
  checkAndClearCompletedRuns();
  updateUI();
}

function renderStock() {
  stockContainer.innerHTML = '';
  if (stock.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'stock-empty';
    emptyDiv.textContent = 'Empty';
    stockContainer.appendChild(emptyDiv);
    return;
  }

  const slot = document.createElement('div');
  slot.className = 'stock-slot';
  slot.title = `Deal cards (${stock.length} deals left)`;
  slot.onclick = dealStock;

  stock.forEach((_, idx) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'stock-card';
    cardEl.style.top = `${-idx * 3}px`;
    cardEl.style.left = `${idx * 4}px`;
    slot.appendChild(cardEl);
  });

  stockContainer.appendChild(slot);
}

function renderCompleted() {
  completedContainer.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const slot = document.createElement('div');
    slot.className = 'foundation-slot';
    if (i < completedRuns) {
      slot.innerHTML = `<span style="font-size: 1.5rem; color: #facc15;">♠</span><span style="font-size: 0.8rem; font-weight:bold; position:absolute; bottom: 2px;">K-A</span>`;
    }
    completedContainer.appendChild(slot);
  }
}

function renderTableau() {
  tableauContainer.innerHTML = '';

  tableau.forEach((colCards, colIdx) => {
    const colDiv = document.createElement('div');
    colDiv.className = 'column';
    colDiv.dataset.col = colIdx;

    colDiv.ondragover = (e) => {
      e.preventDefault();
      colDiv.classList.add('drag-over');
    };
    colDiv.ondragleave = () => {
      colDiv.classList.remove('drag-over');
    };
    colDiv.ondrop = (e) => {
      e.preventDefault();
      colDiv.classList.remove('drag-over');
      handleDrop(colIdx);
    };

    let currentTopOffset = 0;
    colCards.forEach((card, cardIndex) => {
      const cardEl = createCardElement(card, colIdx, cardIndex);
      cardEl.style.top = `${currentTopOffset}px`;
      colDiv.appendChild(cardEl);

      currentTopOffset += card.faceUp ? 26 : 14;
    });

    colDiv.style.minHeight = `${Math.max(125, currentTopOffset + 115)}px`;
    tableauContainer.appendChild(colDiv);
  });
}

function createCardElement(card, colIdx, cardIndex) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';

  if (!card.faceUp) {
    cardEl.classList.add('face-down');
    return cardEl;
  }

  cardEl.classList.add('face-up');
  const suitInfo = SUITS[card.suit];
  cardEl.classList.add(suitInfo.color);

  cardEl.innerHTML = `
    <div class="card-row top-row">
      <div class="card-corner corner-tl">
        <span class="card-rank">${RANKS[card.value]}</span>
        <span class="card-suit">${suitInfo.symbol}</span>
      </div>
      <div class="card-corner corner-tr">
        <span class="card-rank">${RANKS[card.value]}</span>
        <span class="card-suit">${suitInfo.symbol}</span>
      </div>
    </div>
    <div class="card-center">${suitInfo.symbol}</div>
    <div class="card-row bottom-row">
      <div class="card-corner corner-bl">
        <span class="card-rank">${RANKS[card.value]}</span>
        <span class="card-suit">${suitInfo.symbol}</span>
      </div>
      <div class="card-corner corner-br">
        <span class="card-rank">${RANKS[card.value]}</span>
        <span class="card-suit">${suitInfo.symbol}</span>
      </div>
    </div>
  `;

  if (canPickSequence(colIdx, cardIndex)) {
    cardEl.draggable = true;

    cardEl.ondragstart = (e) => {
      draggedData = {
        fromCol: colIdx,
        startIdx: cardIndex,
        count: tableau[colIdx].length - cardIndex
      };
      e.dataTransfer.setData('text/plain', '');
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => cardEl.classList.add('is-dragging'), 0);
    };

    cardEl.ondragend = () => {
      cardEl.classList.remove('is-dragging');
      draggedData = null;
    };

    cardEl.ondblclick = () => {
      tryAutoMove(colIdx, cardIndex);
    };
  } else {
    cardEl.draggable = false;
  }

  return cardEl;
}

function handleDrop(targetColIdx) {
  if (!draggedData) return;
  const { fromCol, startIdx } = draggedData;
  if (fromCol === targetColIdx) return;

  const movingCards = tableau[fromCol].slice(startIdx);
  const topMovingCard = movingCards[0];

  if (canDropOnCol(topMovingCard, targetColIdx)) {
    saveState();
    tableau[fromCol].splice(startIdx);
    tableau[targetColIdx].push(...movingCards);

    const sourceCol = tableau[fromCol];
    if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
      sourceCol[sourceCol.length - 1].faceUp = true;
    }

    moves++;
    score = Math.max(0, score - 1);
    checkAndClearCompletedRuns();
    updateUI();
  }
}

function tryAutoMove(colIdx, cardIndex) {
  if (!canPickSequence(colIdx, cardIndex)) return;
  const movingCards = tableau[colIdx].slice(cardIndex);
  const topMoving = movingCards[0];

  let bestTarget = -1;
  let alternateTarget = -1;

  for (let c = 0; c < 10; c++) {
    if (c === colIdx) continue;
    if (canDropOnCol(topMoving, c)) {
      const targetCol = tableau[c];
      if (targetCol.length > 0 && targetCol[targetCol.length - 1].suit === topMoving.suit) {
        bestTarget = c;
        break;
      }
      if (alternateTarget === -1) {
        alternateTarget = c;
      }
    }
  }

  const target = bestTarget !== -1 ? bestTarget : alternateTarget;
  if (target !== -1) {
    saveState();
    tableau[colIdx].splice(cardIndex);
    tableau[target].push(...movingCards);

    const sourceCol = tableau[colIdx];
    if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
      sourceCol[sourceCol.length - 1].faceUp = true;
    }

    moves++;
    score = Math.max(0, score - 1);
    checkAndClearCompletedRuns();
    updateUI();
  }
}

function updateUI() {
  movesCountEl.textContent = moves;
  scoreValEl.textContent = score;
  renderStock();
  renderCompleted();
  renderTableau();
}

document.getElementById('newGameBtn').onclick = startNewGame;
document.getElementById('winNewGameBtn').onclick = startNewGame;
document.getElementById('undoBtn').onclick = undo;
difficultySelect.onchange = onDifficultyChanged;

initDifficultySettings();
startNewGame();
