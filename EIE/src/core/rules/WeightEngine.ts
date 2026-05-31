import { SeededRandom } from './SeededRandom.ts';

export interface WeightedItem<T> {
  item: T;
  weight: number;
}

export interface WeightSelection<T> {
  item: T;
  weight: number;
  totalWeight: number;
  threshold: number;
}

export class WeightEngine {
  private readonly random: SeededRandom;

  constructor(random: SeededRandom) {
    this.random = random;
  }

  pick<T>(items: WeightedItem<T>[]): WeightSelection<T> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('WeightEngine.pick requires at least one item.');
    }

    const selectable = items.filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0);
    if (selectable.length === 0) {
      throw new Error('WeightEngine.pick requires at least one item with weight > 0.');
    }

    const totalWeight = selectable.reduce((sum, entry) => sum + entry.weight, 0);
    const threshold = this.random.nextFloat() * totalWeight;
    let cursor = 0;

    for (const entry of selectable) {
      cursor += entry.weight;
      if (threshold < cursor) {
        return {
          item: entry.item,
          weight: entry.weight,
          totalWeight,
          threshold,
        };
      }
    }

    const fallback = selectable[selectable.length - 1];
    return {
      item: fallback.item,
      weight: fallback.weight,
      totalWeight,
      threshold,
    };
  }
}
