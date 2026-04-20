export class GameOverUI {
  constructor(rootEl) {
    this.el = rootEl;
  }

  show({
    score,
    best,
    earned,
    unlockedThemes,
    onRestart,
    onMenu,
  }) {
    const earnedList = Array.isArray(earned) ? earned : [];
    const themeList = Array.isArray(unlockedThemes) ? unlockedThemes : [];
    const isBest = Number(score) >= Number(best) && Number(score) > 0;

    this.el.classList.remove("hidden");

    this.el.innerHTML = `
      <div class="panel overPanel sacredMenu">
        <div class="menuHero overHero">
          <div class="eyebrow">SKY FRACTURED</div>
          <h2 class="title overTitle">
            ${isBest ? "New Best Flight" : "Flight Ended"}
          </h2>
          <p class="sub">
            ${isBest
              ? "You pushed beyond your limit."
              : "Breach higher next flight."}
          </p>
        </div>

        <div class="scoreStrip">
          <div class="scoreCard major">
            <div class="scoreLabel">Flight</div>
            <div class="scoreValue">${score}</div>
          </div>
          <div class="scoreCard">
            <div class="scoreLabel">Best</div>
            <div class="scoreValue">${best}</div>
          </div>
        </div>

        ${
          themeList.length || earnedList.length
            ? `
          <div class="settings compact">
            <div class="settingsTitle">Unlocked</div>
            ${
              themeList.length
                ? `
              <div class="unlockRow">
                <div class="unlockTitle">✨ Themes</div>
                <div class="unlockList">${themeList
                  .map((t) => `<span class="chip">${t.name}</span>`)
                  .join("")}</div>
              </div>
            `
                : ""
            }
            ${
              earnedList.length
                ? `
              <div class="unlockRow">
                <div class="unlockTitle">🏆 Achievements</div>
                <div class="unlockList">${earnedList
                  .map((a) => `<span class="chip">${a.title}</span>`)
                  .join("")}</div>
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }

        <div class="row wideRow">
          <button class="primary big wideBtn" id="restartBtn">Fly Again</button>
        </div>

        <div class="row wideRow compactRow">
          <button id="menuBtn">Return to Gate</button>
        </div>
      </div>
    `;

    this.el.querySelector("#restartBtn")?.addEventListener("click", onRestart);
    this.el.querySelector("#menuBtn")?.addEventListener("click", onMenu);
  }

  hide() {
    this.el.classList.add("hidden");
    this.el.innerHTML = "";
  }
}