/* how-to-play.html -- this page has no way back to the title screen at
   all right now. Needs one small HTML addition: a button near the top
   of <main>, e.g.

     <button id="how-to-back">Back</button>

   placed right after <main> opens, before the "How to play" heading. */

(function () {
  const btn = document.getElementById("how-to-back");
  if (btn) btn.addEventListener("click", () => { location.href = "index.html"; });
})();
