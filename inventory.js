/* Power-Up-list.html ("Your Power-Ups") -- shows the CURRENT player's
   actual inventory instead of the 3 hardcoded "Example" rows, and wires
   up "use" and a back button.

   Needs one small HTML addition: a button for going back, e.g.

     <button id="pack-back">Back</button>

   placed as the last thing inside <div class="main"> (after the
   power-up3 block). Without it the page still works, there's just no
   way back to the board except the browser's own back button. */

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

(function () {
  let state;
  try { state = JSON.parse(localStorage.getItem("mansionGame")); } catch (e) {}
  if (!state) { location.href = "board.html"; return; }

  const player = state.players[state.turnIndex];
  const container = document.querySelector(".main");
  const imgsRow = document.querySelector(".imgs");
  const template = document.querySelector('[class^="power-up"]');
  const backBtn = document.getElementById("pack-back"); // insert rows before this, if present

  // top row of small icons: one per owned item, empty frame otherwise
  // a fully transparent 1x1 pixel -- an empty src="" (or no src at all)
  // makes some browsers show a "broken image" glyph instead of just the
  // plain circle frame from styles.css, so empty slots point here instead
  const BLANK_PIXEL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";

  if (imgsRow) {
    const slots = imgsRow.querySelectorAll("img");
    slots.forEach((img, i) => {
      const key = player.inventory[i];
      img.src = key ? "game_icons/" + key + ".svg" : BLANK_PIXEL;
    });
  }

  // clear the 3 example rows, rebuild from what this player actually has
  document.querySelectorAll('[class^="power-up"]').forEach((el) => el.remove());

  function addToPage(el) {
    if (backBtn) container.insertBefore(el, backBtn);
    else container.appendChild(el);
  }

  if (player.inventory.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No power-ups yet — keep exploring the mansion.";
    addToPage(empty);
  }

  player.inventory.forEach((key, idx) => {
    const pu = POWERUPS.find((p) => p.key === key);
    if (!pu || !template) return;

    const row = template.cloneNode(true);
    row.className = "power-up" + (idx + 1);
    row.querySelector("img").src = "game_icons/" + key + ".svg";
    row.querySelector("h3").textContent = pu.name;
    row.querySelector("p").textContent = pu.effect;
    row.querySelector("button").addEventListener("click", () => {
      player.inventory.splice(idx, 1);
      localStorage.setItem("mansionGame", JSON.stringify(state));
      location.href = "board.html";
    });
    addToPage(row);
  });

  if (backBtn) backBtn.addEventListener("click", () => { location.href = "board.html"; });
})();
