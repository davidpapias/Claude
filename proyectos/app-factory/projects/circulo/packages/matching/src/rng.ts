/**
 * Deterministic RNG. The same seed always produces the same ordering, which is
 * what makes recommendation batches reproducible and testable.
 */

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough for exploration jitter. */
export function createRng(seed: string): () => number {
  let a = hashString(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Per-pair jitter: stable for a (seed, viewer, candidate) triple. */
export function pairJitter(seed: string, viewerId: string, candidateId: string): number {
  return createRng(`${seed}:${viewerId}:${candidateId}`)();
}
