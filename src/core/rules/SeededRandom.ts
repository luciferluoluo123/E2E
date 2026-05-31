export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = this.hashSeed(seed);
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  nextUint32(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state;
  }

  nextFloat(): number {
    return this.nextUint32() / 0x100000000;
  }

  fork(label: string): SeededRandom {
    return new SeededRandom(`${this.state}:${label}`);
  }

  private hashSeed(seed: string): number {
    let hash = 0x811c9dc5;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }
}

