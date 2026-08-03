/**
 * Deterministic UUID for idempotency keys: the same card in the same batch
 * always produces the same key, so a retry after a timeout can never create a
 * second decision row.
 */
export function deterministicUuid(input: string): string {
  const hex: string[] = [];
  let h1 = 0x811c9dc5;
  for (let round = 0; round < 4; round += 1) {
    let h = h1 ^ (round * 0x9e3779b9);
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i) + round;
      h = Math.imul(h, 16777619) >>> 0;
    }
    h1 = h;
    hex.push(h.toString(16).padStart(8, '0'));
  }

  const raw = hex.join('');
  // Format as a version 4 UUID so the database's uuid type accepts it.
  return [
    raw.slice(0, 8),
    raw.slice(8, 12),
    `4${raw.slice(13, 16)}`,
    `8${raw.slice(17, 20)}`,
    raw.slice(20, 32),
  ].join('-');
}
