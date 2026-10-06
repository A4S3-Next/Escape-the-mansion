/* player-list.html ("Gather Your Party") -- "Add Player" doesn't add a row
   yet, and "Start Game" doesn't save names or go anywhere. This wires up
   both, and hands the names to board.js via localStorage. */

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 2;

(function () {
  const addPlayerBtn = document.querySelector(".addplayer");
  const removePlayerBtn = document.querySelector(".removeplayer");
  const startBtn = document.querySelector(".main > button");

  function updateRemoveState() {
    if (!removePlayerBtn) return;
    const rows = document.querySelectorAll(".entername");
    const atMin = rows.length <= MIN_PLAYERS;
    removePlayerBtn.setAttribute("aria-disabled", atMin ? "true" : "false");
  }

  addPlayerBtn.addEventListener("click", () => {
    const rows = document.querySelectorAll(".entername");
    if (rows.length >= MAX_PLAYERS) return;

    const newRow = rows[0].cloneNode(true);
    newRow.querySelector("input").value = "";
    addPlayerBtn.parentNode.insertBefore(newRow, addPlayerBtn);
    updateRemoveState();
  });

  if (removePlayerBtn) {
    removePlayerBtn.addEventListener("click", () => {
      const rows = document.querySelectorAll(".entername");
      if (rows.length <= MIN_PLAYERS) return; // always keep at least 2 players
      rows[rows.length - 1].remove();
      updateRemoveState();
    });
  }

  updateRemoveState();

  startBtn.addEventListener("click", () => {
    const names = Array.from(document.querySelectorAll(".entername input"))
      .map((input) => input.value.trim())
      .filter(Boolean);

    if (names.length < 2) {
      alert("Add at least 2 players to begin.");
      return;
    }

    localStorage.setItem("mansionPlayers", JSON.stringify(names));
    localStorage.removeItem("mansionGame"); // start a fresh board for this group
    location.href = "board.html";
  });
})();
