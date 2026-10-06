/* Trap.html — reads the trap the board sent over and fills in the page.
   Two traps (Bat Swarm, Cursed Room) say "roll to find out what happens"
   in their own effect text, so instead of the board deciding that with a
   hidden dice roll, this page gives the player an actual die to roll and
   applies the real outcome once they do. */

const TRAP_FLAVOR = {
  "trapdoor": "The floor gives way beneath your feet.",
  "ghost-attack": "A cold shape rushes through you.",
  "spider-nest": "You stumble into a web thick with movement.",
  "locked-door": "The handle won't budge — something's wrong with this door.",
  "collapsing-staircase": "A step crumbles away under your weight.",
  "haunted-mirror": "Your reflection moves a second too late.",
  "bat-swarm": "A screeching cloud of wings bursts from the dark.",
  "cursed-room": "The air turns heavy and cold around you.",
  "falling-chandelier": "Glass and iron crash down from above.",
  "fake-exit": "The door swings open onto a blank wall.",
};

// same flat 1..32 wraparound board.js uses for "move back N spaces" --
// duplicated here since this page doesn't load board.js
function shiftPosition(p, steps) {
  let pos0 = p.position - 1;
  pos0 = ((pos0 + steps) % 32 + 32) % 32;
  p.position = pos0 + 1;
}

(function () {
  const q = new URLSearchParams(location.search);
  const name = q.get("name") || "Trap";
  const icon = q.get("icon") || "";
  const effect = q.get("effect") || "";
  const needsRoll = q.get("roll") === "1";
  const playerIndex = parseInt(q.get("player"), 10);

  const h1 = document.querySelector(".main h1");
  if (h1) h1.textContent = name;

  const img = document.querySelector(".main img");
  if (img && icon) img.src = "game_icons/" + icon + ".svg";

  const desc = document.querySelector(".main p.Italic");
  if (desc) desc.textContent = TRAP_FLAVOR[icon] || "";

  const effectP = document.querySelector(".main p:not(.Italic)");
  if (effectP) effectP.textContent = effect;

  const btn = document.querySelector(".main button");
  if (!btn) return;

  if (!needsRoll) {
    btn.addEventListener("click", () => { location.href = "board.html"; });
    return;
  }

  // --- interactive roll for Bat Swarm / Cursed Room ---
  btn.textContent = "Roll the Die";
  btn.addEventListener("click", function rollHandler() {
    let state;
    try { state = JSON.parse(localStorage.getItem("mansionGame")); } catch (e) {}
    const player = state && state.players[playerIndex];

    const r = 1 + Math.floor(Math.random() * 6);
    let outcome;

    if (icon === "bat-swarm") {
      if (r >= 4) {
        outcome = "You rolled a " + r + " — you escape the bats unharmed!";
      } else {
        if (player) player.skip = true;
        outcome = "You rolled a " + r + " — the bats knock you down. Lose your next turn.";
      }
    } else if (icon === "cursed-room") {
      if (r <= 2) {
        if (player) shiftPosition(player, -2);
        outcome = "You rolled a " + r + " — the curse pulls you back 2 spaces.";
      } else if (r <= 4) {
        if (player) player.skip = true;
        outcome = "You rolled a " + r + " — the curse costs you your next turn.";
      } else {
        if (player) shiftPosition(player, -4);
        outcome = "You rolled a " + r + " — the curse pulls you back 4 spaces.";
      }
    }

    if (state) localStorage.setItem("mansionGame", JSON.stringify(state));

    if (effectP) effectP.textContent = outcome;
    btn.textContent = "Continue";
    btn.removeEventListener("click", rollHandler);
    btn.addEventListener("click", () => { location.href = "board.html"; });
  });
})();
