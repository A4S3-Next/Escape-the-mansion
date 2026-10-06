/* index.html -- the two buttons on the title screen don't go anywhere yet.
   This just wires them to the next pages. */

(function () {
  const buttons = document.querySelectorAll("main button");
  // first button: "Play" -> go set up players
  if (buttons[0]) {
    buttons[0].addEventListener("click", () => {
      location.href = "player-list.html";
    });
  }
  // second button: "How to play" -> the rules page
  if (buttons[1]) {
    buttons[1].addEventListener("click", () => {
      location.href = "how-to-play.html";
    });
  }
})();
