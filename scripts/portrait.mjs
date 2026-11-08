// Gera o retrato low-poly de uma pessoa a partir de uma foto.
//
// Uso: npm run portrait -- foto.jpg slug [--zoom 1.25] [--eq 0.5] [--points 800] [--seed 1]
//   --zoom    aproxima a partir do centro (1 = foto inteira no quadro 3:4)
//   --eq      equalização de contraste, de 0 (nenhuma) a 1 (total)
//   --points  quantidade de pontos (cada ponto vira uns 2 triângulos)
//   --seed    semente do sorteio dos pontos (mesma semente = mesmo desenho)
//
// Saída: public/portraits/<slug>.svg, 300×400, com 7 tons que misturam --portrait-ink e
// --portrait-paper. O <Portrait> pinta esses tons pela raridade (ver lib/portrait.ts).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Delaunator from "delaunator";
import sharp from "sharp";

const W = 300;
const H = 400;
const LEVELS = [16, 30, 44, 58, 72, 86, 100];

function parseArgs(argv) {
  const positional = [];
  const flags = { zoom: 1, eq: 0.5, points: 800, seed: 1 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (!(key in flags)) throw new Error(`opção desconhecida: ${arg}`);
      const value = Number(argv[++i]);
      if (!Number.isFinite(value)) throw new Error(`valor inválido pra ${arg}`);
      flags[key] = value;
    } else {
      positional.push(arg);
    }
  }
  const [input, slug] = positional;
  if (!input || !slug) throw new Error("uso: npm run portrait -- foto.jpg slug [--zoom 1.25] [--eq 0.5] [--points 800]");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("o slug só pode ter a-z, 0-9 e hífen (o mesmo id de content/people.ts)");
  if (flags.zoom < 1) throw new Error("--zoom precisa ser 1 ou mais");
  flags.eq = Math.min(1, Math.max(0, flags.eq));
  flags.points = Math.max(50, Math.round(flags.points));
  return { input, slug, ...flags };
}

/** Foto em tons de cinza, recortada em 3:4 e aproximada a partir do centro. */
async function loadGray(input, zoom) {
  const bigW = Math.round(W * zoom);
  const bigH = Math.round(H * zoom);
  const { data } = await sharp(input)
    .rotate()
    .resize(bigW, bigH, { fit: "cover", position: "attention" })
    .extract({ left: Math.round((bigW - W) / 2), top: Math.round((bigH - H) / 2), width: W, height: H })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Float64Array.from(data);
}

function equalize(gray, strength) {
  if (strength === 0) return gray;
  const hist = new Array(256).fill(0);
  for (const v of gray) hist[Math.round(v)]++;
  const cdf = [];
  let acc = 0;
  for (const h of hist) cdf.push((acc += h));
  const min = cdf.find((c) => c > 0);
  const span = Math.max(1, gray.length - min);
  return gray.map((v) => {
    const eq = ((cdf[Math.round(v)] - min) / span) * 255;
    return v * (1 - strength) + eq * strength;
  });
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sorteia pontos com mais densidade onde há bordas (olhos, boca, contorno). */
function samplePoints(gray, count, random) {
  const at = (x, y) => gray[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const weight = new Float64Array(W * H);
  let total = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      const w = Math.pow(Math.hypot(gx, gy), 0.7) + 4;
      weight[y * W + x] = w;
      total += w;
    }
  }
  const cumulative = new Float64Array(W * H);
  let acc = 0;
  for (let i = 0; i < weight.length; i++) cumulative[i] = acc += weight[i];

  const points = [];
  for (let n = 0; n < count; n++) {
    const target = random() * total;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    points.push([(lo % W) + random() - 0.5, Math.floor(lo / W) + random() - 0.5]);
  }
  // Moldura: garante que os triângulos cobrem o quadro todo.
  for (let x = 0; x <= W; x += 25) points.push([x, 0], [x, H]);
  for (let y = 25; y < H; y += 25) points.push([0, y], [W, y]);
  return points.map(([x, y]) => [Math.min(W, Math.max(0, x)), Math.min(H, Math.max(0, y))]);
}

/** Luminância média do triângulo (vértices, meio das arestas e centro). */
function triangleLuma(gray, a, b, c) {
  const samples = [a, b, c, mid(a, b), mid(b, c), mid(c, a), [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]];
  let sum = 0;
  for (const [x, y] of samples) {
    const xi = Math.min(W - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(H - 1, Math.max(0, Math.round(y)));
    sum += gray[yi * W + xi];
  }
  return sum / samples.length;
}

function mid(p, q) {
  return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
}

const fmt = (n) => String(Math.round(n * 10) / 10);

function toSvg(groups) {
  const mix = (pct) => `color-mix(in srgb, var(--portrait-ink, #241C17) ${pct}%, var(--portrait-paper, #F4EDE0))`;
  const body = LEVELS.map((pct, i) => {
    const polygons = groups[i].map((tri) => `<polygon points="${tri.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ")}"/>`);
    return `<g style="fill:${mix(pct)};stroke:${mix(pct)}">${polygons.join("")}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" stroke-width="0.6" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

async function main() {
  const { input, slug, zoom, eq, points, seed } = parseArgs(process.argv.slice(2));
  const gray = equalize(await loadGray(input, zoom), eq);
  const pts = samplePoints(gray, points, mulberry32(seed));
  const { triangles } = Delaunator.from(pts);

  const groups = LEVELS.map(() => []);
  for (let i = 0; i < triangles.length; i += 3) {
    const tri = [pts[triangles[i]], pts[triangles[i + 1]], pts[triangles[i + 2]]];
    const darkness = 1 - triangleLuma(gray, ...tri) / 255;
    groups[Math.min(LEVELS.length - 1, Math.max(0, Math.round(darkness * (LEVELS.length - 1))))].push(tri);
  }

  const dir = join(process.cwd(), "public", "portraits");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${slug}.svg`);
  const svg = toSvg(groups);
  writeFileSync(out, svg);
  console.log(`${out}: ${triangles.length / 3} triângulos, ${(svg.length / 1024).toFixed(0)} KB`);
  console.log(`no content/people.ts: portraitUrl: "/portraits/${slug}.svg"`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
