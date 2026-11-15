/**
 * Built by Gemini+Antigravity.
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

const THEMES = {
  'classic-green': 'radial-gradient(circle at 50% 20%, #1a6337, #0d381e)',
  'dark-slate': 'radial-gradient(circle at 50% 20%, #1e293b, #0f172a)',
  'royal-blue': 'radial-gradient(circle at 50% 20%, #1e3a8a, #0f172a)',
  'burgundy': 'radial-gradient(circle at 50% 20%, #7f1d1d, #450a0a)',
  'emerald': 'radial-gradient(circle at 50% 20%, #064e3b, #022c22)'
};

const DECKS = {
  'classic-blue': { gradient: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', border: '#93c5fd' },
  'crimson-red': { gradient: 'linear-gradient(135deg, #991b1b, #dc2626)', border: '#fca5a5' },
  'emerald-green': { gradient: 'linear-gradient(135deg, #065f46, #059669)', border: '#6ee7b7' },
  'amethyst-purple': { gradient: 'linear-gradient(135deg, #581c87, #7c3aed)', border: '#c4b5fd' },
  'carbon-black': { gradient: 'linear-gradient(135deg, #18181b, #27272a)', border: '#71717a' }
};

const ANIM_SPEEDS = {
  'fast': { stagger: 20, duration: '0.28s', cleanup: 300 },
  'normal': { stagger: 50, duration: '0.42s', cleanup: 500 },
  'slow': { stagger: 100, duration: '0.8s', cleanup: 900 },
  'super-slow': { stagger: 200, duration: '2.0s', cleanup: 2200 },
  'instant': { stagger: 0, duration: '0s', cleanup: 0 }
};

const STORAGE_KEY = 'spider_solitaire_difficulty';
const GAME_STATE_KEY = 'spider_solitaire_current_game';
const ZOOM_STORAGE_KEY = 'spider_solitaire_zoom';
const PREFS_STORAGE_KEY = 'spider_solitaire_preferences';

/**
 * Class representing an individual playing card.
 */
class Card {
  constructor(suit, value, faceUp = false) {
    this.suit = suit;
    this.value = value;
    this.faceUp = faceUp;
  }

  toJSON() {
    return {
      suit: this.suit,
      value: this.value,
      faceUp: this.faceUp
    };
  }

  static fromJSON(data) {
    return new Card(data.suit, data.value, data.faceUp);
  }

  createCornerElement(cornerClass) {
    const corner = document.createElement('div');
    corner.className = `card-corner ${cornerClass}`;

    const rankSpan = document.createElement('span');
    rankSpan.className = 'card-rank';
    rankSpan.textContent = RANKS[this.value];

    const suitSpan = document.createElement('span');
    suitSpan.className = 'card-suit';
    suitSpan.textContent = SUITS[this.suit].symbol;

    corner.appendChild(rankSpan);
    corner.appendChild(suitSpan);
    return corner;
  }

  createDOMElement(colIdx, cardIdx, gameInstance) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    if (!this.faceUp) {
      cardEl.classList.add('face-down');
      return cardEl;
    }

    cardEl.classList.add('face-up');
    const suitInfo = SUITS[this.suit];
    cardEl.classList.add(suitInfo.color);

    // Top row
    const topRow = document.createElement('div');
    topRow.className = 'card-row top-row';
    topRow.appendChild(this.createCornerElement('corner-tl'));
    topRow.appendChild(this.createCornerElement('corner-tr'));
    cardEl.appendChild(topRow);

    // Center emblem
    const center = document.createElement('div');
    center.className = 'card-center';
    center.textContent = suitInfo.symbol;
    cardEl.appendChild(center);

    // Bottom row
    const bottomRow = document.createElement('div');
    bottomRow.className = 'card-row bottom-row';
    bottomRow.appendChild(this.createCornerElement('corner-bl'));
    bottomRow.appendChild(this.createCornerElement('corner-br'));
    cardEl.appendChild(bottomRow);

    // Drag-and-drop & interaction
    if (gameInstance.canPickSequence(colIdx, cardIdx)) {
      cardEl.draggable = true;

      cardEl.ondragstart = (e) => {
        gameInstance.onCardDragStart(e, colIdx, cardIdx, cardEl);
      };

      cardEl.ondragend = () => {
        gameInstance.onCardDragEnd(colIdx);
      };

      cardEl.ondblclick = () => {
        gameInstance.tryAutoMove(colIdx, cardIdx);
      };
    } else {
      cardEl.draggable = false;
    }

    return cardEl;
  }
}

/**
 * Main Spider Solitaire controller class.
 */
class SpiderSolitaire {
  constructor() {
    this.difficulty = 1;
    this.tableau = [[], [], [], [], [], [], [], [], [], []];
    this.stock = [];
    this.completedRuns = 0;
    this.moves = 0;
    this.score = 500;
    this.moveHistory = [];
    this.redoHistory = [];

    this.currentZoom = 100;
    this.userPrefs = {
      bgTheme: 'classic-green',
      deckColor: 'classic-blue',
      animSpeed: 'normal'
    };

    this.draggedData = null;
    this.isDealing = false;
    this.dealAnimationTimeouts = [];

    // DOM element bindings
    this.tableauContainer = document.getElementById('tableauContainer');
    this.tableContainerEl = document.querySelector('.table-container');
    this.stockContainer = document.getElementById('stockContainer');
    this.completedContainer = document.getElementById('completedContainer');
    this.movesCountEl = document.getElementById('movesCount');
    this.scoreValEl = document.getElementById('scoreVal');
    this.zoomValEl = document.getElementById('zoomVal');
    this.zoomInBtn = document.getElementById('zoomInBtn');
    this.zoomOutBtn = document.getElementById('zoomOutBtn');
    this.difficultySelect = document.getElementById('difficultySelect');
    this.banner = document.getElementById('banner');
    this.winOverlay = document.getElementById('winOverlay');
    this.winStats = document.getElementById('winStats');

    this.settingsOverlay = document.getElementById('settingsOverlay');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.bgThemeSelect = document.getElementById('bgThemeSelect');
    this.deckColorSelect = document.getElementById('deckColorSelect');
    this.animSpeedSelect = document.getElementById('animSpeedSelect');

    this.bindEvents();
  }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.classList.add('show');
    setTimeout(() => {
      this.banner.classList.remove('show');
    }, 2500);
  }

  cancelDealAnimation() {
    if (this.dealAnimationTimeouts.length > 0) {
      this.dealAnimationTimeouts.forEach((t) => {
        clearTimeout(t);
      });
      this.dealAnimationTimeouts = [];
    }
    this.isDealing = false;
  }

  createDeck() {
    let suitsUsed = [];
    if (this.difficulty === 1) {
      suitsUsed = Array(8).fill('spades');
    } else if (this.difficulty === 2) {
      suitsUsed = [...Array(4).fill('spades'), ...Array(4).fill('hearts')];
    } else {
      suitsUsed = [
        'spades', 'spades',
        'hearts', 'hearts',
        'clubs', 'clubs',
        'diamonds', 'diamonds'
      ];
    }

    const deck = [];
    for (const suit of suitsUsed) {
      for (let val = 1; val <= 13; val++) {
        deck.push(new Card(suit, val, false));
      }
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  saveState() {
    const state = {
      tableau: this.tableau.map(col => col.map(c => c.toJSON())),
      stock: this.stock.map(batch => batch.map(c => c.toJSON())),
      completedRuns: this.completedRuns,
      moves: this.moves,
      score: this.score
    };
    this.moveHistory.push(state);
    this.redoHistory = [];
    if (this.moveHistory.length > 50) {
      this.moveHistory.shift();
    }
  }

  undo() {
    this.cancelDealAnimation();
    if (this.moveHistory.length === 0) {
      return;
    }
    const currentState = {
      tableau: this.tableau.map(col => col.map(c => c.toJSON())),
      stock: this.stock.map(batch => batch.map(c => c.toJSON())),
      completedRuns: this.completedRuns,
      moves: this.moves,
      score: this.score
    };
    this.redoHistory.push(currentState);
    const prev = this.moveHistory.pop();
    this.tableau = prev.tableau.map(col => col.map(c => Card.fromJSON(c)));
    this.stock = prev.stock.map(batch => batch.map(c => Card.fromJSON(c)));
    this.completedRuns = prev.completedRuns;
    this.moves = prev.moves;
    this.score = prev.score;
    this.updateUI();
  }

  redo() {
    this.cancelDealAnimation();
    if (this.redoHistory.length === 0) {
      return;
    }
    const currentState = {
      tableau: this.tableau.map(col => col.map(c => c.toJSON())),
      stock: this.stock.map(batch => batch.map(c => c.toJSON())),
      completedRuns: this.completedRuns,
      moves: this.moves,
      score: this.score
    };
    this.moveHistory.push(currentState);
    const next = this.redoHistory.pop();
    this.tableau = next.tableau.map(col => col.map(c => Card.fromJSON(c)));
    this.stock = next.stock.map(batch => batch.map(c => Card.fromJSON(c)));
    this.completedRuns = next.completedRuns;
    this.moves = next.moves;
    this.score = next.score;
    this.updateUI();
  }

  saveGameToStorage() {
    try {
      const data = {
        difficulty: this.difficulty,
        tableau: this.tableau.map(col => col.map(c => c.toJSON())),
        stock: this.stock.map(batch => batch.map(c => c.toJSON())),
        completedRuns: this.completedRuns,
        moves: this.moves,
        score: this.score,
        moveHistory: this.moveHistory,
        redoHistory: this.redoHistory
      };
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(data));
    } catch (e) { }
  }

  loadGameFromStorage() {
    try {
      const raw = localStorage.getItem(GAME_STATE_KEY);
      if (!raw) {
        return false;
      }
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.tableau) || data.tableau.length !== 10) {
        return false;
      }
      if (data.difficulty !== this.difficulty) {
        return false;
      }

      this.tableau = data.tableau.map(col => col.map(c => Card.fromJSON(c)));
      this.stock = (data.stock || []).map(batch => batch.map(c => Card.fromJSON(c)));
      this.completedRuns = data.completedRuns || 0;
      this.moves = data.moves || 0;
      this.score = typeof data.score === 'number' ? data.score : 500;
      this.moveHistory = data.moveHistory || [];
      this.redoHistory = data.redoHistory || [];
      this.winOverlay.classList.add('hidden');
      this.updateUI();
      return true;
    } catch (e) {
      return false;
    }
  }

  syncURLParams() {
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.get('difficulty') !== String(this.difficulty)) {
        url.searchParams.set('difficulty', String(this.difficulty));
        changed = true;
      }
      if (url.searchParams.get('zoom') !== String(this.currentZoom)) {
        url.searchParams.set('zoom', String(this.currentZoom));
        changed = true;
      }
      if (changed) {
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) { }
  }

  applyZoom(val, updateStorageAndUrl = true) {
    this.currentZoom = Math.min(180, Math.max(60, Math.round(val)));
    if (this.tableContainerEl) {
      this.tableContainerEl.style.transform = `scale(${this.currentZoom / 100})`;
    }
    if (this.zoomValEl) {
      this.zoomValEl.textContent = `${this.currentZoom}%`;
    }
    if (updateStorageAndUrl) {
      try {
        localStorage.setItem(ZOOM_STORAGE_KEY, String(this.currentZoom));
      } catch (e) { }
      this.syncURLParams();
    }
  }

  initZoomSettings() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramZoom = urlParams.get('zoom');
    let selectedZoom = null;

    if (paramZoom) {
      const parsed = parseInt(paramZoom, 10);
      if (!isNaN(parsed) && parsed >= 50 && parsed <= 250) {
        selectedZoom = parsed;
        try {
          localStorage.setItem(ZOOM_STORAGE_KEY, String(selectedZoom));
        } catch (e) { }
      }
    }

    if (selectedZoom === null) {
      let stored = null;
      try {
        stored = localStorage.getItem(ZOOM_STORAGE_KEY);
      } catch (e) { }
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 50 && parsed <= 250) {
          selectedZoom = parsed;
        }
      }
    }

    if (selectedZoom === null) {
      selectedZoom = 100;
      try {
        localStorage.setItem(ZOOM_STORAGE_KEY, '100');
      } catch (e) { }
    }

    this.applyZoom(selectedZoom, true);
  }

  initDifficultySettings() {
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
      this.syncURLParams();
    }

    this.difficulty = selected;
    this.difficultySelect.value = String(selected);
  }

  applyPreferences() {
    const root = document.documentElement;
    const bgGrad = THEMES[this.userPrefs.bgTheme] || THEMES['classic-green'];
    root.style.setProperty('--bg-gradient', bgGrad);

    const deck = DECKS[this.userPrefs.deckColor] || DECKS['classic-blue'];
    root.style.setProperty('--deck-gradient', deck.gradient);
    root.style.setProperty('--deck-border', deck.border);

    const speed = ANIM_SPEEDS[this.userPrefs.animSpeed] || ANIM_SPEEDS['normal'];
    root.style.setProperty('--deal-duration', speed.duration);

    if (this.bgThemeSelect) {
      this.bgThemeSelect.value = this.userPrefs.bgTheme;
    }
    if (this.deckColorSelect) {
      this.deckColorSelect.value = this.userPrefs.deckColor;
    }
    if (this.animSpeedSelect) {
      this.animSpeedSelect.value = this.userPrefs.animSpeed;
    }
  }

  loadPreferences() {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          if (parsed.bgTheme && THEMES[parsed.bgTheme]) {
            this.userPrefs.bgTheme = parsed.bgTheme;
          }
          if (parsed.deckColor && DECKS[parsed.deckColor]) {
            this.userPrefs.deckColor = parsed.deckColor;
          }
          if (parsed.animSpeed && ANIM_SPEEDS[parsed.animSpeed]) {
            this.userPrefs.animSpeed = parsed.animSpeed;
          }
        }
      }
    } catch (e) { }
    this.applyPreferences();
  }

  savePreferences() {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(this.userPrefs));
    } catch (e) { }
    this.applyPreferences();
  }

  startNewGame() {
    this.cancelDealAnimation();
    this.difficulty = parseInt(this.difficultySelect.value, 10);
    const deck = this.createDeck();

    this.tableau = [[], [], [], [], [], [], [], [], [], []];
    this.stock = [];
    this.completedRuns = 0;
    this.moves = 0;
    this.score = 500;
    this.moveHistory = [];
    this.redoHistory = [];
    this.winOverlay.classList.add('hidden');

    let cardIdx = 0;
    for (let c = 0; c < 10; c++) {
      const totalInCol = c < 4 ? 6 : 5;
      for (let r = 0; r < totalInCol; r++) {
        const card = deck[cardIdx++];
        if (r === totalInCol - 1) {
          card.faceUp = true;
        }
        this.tableau[c].push(card);
      }
    }

    while (cardIdx < deck.length) {
      const dealBatch = [];
      for (let i = 0; i < 10; i++) {
        const card = deck[cardIdx++];
        card.faceUp = true;
        dealBatch.push(card);
      }
      this.stock.push(dealBatch);
    }

    this.updateUI();
  }

  canPickSequence(colIdx, startCardIdx) {
    const col = this.tableau[colIdx];
    if (startCardIdx < 0 || startCardIdx >= col.length) {
      return false;
    }
    if (!col[startCardIdx].faceUp) {
      return false;
    }

    for (let i = startCardIdx; i < col.length - 1; i++) {
      const curr = col[i];
      const next = col[i + 1];
      if (!next.faceUp) {
        return false;
      }
      if (curr.suit !== next.suit) {
        return false;
      }
      if (curr.value !== next.value + 1) {
        return false;
      }
    }
    return true;
  }

  canDropOnCol(movingTopCard, targetColIdx) {
    const targetCol = this.tableau[targetColIdx];
    if (targetCol.length === 0) {
      return true;
    }
    const targetTop = targetCol[targetCol.length - 1];
    return targetTop.value === movingTopCard.value + 1;
  }

  checkAndClearCompletedRuns() {
    let anyCleared = false;
    for (let c = 0; c < 10; c++) {
      const col = this.tableau[c];
      if (col.length < 13) {
        continue;
      }

      for (let start = col.length - 13; start >= 0; start--) {
        if (!col[start].faceUp || col[start].value !== 13) {
          continue;
        }

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
          this.completedRuns++;
          this.score += 100;
          anyCleared = true;

          if (col.length > 0 && !col[col.length - 1].faceUp) {
            col[col.length - 1].faceUp = true;
          }
          break;
        }
      }
    }

    if (anyCleared) {
      if (this.completedRuns === 8) {
        this.winStats.textContent = `Completed in ${this.moves} moves with a score of ${this.score}!`;
        this.winOverlay.classList.remove('hidden');
      }
    }
  }

  dealStock() {
    if (this.stock.length === 0 || this.isDealing) {
      return;
    }

    const hasEmptyCol = this.tableau.some(col => col.length === 0);
    if (hasEmptyCol) {
      this.showBanner("Cannot deal while any column is empty!");
      return;
    }

    const stockSlot = this.stockContainer.querySelector('.stock-slot');
    const stockRect = stockSlot ? stockSlot.getBoundingClientRect() : null;

    this.saveState();
    const batch = this.stock.pop();
    for (let i = 0; i < 10; i++) {
      this.tableau[i].push(batch[i]);
    }
    this.moves++;
    this.checkAndClearCompletedRuns();

    if (stockRect) {
      this.isDealing = true;
      this.renderStock();
      this.renderCompleted();
      this.renderTableau(true);
      this.saveGameToStorage();
      this.movesCountEl.textContent = this.moves;
      this.scoreValEl.textContent = this.score;

      const tableScale = this.currentZoom / 100;
      const newlyDealtCards = [];

      for (let i = 0; i < 10; i++) {
        const colDiv = this.tableauContainer.children[i];
        if (colDiv) {
          const cards = colDiv.querySelectorAll('.card');
          if (cards.length > 0) {
            newlyDealtCards.push(cards[cards.length - 1]);
          }
        }
      }

      const speedConfig = ANIM_SPEEDS[this.userPrefs.animSpeed] || ANIM_SPEEDS['normal'];

      if (this.userPrefs.animSpeed === 'instant') {
        newlyDealtCards.forEach((cardEl) => {
          cardEl.style.visibility = 'visible';
        });
        this.isDealing = false;
        return;
      }

      newlyDealtCards.forEach((cardEl, idx) => {
        const cardRect = cardEl.getBoundingClientRect();
        const deltaX = (stockRect.left - cardRect.left) / tableScale;
        const deltaY = (stockRect.top - cardRect.top) / tableScale;

        cardEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.8)`;
        cardEl.style.opacity = '0.5';

        const tFlight = setTimeout(() => {
          cardEl.style.visibility = 'visible';
          cardEl.classList.add('animating-deal');
          requestAnimationFrame(() => {
            cardEl.style.transform = 'translate(0, 0) scale(1)';
            cardEl.style.opacity = '1';
          });
        }, idx * speedConfig.stagger + 15);
        this.dealAnimationTimeouts.push(tFlight);

        const tCleanup = setTimeout(() => {
          cardEl.classList.remove('animating-deal');
          cardEl.style.transform = '';
          cardEl.style.opacity = '';
          cardEl.style.visibility = '';
          if (idx === newlyDealtCards.length - 1) {
            this.isDealing = false;
            this.dealAnimationTimeouts = [];
          }
        }, speedConfig.cleanup + idx * speedConfig.stagger);
        this.dealAnimationTimeouts.push(tCleanup);
      });
    } else {
      this.updateUI();
    }
  }

  renderStock() {
    this.stockContainer.textContent = '';
    if (this.stock.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'stock-empty';
      emptyDiv.textContent = 'Empty';
      this.stockContainer.appendChild(emptyDiv);
      return;
    }

    const slot = document.createElement('div');
    slot.className = 'stock-slot';
    slot.title = `Deal cards (${this.stock.length} deals left)`;
    slot.onclick = () => {
      this.dealStock();
    };

    this.stock.forEach((_, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'stock-card';
      cardEl.style.top = `${-idx * 3}px`;
      cardEl.style.left = `${idx * 4}px`;
      slot.appendChild(cardEl);
    });

    this.stockContainer.appendChild(slot);
  }

  renderCompleted() {
    this.completedContainer.textContent = '';
    for (let i = 0; i < 8; i++) {
      const slot = document.createElement('div');
      slot.className = 'foundation-slot';
      if (i < this.completedRuns) {
        const symbolSpan = document.createElement('span');
        symbolSpan.style.fontSize = '1.5rem';
        symbolSpan.style.color = '#facc15';
        symbolSpan.textContent = '♠';

        const rankSpan = document.createElement('span');
        rankSpan.style.fontSize = '0.8rem';
        rankSpan.style.fontWeight = 'bold';
        rankSpan.style.position = 'absolute';
        rankSpan.style.bottom = '2px';
        rankSpan.textContent = 'K-A';

        slot.appendChild(symbolSpan);
        slot.appendChild(rankSpan);
      }
      this.completedContainer.appendChild(slot);
    }
  }

  renderTableau(dealingCardsIndices = null) {
    this.tableauContainer.textContent = '';

    this.tableau.forEach((colCards, colIdx) => {
      const colDiv = document.createElement('div');
      colDiv.className = 'column';
      colDiv.dataset.col = colIdx;

      colDiv.ondragover = (e) => {
        e.preventDefault();
        colDiv.classList.add('drag-over');

        if (this.draggedData && this.draggedData.fromCol !== colIdx) {
          const movingCards = this.tableau[this.draggedData.fromCol].slice(this.draggedData.startIdx);
          const topMoving = movingCards[0];
          if (this.canDropOnCol(topMoving, colIdx)) {
            const cardsInCol = colDiv.querySelectorAll('.card');
            if (cardsInCol.length > 0) {
              cardsInCol[cardsInCol.length - 1].classList.add('target-highlight');
            }
          }
        }
      };

      colDiv.ondragleave = () => {
        colDiv.classList.remove('drag-over');
        const highlighted = colDiv.querySelectorAll('.card.target-highlight');
        highlighted.forEach((c) => {
          c.classList.remove('target-highlight');
        });
      };

      colDiv.ondrop = (e) => {
        e.preventDefault();
        colDiv.classList.remove('drag-over');
        const highlighted = colDiv.querySelectorAll('.card.target-highlight');
        highlighted.forEach((c) => {
          c.classList.remove('target-highlight');
        });
        this.handleDrop(colIdx);
      };

      let currentTopOffset = 0;
      colCards.forEach((card, cardIndex) => {
        const cardEl = card.createDOMElement(colIdx, cardIndex, this);
        cardEl.style.top = `${currentTopOffset}px`;

        if (dealingCardsIndices && cardIndex === colCards.length - 1) {
          cardEl.style.visibility = 'hidden';
        }

        colDiv.appendChild(cardEl);
        currentTopOffset += card.faceUp ? 26 : 14;
      });

      colDiv.style.minHeight = `${Math.max(125, currentTopOffset + 115)}px`;
      this.tableauContainer.appendChild(colDiv);
    });
  }

  onCardDragStart(e, colIdx, cardIndex, cardEl) {
    this.draggedData = {
      fromCol: colIdx,
      startIdx: cardIndex,
      count: this.tableau[colIdx].length - cardIndex
    };
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';

    // Build custom ghost drag preview
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${cardEl.offsetWidth || 85}px`;
    ghost.style.pointerEvents = 'none';

    const colDiv = this.tableauContainer.children[colIdx];
    if (colDiv) {
      const cardsInCol = colDiv.querySelectorAll('.card');
      let ghostOffset = 0;
      for (let i = cardIndex; i < cardsInCol.length; i++) {
        const clone = cardsInCol[i].cloneNode(true);
        clone.classList.remove('is-dragging');
        clone.style.position = 'absolute';
        clone.style.top = `${ghostOffset}px`;
        clone.style.left = '0';
        clone.style.width = '100%';
        clone.style.zIndex = `${100 + i}`;
        ghost.appendChild(clone);
        ghostOffset += 26;
      }
      ghost.style.height = `${ghostOffset + (cardEl.offsetHeight || 120)}px`;
    }
    document.body.appendChild(ghost);

    const rect = cardEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(ghost, clickX > 0 ? clickX : 20, clickY > 0 ? clickY : 20);

    setTimeout(() => {
      if (ghost && ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    }, 0);

    setTimeout(() => {
      if (colDiv) {
        const cardsInCol = colDiv.querySelectorAll('.card');
        for (let i = cardIndex; i < cardsInCol.length; i++) {
          cardsInCol[i].classList.add('is-dragging');
        }
      }
    }, 0);
  }

  onCardDragEnd(colIdx) {
    const colDiv = this.tableauContainer.children[colIdx];
    if (colDiv) {
      const draggingCards = colDiv.querySelectorAll('.card.is-dragging');
      draggingCards.forEach((c) => {
        c.classList.remove('is-dragging');
      });
    }
    const allHighlighted = this.tableauContainer.querySelectorAll('.card.target-highlight');
    allHighlighted.forEach((c) => {
      c.classList.remove('target-highlight');
    });
    this.draggedData = null;
  }

  handleDrop(targetColIdx) {
    if (!this.draggedData) {
      return;
    }
    const { fromCol, startIdx } = this.draggedData;
    if (fromCol === targetColIdx) {
      return;
    }

    const movingCards = this.tableau[fromCol].slice(startIdx);
    const topMovingCard = movingCards[0];

    if (this.canDropOnCol(topMovingCard, targetColIdx)) {
      this.saveState();
      this.tableau[fromCol].splice(startIdx);
      this.tableau[targetColIdx].push(...movingCards);

      const sourceCol = this.tableau[fromCol];
      if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
        sourceCol[sourceCol.length - 1].faceUp = true;
      }

      this.moves++;
      this.score = Math.max(0, this.score - 1);
      this.checkAndClearCompletedRuns();
      this.updateUI();
    }
  }

  tryAutoMove(colIdx, cardIndex) {
    if (!this.canPickSequence(colIdx, cardIndex)) {
      return;
    }
    const movingCards = this.tableau[colIdx].slice(cardIndex);
    const topMoving = movingCards[0];

    let bestTarget = -1;
    let alternateTarget = -1;

    for (let c = 0; c < 10; c++) {
      if (c === colIdx) {
        continue;
      }
      if (this.canDropOnCol(topMoving, c)) {
        const targetCol = this.tableau[c];
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
      this.saveState();
      this.tableau[colIdx].splice(cardIndex);
      this.tableau[target].push(...movingCards);

      const sourceCol = this.tableau[colIdx];
      if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
        sourceCol[sourceCol.length - 1].faceUp = true;
      }

      this.moves++;
      this.score = Math.max(0, this.score - 1);
      this.checkAndClearCompletedRuns();
      this.updateUI();
    }
  }

  updateUI() {
    this.movesCountEl.textContent = this.moves;
    this.scoreValEl.textContent = this.score;
    this.renderStock();
    this.renderCompleted();
    this.renderTableau();
    this.saveGameToStorage();
  }

  bindEvents() {
    document.getElementById('newGameBtn').onclick = () => {
      this.startNewGame();
    };
    document.getElementById('winNewGameBtn').onclick = () => {
      this.startNewGame();
    };
    document.getElementById('undoBtn').onclick = () => {
      this.undo();
    };
    document.getElementById('redoBtn').onclick = () => {
      this.redo();
    };

    if (this.zoomInBtn) {
      this.zoomInBtn.onclick = () => {
        this.applyZoom(this.currentZoom + 10);
      };
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.onclick = () => {
        this.applyZoom(this.currentZoom - 10);
      };
    }

    this.difficultySelect.onchange = () => {
      this.difficulty = parseInt(this.difficultySelect.value, 10);
      try {
        localStorage.setItem(STORAGE_KEY, String(this.difficulty));
      } catch (e) { }
      this.syncURLParams();
      this.startNewGame();
    };

    if (this.settingsBtn) {
      this.settingsBtn.onclick = () => {
        if (this.settingsOverlay) {
          this.settingsOverlay.classList.remove('hidden');
        }
      };
    }
    if (this.closeSettingsBtn) {
      this.closeSettingsBtn.onclick = () => {
        if (this.settingsOverlay) {
          this.settingsOverlay.classList.add('hidden');
        }
      };
    }
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.onclick = () => {
        if (this.settingsOverlay) {
          this.settingsOverlay.classList.add('hidden');
        }
      };
    }

    if (this.bgThemeSelect) {
      this.bgThemeSelect.onchange = () => {
        this.userPrefs.bgTheme = this.bgThemeSelect.value;
        this.savePreferences();
      };
    }
    if (this.deckColorSelect) {
      this.deckColorSelect.onchange = () => {
        this.userPrefs.deckColor = this.deckColorSelect.value;
        this.savePreferences();
      };
    }
    if (this.animSpeedSelect) {
      this.animSpeedSelect.onchange = () => {
        this.userPrefs.animSpeed = this.animSpeedSelect.value;
        this.savePreferences();
      };
    }

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          this.redo();
        }
      }
    });
  }

  init() {
    this.loadPreferences();
    this.initDifficultySettings();
    this.initZoomSettings();
    if (!this.loadGameFromStorage()) {
      this.startNewGame();
    }
  }
}

// Instantiate and start the game
const game = new SpiderSolitaire();
game.init();
