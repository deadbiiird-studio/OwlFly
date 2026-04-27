export function obstacleClampToAvailable(target, available) {
  return Math.max(0, Math.min(target, available));
}

export function obstacleClampIndex(value, max) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.max(0, Math.min(max - 1, value | 0));
}

export function obstacleHash01(value, salt = 0) {
  const x = Math.sin(value * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function obstacleClampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
