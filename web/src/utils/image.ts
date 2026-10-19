export function dimensionsFor(
  aspect: string,
  resolution: string
): { width: number; height: number } {
  const base = resolution === '4K' ? 2048 : resolution === '2K' ? 1536 : 1024
  const [rw, rh] = aspect.split(':').map(Number)
  if (!rw || !rh) return { width: base, height: base }
  if (rw >= rh)
    return { width: base, height: Math.round((base * rh) / rw / 8) * 8 }
  return { width: Math.round((base * rw) / rh / 8) * 8, height: base }
}

export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Deterministic demo artwork (SVG data URI) */
export function demoImage(
  prompt: string,
  seed: number,
  width: number,
  height: number
): string {
  const h = hashSeed(`${prompt}|${seed}`)
  const hueA = 152 + (h % 28) - 14
  const hueB = 38 + (h % 40)
  const cx = 18 + (h % 60)
  const cy = 22 + ((h >> 4) % 50)
  const label = prompt.trim().slice(0, 42) || 'Untitled'
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>` +
    `<rect width='100%' height='100%' fill='hsl(${hueA} 32% 14%)'/>` +
    `<circle cx='${(cx / 100) * width}' cy='${(cy / 100) * height}' r='${width * 0.28}' fill='hsl(${hueA} 72% 42%)' opacity='0.9'/>` +
    `<circle cx='${width * 0.78}' cy='${height * 0.72}' r='${width * 0.2}' fill='hsl(${hueB} 78% 58%)' opacity='0.85'/>` +
    `<rect x='${width * 0.08}' y='${height * 0.78}' width='${width * 0.84}' height='2' fill='hsl(${hueA} 40% 70%)' opacity='0.5'/>` +
    `<text x='${width * 0.08}' y='${height * 0.88}' font-family='sans-serif' font-size='${Math.max(16, width * 0.022)}' fill='#edf5f2'>${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` +
    `<text x='${width * 0.08}' y='${height * 0.93}' font-family='monospace' font-size='${Math.max(12, width * 0.016)}' fill='#8fa5a0'>DEMO PREVIEW · seed ${seed}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
