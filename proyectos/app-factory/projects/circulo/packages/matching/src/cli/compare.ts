/**
 * Internal tool: compare two profiles and show exactly why the algorithm ranks
 * them the way it does.
 *
 *   pnpm --filter @circulo/matching compare              # built-in example pair
 *   pnpm --filter @circulo/matching compare a.json b.json
 *
 * Each JSON file must contain one `MatchingProfile`.
 */
import { readFileSync } from 'node:fs';
import type { MatchingProfile } from '@circulo/types';
import { filterCandidate } from '../filters.js';
import { scorePair } from '../scoring.js';
import { buildExplanations } from '../explanations.js';
import { distanceKm } from '../geo.js';
import { makeProfile, slots } from '../fixtures.js';

function load(path: string): MatchingProfile {
  return JSON.parse(readFileSync(path, 'utf8')) as MatchingProfile;
}

function bar(earned: number, max: number): string {
  const filled = max === 0 ? 0 : Math.round((earned / max) * 20);
  return `${'█'.repeat(filled)}${'·'.repeat(20 - filled)}`;
}

function main(): void {
  const [pathA, pathB] = process.argv.slice(2);

  const a = pathA
    ? load(pathA)
    : makeProfile({
        userId: 'ana',
        age: 29,
        intentions: ['new_in_city', 'close_friendship'],
        interests: ['cine', 'caminatas', 'cafe'],
        availability: slots([6, 'afternoon'], [0, 'morning'], [3, 'evening']),
        languages: ['es', 'en'],
      });

  const b = pathB
    ? load(pathB)
    : makeProfile({
        userId: 'beto',
        age: 33,
        intentions: ['new_in_city', 'expand_circle'],
        interests: ['cine', 'cafe', 'museos'],
        availability: slots([6, 'afternoon'], [0, 'morning']),
        languages: ['es'],
        location: { areaLabel: 'Condesa, CDMX', lat: 19.41, lon: -99.18 },
      });

  const blockedReason = filterCandidate(a, b);
  const { score, breakdown } = scorePair(a, b);
  const explanations = buildExplanations(a, b);

  console.log(`\n  ${a.userId}  ↔  ${b.userId}`);
  console.log(`  distancia aproximada: ${distanceKm(a.location, b.location).toFixed(1)} km\n`);

  console.log(`  filtros: ${blockedReason ? `EXCLUIDO (${blockedReason})` : 'pasa todos'}`);
  console.log(`  puntuación total: ${score.toFixed(1)} / 100\n`);

  for (const part of breakdown) {
    const label = part.component.padEnd(14);
    console.log(
      `  ${label} ${bar(part.earned, part.max)} ${part.earned.toFixed(1).padStart(5)} / ${part.max}`,
    );
  }

  console.log('\n  motivos mostrados al usuario:');
  if (explanations.length === 0) {
    console.log('    (ninguno — no se mostraría como recomendación)');
  }
  for (const explanation of explanations) {
    console.log(`    · ${explanation.text}   [${explanation.code}]`);
  }
  console.log();
}

main();
