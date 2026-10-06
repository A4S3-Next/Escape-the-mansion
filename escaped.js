/* Escaped.html -- fills in the winner's stats, reveals what every room on
   the board actually was, and wires up the three ways forward: look at
   the final board, start a new game, or head back to the title screen */

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

// "ghost-attack" -> "Ghost Attack" -- turns an icon key back into the same
// display name board.js's TRAPS/POWERUPS lists already use, without
// having to duplicate those lists in this file too
function labelFromKey(key) {
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderReveal() {
  const grid = document.getElementById("reveal-grid");
  if (!grid) return;

  let state;
  try { state = JSON.parse(localStorage.getItem("mansionGame")); } catch (e) {}
  if (!state) return;

  const exits = state.exitRooms || [];
  // allTrapRooms/allPowerupRooms hold the full original layout; older saved
  // games won't have them, so fall back to whatever's left un-triggered
  const traps = state.allTrapRooms || state.trapRooms || {};
  const powerups = state.allPowerupRooms || state.powerupRooms || {};

  grid.innerHTML = "";
  for (let i = 1; i <= 32; i++) {
    let kind = "plain";
    let iconKey = "";
    let label = "";

    if (exits.includes(i)) {
      kind = "exit";
      iconKey = "trophy";
      label = "Exit";
    } else if (traps[i]) {
      kind = "trap";
      iconKey = traps[i];
      label = labelFromKey(traps[i]);
    } else if (powerups[i]) {
      kind = "powerup";
      iconKey = powerups[i];
      label = labelFromKey(powerups[i]);
    }

    const tile = document.createElement("div");
    tile.className = "tile reveal-tile reveal-" + kind;
    tile.innerHTML = `
      <span class="tile-num">${i}</span>
      <span class="tile-name">${ROOM_NAMES[i - 1]}</span>
      ${iconKey ? `<img class="reveal-icon" src="game_icons/${iconKey}.svg" alt="">` : ""}
      ${label ? `<span class="reveal-label">${label}</span>` : ""}
    `;
    grid.appendChild(tile);
  }
}

(function () {
  const q = new URLSearchParams(location.search);
  const name = q.get("name") || "Someone";
  const turns = q.get("turns") || "0";
  const left = q.get("left") || "0";

  const nameEl = document.querySelector(".info > h2");
  if (nameEl) nameEl.textContent = name;

  const turnsNum = document.querySelector(".Turns h2");
  if (turnsNum) turnsNum.textContent = turns;

  const leftNum = document.querySelector(".left-inside h2");
  if (leftNum) leftNum.textContent = left;

  renderReveal();

  const buttons = document.querySelectorAll(".button button, .button Button");
  // first button: View the Board (read-only look at where everyone ended up)
  if (buttons[0]) {
    buttons[0].addEventListener("click", () => {
      location.href = "board.html?view=1";
    });
  }
  // second button: New game (same players, fresh board)
  if (buttons[1]) {
    buttons[1].addEventListener("click", () => {
      localStorage.removeItem("mansionGame");
      location.href = "board.html";
    });
  }

  // "back to home" is a plain <h2>, styled like a link
  const backHome = document.querySelector(".continue > h2");
  if (backHome) {
    backHome.addEventListener("click", () => {
      localStorage.removeItem("mansionGame");
      localStorage.removeItem("mansionPlayers");
      location.href = "index.html";
    });
  }
})();
