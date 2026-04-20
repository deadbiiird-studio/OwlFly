export function aabbIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function circleAabbIntersect(cx, cy, r, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

export function forgivingCircleAabbIntersect(cx, cy, r, rect, forgiveness = 0.92) {
  const rr = Math.max(1, r * forgiveness);
  return circleAabbIntersect(cx, cy, rr, rect);
}

export function resolveHitSide(cx, cy, rect) {
  const left = Math.abs(cx - rect.x);
  const right = Math.abs(cx - (rect.x + rect.w));
  const top = Math.abs(cy - rect.y);
  const bottom = Math.abs(cy - (rect.y + rect.h));

  const min = Math.min(left, right, top, bottom);

  if (min === left) return "left";
  if (min === right) return "right";
  if (min === top) return "top";
  return "bottom";
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}