// app/lib/scoring.ts
import type { ClipCandidate } from "./clips";

export type ScoredClip = ClipCandidate & { score: number };

export function scoreClip(c: ClipCandidate): number {
  const text = c.text.toLowerCase();

  const hookWords = [
    "como", "por que", "porque", "segredo", "ninguém", "verdade", "mentira",
    "erro", "pare", "nunca", "sempre", "dica", "truque", "rápido", "simples",
    "melhor", "pior", "de graça", "atenção", "olha isso"
  ];

  const fillerStart = ["bom", "então", "tipo", "é", "ahn", "hã", "mano", "cara"];
  const firstWords = text.split(/\s+/).slice(0, 4).join(" ");

  let score = 0;

  // duração ideal ~35s (muito curto ou muito longo perde)
  score += bell(c.duration, 35, 12) * 30;

  // hooks
  score += countHits(text, hookWords) * 4;

  // perguntas e exclamações
  score += (c.text.match(/\?/g)?.length ?? 0) * 6;
  score += (c.text.match(/!/g)?.length ?? 0) * 4;

  // números chamam atenção
  score += (c.text.match(/\d+/g)?.length ?? 0) * 4;

  // densidade de fala (conteúdo por segundo)
  const words = c.text.trim().split(/\s+/).filter(Boolean).length;
  const wps = words / Math.max(1, c.duration);
  score += clamp(wps, 1.2, 3.2) * 8;

  // penaliza começo enrolado
  if (fillerStart.some(w => firstWords.startsWith(w))) score -= 10;

  // penaliza texto muito pequeno
  if (words < 30) score -= 10;

  return round2(score);
}

export function pickTopClips(clips: ClipCandidate[], topN = 8): ScoredClip[] {
  const scored = clips
    .map(c => ({ ...c, score: scoreClip(c) }))
    .sort((a, b) => b.score - a.score);

  // evita clipes quase iguais (muito sobrepostos)
  const chosen: ScoredClip[] = [];
  for (const c of scored) {
    if (chosen.length >= topN) break;

    const overlaps = chosen.some(x => overlapRatio(x.start, x.end, c.start, c.end) > 0.6);
    if (!overlaps) chosen.push(c);
  }

  return chosen;
}

function countHits(text: string, words: string[]) {
  let hits = 0;
  for (const w of words) if (text.includes(w)) hits++;
  return hits;
}

function overlapRatio(a1: number, a2: number, b1: number, b2: number) {
  const inter = Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  const minLen = Math.min(a2 - a1, b2 - b1);
  return minLen <= 0 ? 0 : inter / minLen;
}

// curva em sino (0..1) com pico no mean
function bell(x: number, mean: number, sd: number) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z);
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
