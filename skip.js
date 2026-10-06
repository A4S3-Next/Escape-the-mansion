/* skip-turn.html -- fills in whose turn got skipped, and sends them back
   to the board once it's actually their go */

(function () {
  const q = new URLSearchParams(location.search);
  const name = q.get("name") || "Player";

  const h1 = document.querySelector(".text h1");
  if (h1) h1.textContent = name;

  const btn = document.querySelector(".main button");
  if (btn) btn.addEventListener("click", () => { location.href = "board.html"; });
})();
