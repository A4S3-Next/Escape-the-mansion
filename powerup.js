/* Power_Up.html -- reads the power-up the board sent over and fills in the page */

const POWERUP_FLAVOR = {
  "skeleton-key": "An old iron key, worn smooth by other hands.",
  "flashlight": "Its beam cuts clean through the dark.",
  "holy-water": "A small vial, faintly warm to the touch.",
  "map": "Hand-drawn, but it seems to know the house.",
  "sprint-boots": "Light as air and eager to run.",
  "protective-charm": "It hums faintly against your skin.",
  "extra-life": "A second chance, if you need it.",
  "teleport-crystal": "It flickers with somewhere else entirely.",
  "time-rewind": "For a moment, nothing has happened yet.",
  "lucky-coin": "Heads you win. Tails... try again.",
};

(function () {
  const q = new URLSearchParams(location.search);
  const name = q.get("name") || "Power-Up";
  const icon = q.get("icon") || "";
  const effect = q.get("effect") || "";

  const h1 = document.querySelector(".main h1");
  if (h1) h1.textContent = name;

  const img = document.querySelector(".main img");
  if (img && icon) img.src = "game_icons/" + icon + ".svg";

  const desc = document.querySelector(".main p.Italic");
  if (desc) desc.textContent = POWERUP_FLAVOR[icon] || "";

  const effectP = document.querySelector(".main p:not(.Italic)");
  if (effectP) effectP.textContent = effect;

  const btn = document.querySelector(".main button");
  if (btn) btn.addEventListener("click", () => { location.href = "board.html"; });
})();
