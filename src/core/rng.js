export class RNG {
  constructor(seed = Date.now() >>> 0) {
    this._state = seed >>> 0;
  }
  nextU32() {
    let x = this._state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this._state = x >>> 0;
    return this._state;
  }
  nextFloat() {
    return (this.nextU32() >>> 8) / (1 << 24);
  }
  range(min, max) {
    return min + (max - min) * this.nextFloat();
  }
  int(min, maxInclusive) {
    return Math.floor(this.range(min, maxInclusive + 1));
  }
}
