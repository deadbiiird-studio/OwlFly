import { OBSTACLE, DIFFICULTY, SPAWN } from "../core/constants.js";

export class Difficulty {
  constructor() {
    this.reset();
  }

  reset() {
    this.time = 0;
    this.speed = OBSTACLE.BASE_SPEED;
    this.gap = Math.round((OBSTACLE.MIN_GAP + OBSTACLE.MAX_GAP) / 2);
    this.spawnInterval = SPAWN.BASE_INTERVAL;
  }

  update(dt) {
    this.time += dt;

    this.speed = Math.min(
      OBSTACLE.SPEED_MAX,
      OBSTACLE.BASE_SPEED + DIFFICULTY.SPEED_RAMP_PER_SEC * this.time
    );

    this.gap = Math.max(
      OBSTACLE.MIN_GAP,
      Math.round(
        ((OBSTACLE.MIN_GAP + OBSTACLE.MAX_GAP) / 2) -
          DIFFICULTY.GAP_SHRINK_PER_SEC * this.time
      )
    );

    this.spawnInterval = Math.max(
      SPAWN.MIN_INTERVAL,
      SPAWN.BASE_INTERVAL - DIFFICULTY.INTERVAL_SHRINK_PER_SEC * this.time
    );
  }
}