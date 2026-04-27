import { OBSTACLE } from "../../../core/constants.js";

export function updateObstaclePairMotion(obstacle, dt) {
  if (!obstacle.active) return;

  obstacle.x -= obstacle.speed * dt;

  if (obstacle.x + OBSTACLE.WIDTH < -40) {
    obstacle.despawn();
  }
}
