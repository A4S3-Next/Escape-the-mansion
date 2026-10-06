/* pass-the-device.html -- fills in whose turn is next, and sends them
   to the board once they tap "I'm Ready" */

(function () {
  const q = new URLSearchParams(location.search);
  const name = q.get("name") || "Player";

  const h1 = document.querySelector(".box h1");
  if (h1) h1.textContent = name;

  const btn = document.querySelector(".main > button");
  if (btn) btn.addEventListener("click", () => { location.href = "board.html"; });
})();
