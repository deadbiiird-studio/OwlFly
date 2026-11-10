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
    const numericScore = Number(score) || 0;
    const numericBest = Number(best) || 0;
    const isBest = numericScore >= numericBest && numericScore > 0;

    this.el.classList.remove("hidden");

    this.el.innerHTML = `
      <div
        class="panel overPanel sacredMenu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameOverTitle"
        aria-describedby="gameOverSummary"
      >
        <div class="menuHero overHero">
          <div class="eyebrow">FLIGHT COMPLETE</div>
          <h2 class="title overTitle" id="gameOverTitle">
            ${isBest ? "New Best Flight" : "Flight Ended"}
          </h2>
          <p class="sub" id="gameOverSummary">
            ${isBest
              ? "A new line in the night sky."
              : "The route is ready when you are."}
          </p>
        </div>

        <div class="scoreStrip" aria-label="Flight results">
          <div class="scoreCard major ${isBest ? "scoreCard--best" : ""}">
            <div class="scoreLabel">Flight</div>
            <div class="scoreValue">${numericScore}</div>
            ${isBest ? '<div class="scoreMeta">NEW BEST</div>' : ""}
          </div>
          <div class="scoreCard">
            <div class="scoreLabel">Best</div>
            <div class="scoreValue">${numericBest}</div>
          </div>
        </div>

        ${
          themeList.length || earnedList.length
            ? `
          <div class="settings compact resultUnlocks" aria-label="New unlocks">
            <div class="settingsTitle">Unlocked this flight</div>
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

        <div class="row wideRow resultActions">
          <button class="primary big wideBtn" id="restartBtn" type="button" autofocus>
            Fly Again
          </button>
        </div>

        <div class="row wideRow compactRow">
          <button id="menuBtn" type="button">Return to Gate</button>
        </div>
      </div>
    `;

    const restartBtn = this.el.querySelector("#restartBtn");
    const menuBtn = this.el.querySelector("#menuBtn");

    restartBtn?.addEventListener("click", onRestart);
    menuBtn?.addEventListener("click", onMenu);

    requestAnimationFrame(() => restartBtn?.focus({ preventScroll: true }));
  }

  hide() {
    this.el.classList.add("hidden");
    this.el.innerHTML = "";
  }
}
