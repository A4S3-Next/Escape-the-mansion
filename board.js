/* ============================================================
   Escape the Haunted Mansion — board logic
   Reads/writes one object in localStorage ("mansionGame") so the
   board keeps working across page loads, and so it can hand off
   to your other pages (Trap.html, Power_Up.html, skip-turn.html,
   pass-the-device.html, Escaped.html) with ?name=&effect=... in
   the URL. Those pages are plain HTML today, so they'll show the
   query-string values only once you add a few lines reading
   them — see the note at the bottom of this file.
   ============================================================ */

const STORAGE_KEY = "mansionGame";

const ROOM_NAMES = [
  "Entrance Hall", "Library", "Kitchen", "Dining Room",
  "Parlor", "Study", "Conservatory", "Ballroom",
  "Wine Cellar", "Attic", "Nursery", "Chapel",
  "Armory", "Observatory", "Greenhouse", "Laundry Room",
  "Billiard Room", "Music Room", "Servants' Quarters", "Boiler Room",
  "Gallery", "Workshop", "Crypt", "Vault",
  "Tower Stairs", "Garden Terrace", "Smoking Room", "Trophy Room",
  "Storm Cellar", "Bell Tower", "Secret Passage", "Grand Foyer",
];

const TRAPS = [
  { key: "trapdoor", name: "Trapdoor", effect: "Move back 3 spaces", back: 3 },
  { key: "ghost-attack", name: "Ghost Attack", effect: "Lose your next turn", skip: true },
  { key: "spider-nest", name: "Spider Nest", effect: "Move back 2 spaces", back: 2 },
  { key: "locked-door", name: "Locked door", effect: "Need a skeleton key or lose your next turn", skip: true },
  { key: "collapsing-staircase", name: "Collapsing Staircase", effect: "Go back a room", back: 1 },
  { key: "haunted-mirror", name: "Haunted Mirror", effect: "Move back 2 spaces", back: 2 },
  { key: "bat-swarm", name: "Bat Swarm", effect: "Roll a 4, 5, or 6 to escape or lose a turn", batSwarm: true },
  { key: "cursed-room", name: "Cursed Room", effect: "Roll to determine the penalty", cursed: true },
  { key: "falling-chandelier", name: "Falling Chandelier", effect: "Move back 1 space and lose a turn", back: 1, skip: true },
  { key: "fake-exit", name: "Fake Exit", effect: "Move back 4 spaces", back: 4 },
];

const POWERUPS = [
  { key: "skeleton-key", name: "Skeleton Key", effect: "Unlock any locked door without losing a turn." },
  { key: "flashlight", name: "Flashlight", effect: "Ignore one Ghost Attack." },
  { key: "holy-water", name: "Holy Water", effect: "Cancel one curse or ghost attack." },
  { key: "map", name: "Map", effect: "Reveal what lies in each room next to you." },
  { key: "sprint-boots", name: "Sprint Boots", effect: "Move an extra 3 spaces on your next roll." },
  { key: "protective-charm", name: "Protective Charm", effect: "Blocks the very next trap that affects you." },
  { key: "extra-life", name: "Extra Life", effect: "Ignore a trap that would cost you a turn." },
  { key: "teleport-crystal", name: "Teleport Crystal", effect: "Move to any room you've already visited." },
  { key: "time-rewind", name: "Time Rewind", effect: "Undo the last trap that affected you." },
  { key: "lucky-coin", name: "Lucky Coin", effect: "Reroll the dice once on your turn." },
];

const DEFAULT_COLORS = ["#cfa25e", "#8a8072", "#9c6b4f", "#6b8a7a", "#a85c5c", "#6b7a9c", "#9c8a4f", "#7a6b9c"];

/* ---------------- state ---------------- */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setupRooms() {
  const pool = shuffle([...Array(31)].map((_, i) => i + 2)); // rooms 2..32, room 1 is start
  const exitRooms = pool.splice(0, 4);
  const trapRooms = {};
  TRAPS.forEach((t) => { trapRooms[pool.pop()] = t.key; });
  const powerupRooms = {};
  POWERUPS.forEach((p) => { powerupRooms[pool.pop()] = p.key; });
  return {
    exitRooms,
    trapRooms,
    powerupRooms,
    // trapRooms/powerupRooms get entries deleted as they're triggered (so a
    // room only fires once) -- these two keep the full original layout
    // around so Escaped.html can reveal what every square was
    allTrapRooms: { ...trapRooms },
    allPowerupRooms: { ...powerupRooms },
  };
}

function newGameState() {
  // if player-list.html has saved names under "mansionPlayers", use them;
  // otherwise fall back to two demo players so the board works on its own
  let names = null;
  try { names = JSON.parse(localStorage.getItem("mansionPlayers")); } catch (e) {}
  if (!Array.isArray(names) || names.length < 2) names = ["Player 1", "Player 2"];

  const players = names.map((name, i) => ({
    name,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    position: 1,
    skip: false,
    inventory: [],
  }));

  return {
    players,
    turnIndex: 0,
    turnNumber: 1,
    lastRoll: null,
    ...setupRooms(),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const state = newGameState();
  saveState(state);
  return state;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// board.html?view=1 shows the board without letting anyone keep playing —
// used by Escaped.html's "View the Board" button once a game is over
const VIEW_ONLY = new URLSearchParams(location.search).get("view") === "1";

function currentPlayer() {
  return state.players[state.turnIndex];
}

/* ---------------- rendering ---------------- */

const grid = document.getElementById("board-grid");
const turnNameEl = document.getElementById("turn-name");
const turnNumberEl = document.getElementById("turn-number");
const flavorEl = document.getElementById("flavor");
const diceBtn = document.getElementById("dice-btn");
const packBtn = document.getElementById("btn-pack");
const dpad = {
  up: document.getElementById("btn-up"),
  down: document.getElementById("btn-down"),
  left: document.getElementById("btn-left"),
  right: document.getElementById("btn-right"),
};

function renderGrid() {
  grid.innerHTML = "";
  for (let i = 1; i <= 32; i++) {
    const tile = document.createElement("div");
    tile.className = "tile" + (i === currentPlayer().position ? " current" : "");

    const occupants = state.players.filter((p) => p.position === i);
    const tokens = occupants
      .map((p) => `<span class="tile-token" style="background:${p.color}"></span>`)
      .join("");

    tile.innerHTML = `
      <span class="tile-num">${i}</span>
      <span class="tile-name">${ROOM_NAMES[i - 1]}</span>
      <div class="tile-tokens">${tokens}</div>
    `;
    grid.appendChild(tile);
  }
}

function renderHud() {
  turnNameEl.textContent = currentPlayer().name;
  turnNumberEl.textContent = state.turnNumber;
}

function setDpadEnabled(enabled) {
  Object.values(dpad).forEach((btn) => { btn.disabled = !enabled; });
}

function render() {
  renderGrid();
  renderHud();

  if (VIEW_ONLY) {
    setDpadEnabled(false);
    diceBtn.disabled = true;
    diceBtn.textContent = "—";
    packBtn.disabled = true;
    flavorEl.textContent = "The mansion, as everyone left it.";
    return;
  }

  setDpadEnabled(state.lastRoll !== null);
  diceBtn.textContent = state.lastRoll !== null ? state.lastRoll : "?";
  flavorEl.textContent = state.lastRoll !== null
    ? `Pick a direction to move ${state.lastRoll} room${state.lastRoll > 1 ? "s" : ""}.`
    : "Roll the die, then pick a direction.";
}

/* ---------------- movement ---------------- */

// flat wraparound along the room sequence 1..32 — used for trap "move
// back N spaces" effects, which step back along the room order rather
// than along a grid direction
function shiftPosition(p, steps) {
  let pos0 = p.position - 1; // 0-indexed
  pos0 = ((pos0 + steps) % 32 + 32) % 32;
  p.position = pos0 + 1;
}

// true 2D wraparound for dice + d-pad movement on the 4-wide, 8-tall
// grid: left/right wrap within the SAME row, up/down wrap within the
// SAME column. (A flat 1..32 shift would spill left/right movement
// into the next row whenever it crossed a row's edge, which looks like
// the token jumping to a different row instead of wrapping in place.)
const COLS = 4;
const ROWS = 8;

// pure version (no mutation) so the d-pad hover preview can ask "where
// would this move land?" without actually moving anyone
function computeMoveOnGrid(position, axis, steps) {
  let pos0 = position - 1; // 0-indexed
  let row = Math.floor(pos0 / COLS);
  let col = pos0 % COLS;
  if (axis === "col") {
    col = ((col + steps) % COLS + COLS) % COLS;
  } else {
    row = ((row + steps) % ROWS + ROWS) % ROWS;
  }
  return row * COLS + col + 1;
}

function moveOnGrid(p, axis, steps) {
  p.position = computeMoveOnGrid(p.position, axis, steps);
}

function onDirection(axis, unitSteps) {
  if (state.lastRoll === null) return;
  moveOnGrid(currentPlayer(), axis, unitSteps * state.lastRoll);
  state.lastRoll = null;
  saveState(state);
  render();
  afterMove();
}

/* ---------------- landing effects ---------------- */

function applyTrap(p, trap) {
  if (trap.key === "bat-swarm") {
    const r = 1 + Math.floor(Math.random() * 6);
    if (r < 4) p.skip = true;
  } else if (trap.key === "cursed-room") {
    const r = 1 + Math.floor(Math.random() * 6);
    if (r <= 2) shiftPosition(p, -2);
    else if (r <= 4) p.skip = true;
    else shiftPosition(p, -4);
  } else {
    if (trap.back) shiftPosition(p, -trap.back);
    if (trap.skip) p.skip = true;
  }
}

function afterMove() {
  const p = currentPlayer();
  const pos = p.position;

  if (state.exitRooms.includes(pos)) {
    saveState(state);
    goToPage("Escaped.html", {
      name: p.name,
      turns: state.turnNumber,
      left: state.players.length - 1,
    });
    return;
  }

  if (state.trapRooms[pos]) {
    const trap = TRAPS.find((t) => t.key === state.trapRooms[pos]);
    delete state.trapRooms[pos]; // triggers once, then the room is safe

    // bat-swarm and cursed-room both say "roll to find out what happens" --
    // give the player an actual die to roll on Trap.html instead of
    // deciding the outcome here with a hidden Math.random(). We still need
    // to know which player this was once we're on that page (turnIndex is
    // about to move on), so pass their index along.
    const needsRoll = trap.key === "bat-swarm" || trap.key === "cursed-room";
    const playerIndex = state.turnIndex;
    if (!needsRoll) applyTrap(p, trap);

    advanceTurn(); // this player's turn is over once they see the trap screen
    goToPage("Trap.html", {
      name: trap.name,
      icon: trap.key,
      effect: trap.effect,
      roll: needsRoll ? "1" : "0",
      player: playerIndex,
    });
    return;
  }

  if (state.powerupRooms[pos]) {
    const pu = POWERUPS.find((x) => x.key === state.powerupRooms[pos]);
    delete state.powerupRooms[pos];
    p.inventory.push(pu.key);
    advanceTurn(); // this player's turn is over once they see the power-up screen
    goToPage("Power_Up.html", { name: pu.name, icon: pu.key, effect: pu.effect });
    return;
  }

  endTurn();
}

// moves turnIndex/turnNumber to the next player and saves -- shared by
// endTurn() below and by the trap/power-up branches above, which also
// need the turn to move on once their info screen has been shown
function advanceTurn() {
  state.turnIndex = (state.turnIndex + 1) % state.players.length;
  if (state.turnIndex === 0) state.turnNumber++;
  saveState(state);
}

function endTurn() {
  advanceTurn();

  const next = currentPlayer();
  if (next.skip) {
    next.skip = false;
    saveState(state);
    goToPage("skip-turn.html", { name: next.name });
    return;
  }
  goToPage("pass-the-device.html", { name: next.name });
}

function goToPage(url, params) {
  const q = new URLSearchParams(params).toString();
  window.location.href = url + (q ? "?" + q : "");
}

/* ---------------- events ---------------- */

diceBtn.addEventListener("click", () => {
  if (VIEW_ONLY) return;
  if (state.lastRoll !== null) return; // already rolled, waiting on a direction
  state.lastRoll = 1 + Math.floor(Math.random() * 6);
  saveState(state);
  render();
});

dpad.up.addEventListener("click", () => onDirection("row", -1));
dpad.down.addEventListener("click", () => onDirection("row", 1));
dpad.left.addEventListener("click", () => onDirection("col", -1));
dpad.right.addEventListener("click", () => onDirection("col", 1));

/* ---- hover/focus preview: show which tile an arrow would move to ---- */

const DPAD_MOVES = {
  up: ["row", -1],
  down: ["row", 1],
  left: ["col", -1],
  right: ["col", 1],
};

function clearPreview() {
  const prev = grid.querySelector(".tile-preview");
  if (prev) prev.classList.remove("tile-preview");
}

function showPreview(axis, unitSteps) {
  if (VIEW_ONLY || state.lastRoll === null) return;
  const target = computeMoveOnGrid(currentPlayer().position, axis, unitSteps * state.lastRoll);
  clearPreview();
  const tile = grid.children[target - 1];
  if (tile) tile.classList.add("tile-preview");
}

Object.keys(DPAD_MOVES).forEach((key) => {
  const [axis, unitSteps] = DPAD_MOVES[key];
  const btn = dpad[key];
  btn.addEventListener("mouseenter", () => showPreview(axis, unitSteps));
  btn.addEventListener("mouseleave", clearPreview);
  btn.addEventListener("focus", () => showPreview(axis, unitSteps));
  btn.addEventListener("blur", clearPreview);
});

packBtn.addEventListener("click", () => {
  if (VIEW_ONLY) return;
  location.href = "Power-Up-list.html";
});

render();

/* ============================================================
   Wiring this into your other pages
   ------------------------------------------------------------
   The board writes everything into localStorage under
   "mansionGame" and also passes the key details on the URL when
   it sends the player to another page, e.g.:

     Trap.html?name=Trapdoor&icon=trapdoor&effect=Move%20back%203%20spaces
     Power_Up.html?name=Flashlight&icon=flashlight&effect=...
     skip-turn.html?name=Jordan
     pass-the-device.html?name=Jordan
     Escaped.html?name=Jordan&turns=14&left=1

   Trap.html / Power_Up.html / skip-turn.html / pass-the-device.html /
   Escaped.html are still static right now, so the query string
   arrives but nothing displays it yet. To show it, add a small
   script near the end of each page's <body> that reads
   location.search and fills in the placeholder text, e.g. on
   Trap.html:

     <script>
       const q = new URLSearchParams(location.search);
       document.querySelector('h1').textContent = q.get('name');
       document.querySelector('p:last-of-type').textContent = q.get('effect');
     </script>

   And on pass-the-device.html / skip-turn.html, the "I'm Ready" /
   "Continue" button should link back to board.html, e.g.:

     <button onclick="location.href='board.html'">I'm Ready</button>

   Happy to add these snippets to each page directly if you want
   the whole flow working end to end.
   ============================================================ */
