// Pixel-dust renderer for the lunar home page. Moon, dust, stars, water and the
// site title all share one ImageData buffer, so the title is literally made of
// the same pixels as the scene instead of sitting on a separate layer.

export type LunarTheme = 'dark' | 'light'
// `home` is the full hero; `page` is the quiet backdrop behind every other route.
export type LunarMode = 'home' | 'page'

type RGB = readonly [number, number, number]
type Vec3 = readonly [number, number, number]

type Palette = {
  light: boolean
  bg: RGB
  disc: RGB
  lit: RGB
  shade: RGB
  rim: RGB
  ink: RGB
  star: RGB
  water: RGB
}

type Crater = { u: number; v: number; r: number; depth: number }

const PALETTES: Record<LunarTheme, Palette> = {
  dark: {
    light: false,
    bg: [8, 8, 11],
    disc: [13, 13, 17],
    lit: [234, 236, 244],
    shade: [62, 66, 84],
    rim: [176, 208, 255],
    ink: [238, 239, 246],
    star: [196, 200, 218],
    water: [5, 7, 12],
  },
  light: {
    light: true,
    bg: [245, 244, 239],
    disc: [238, 237, 231],
    lit: [138, 138, 146],
    shade: [26, 26, 32],
    rim: [64, 84, 132],
    ink: [26, 26, 32],
    star: [110, 110, 120],
    water: [236, 236, 231],
  },
}

const MAX_BUFFER_PIXELS = 1_600_000
const MAX_TITLE_PARTICLES = 40_000
const POINTER_RADIUS = 64
const TAU = Math.PI * 2
// Ordered dithering keeps the title crisp instead of TV-static noisy.
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

function hash(value: number) {
  let t = value >>> 0
  t = Math.imul(t ^ (t >>> 16), 2146121005)
  t = Math.imul(t ^ (t >>> 15), 2221713035)
  return ((t ^ (t >>> 16)) >>> 0) / 4294967296
}

function pixelHash(x: number, y: number, seed: number) {
  return hash(Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ seed)
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function normalize(x: number, y: number, z: number): Vec3 {
  const length = Math.hypot(x, y, z) || 1
  return [x / length, y / length, z / length]
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = pixelHash(xi, yi, 0x51ed)
  const b = pixelHash(xi + 1, yi, 0x51ed)
  const c = pixelHash(xi, yi + 1, 0x51ed)
  const d = pixelHash(xi + 1, yi + 1, 0x51ed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number) {
  return (
    valueNoise(x, y) * 0.55 +
    valueNoise(x * 2.03, y * 2.03) * 0.3 +
    valueNoise(x * 4.1, y * 4.1) * 0.15
  )
}

function makeCraters(count: number, seed: number, minRadius: number, maxRadius: number): Crater[] {
  const craters: Crater[] = []
  for (let i = 0; i < count; i++) {
    const angle = hash(seed + i * 3) * TAU
    const distance = Math.sqrt(hash(seed + i * 3 + 1)) * 0.95
    const size = hash(seed + i * 3 + 2)
    craters.push({
      u: Math.cos(angle) * distance,
      v: Math.sin(angle) * distance,
      r: minRadius + Math.pow(size, 3.2) * (maxRadius - minRadius),
      depth: 0.6 + hash(seed + i * 7) * 0.4,
    })
  }
  return craters
}

// Writes the moon's static frame (flat disc, lit rim, halo) into an RGBA buffer;
// the disc's grain is painted separately so it can flicker in place.
function renderMoon(
  target: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  light: Vec3,
  palette: Palette,
  craters: Crater[],
  /** Per-pixel shading out (0 = outside disc, 1..255 = brightness). */
  shadeOut: Uint8Array
) {
  // Halo size is capped so a huge limb doesn't fog the whole screen.
  const haloScale = Math.min(radius, 170)
  const pad = Math.min(radius * 0.5, haloScale * 0.5)
  const x0 = Math.max(0, Math.floor(cx - radius - pad))
  const x1 = Math.min(width, Math.ceil(cx + radius + pad))
  const y0 = Math.max(0, Math.floor(cy - radius - pad))
  const y1 = Math.min(height, Math.ceil(cy + radius + pad))
  if (x1 <= x0 || y1 <= y0) return
  const boxWidth = x1 - x0
  const brightness = new Float32Array(boxWidth * (y1 - y0)).fill(-1)
  const [lx, ly, lz] = light
  const planar = Math.hypot(lx, ly) || 1

  for (let y = y0; y < y1; y++) {
    const dy = (y + 0.5 - cy) / radius
    for (let x = x0; x < x1; x++) {
      const dx = (x + 0.5 - cx) / radius
      const d2 = dx * dx + dy * dy
      if (d2 > 1) continue
      const nz = Math.sqrt(1 - d2)
      const lambert = dx * lx + dy * ly + nz * lz
      const maria = fbm(dx * 2.1 + 11.3, dy * 2.1 + 4.7)
      const albedo =
        (1 - 0.42 * smoothstep(0.5, 0.68, maria)) * (0.9 + 0.2 * valueNoise(dx * 16, dy * 16))
      const lit = lambert > 0 ? albedo * Math.pow(lambert, 0.75) : 0
      brightness[(y - y0) * boxWidth + (x - x0)] = Math.max(lit, albedo * 0.07)
    }
  }

  for (const crater of craters) {
    const ccx = cx + crater.u * radius
    const ccy = cy + crater.v * radius
    const cr = crater.r * radius
    if (cr < 1.5) continue
    // Foreshortening: craters near the limb squash along the radial direction.
    const centerDistance = Math.hypot(crater.u, crater.v)
    const tilt = Math.sqrt(Math.max(0.04, 1 - centerDistance * centerDistance))
    const radialX = centerDistance > 0 ? crater.u / centerDistance : 1
    const radialY = centerDistance > 0 ? crater.v / centerDistance : 0
    const reach = cr * 1.3
    const cx0 = Math.max(x0, Math.floor(ccx - reach))
    const cx1 = Math.min(x1, Math.ceil(ccx + reach))
    const cy0 = Math.max(y0, Math.floor(ccy - reach))
    const cy1 = Math.min(y1, Math.ceil(ccy + reach))
    for (let y = cy0; y < cy1; y++) {
      for (let x = cx0; x < cx1; x++) {
        const index = (y - y0) * boxWidth + (x - x0)
        if (brightness[index] < 0) continue
        const ox = x + 0.5 - ccx
        const oy = y + 0.5 - ccy
        const distance = Math.hypot(ox, oy)
        const radial = (ox * radialX + oy * radialY) / tilt
        const tangential = -ox * radialY + oy * radialX
        const q = Math.hypot(radial, tangential) / cr
        if (q > 1.3) continue
        const facing = distance > 0 ? (ox * lx + oy * ly) / (distance * planar) : 0
        const factor =
          q < 1
            ? 0.84 + 0.1 * q * q - 0.45 * facing * smoothstep(0.3, 1, q) * crater.depth
            : 1 + 0.24 * facing * (1 - (q - 1) / 0.3) * crater.depth
        brightness[index] *= Math.max(0.2, factor)
      }
    }
  }

  for (let y = y0; y < y1; y++) {
    const dy = (y + 0.5 - cy) / radius
    for (let x = x0; x < x1; x++) {
      const dx = (x + 0.5 - cx) / radius
      const index = (y * width + x) * 4
      const noise = pixelHash(x, y, 0x3c6e)
      const value = brightness[(y - y0) * boxWidth + (x - x0)]
      if (value >= 0) {
        const b = Math.min(1, value)
        shadeOut[y * width + x] = 1 + b * 254
        const edge = 1 - Math.sqrt(dx * dx + dy * dy)
        if (edge * radius < 1.4 && dx * lx + dy * ly > 0.08) {
          writePixel(target, index, palette.rim, 1)
          continue
        }
        writePixel(target, index, palette.disc, 1)
        continue
      }
      const distance = Math.sqrt(dx * dx + dy * dy)
      const outside = distance - 1
      if (outside > 0.5) continue
      const litSide = clamp01(0.45 + ((dx * lx + dy * ly) / distance) * 0.7 + lz * 0.4)
      const gap = outside * radius
      const glow =
        litSide *
        (0.5 * Math.exp(-gap / 3) +
          0.16 * Math.exp(-gap / (haloScale * 0.07)) +
          0.05 * Math.exp(-gap / (haloScale * 0.22)))
      if (noise < glow) {
        blendPixel(
          target,
          index,
          noise < glow * 0.3 ? palette.rim : palette.ink,
          0.3 + 0.5 * litSide
        )
      }
    }
  }
}

function mixColor(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function writePixel(data: Uint8ClampedArray, index: number, color: RGB, alpha: number, tone = 1) {
  data[index] = color[0] * tone
  data[index + 1] = color[1] * tone
  data[index + 2] = color[2] * tone
  data[index + 3] = alpha * 255
}

// Straight-alpha "over" for sprite buffers that start transparent.
function blendPixel(data: Uint8ClampedArray, index: number, color: RGB, alpha: number) {
  const existing = data[index + 3] / 255
  const out = alpha + existing * (1 - alpha)
  if (out <= 0) return
  const keep = (existing * (1 - alpha)) / out
  const add = alpha / out
  data[index] = data[index] * keep + color[0] * add
  data[index + 1] = data[index + 1] * keep + color[1] * add
  data[index + 2] = data[index + 2] * keep + color[2] * add
  data[index + 3] = out * 255
}

// Straight-alpha "over" into the transparent particle layer.
function plot(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  color: RGB,
  alpha: number
) {
  // Round, not truncate: settling particles hover around integer homes.
  const ix = Math.floor(x + 0.5)
  const iy = Math.floor(y + 0.5)
  if (ix < 0 || iy < 0 || ix >= width || iy >= height || alpha <= 0.015) return
  const index = (iy * width + ix) * 4
  const a = alpha > 1 ? 1 : alpha
  const under = data[index + 3] / 255
  const out = a + under * (1 - a)
  const k = a / out
  data[index] += (color[0] - data[index]) * k
  data[index + 1] += (color[1] - data[index + 1]) * k
  data[index + 2] += (color[2] - data[index + 2]) * k
  data[index + 3] = out * 255
}

type Layout = {
  horizonStart: { x: number; y: number }
  horizonEnd: { x: number; y: number }
  moonFrom: { x: number; y: number; r: number }
  moonTo: { x: number; y: number; r: number }
  titleSize: number
  titleAlong: number
}

// Composition in CSS pixels: a moon top-left, a diagonal sea bottom-right.
function sceneLayout(width: number, height: number, mode: LunarMode): Layout {
  const minSide = Math.min(width, height)
  if (mode === 'page') {
    const mobile = width < 640
    const moon = mobile ? { x: 46, y: 46, r: 26 } : { x: 66, y: 64, r: 34 }
    return {
      horizonStart: { x: width * (mobile ? 0.45 : 0.64), y: height },
      horizonEnd: { x: width, y: height * (mobile ? 0.82 : 0.62) },
      moonFrom: moon,
      moonTo: moon,
      titleSize: 0,
      titleAlong: 0,
    }
  }
  if (width < 640) {
    return {
      horizonStart: { x: 0, y: height * 0.9 },
      horizonEnd: { x: width, y: height * 0.56 },
      moonFrom: { x: width * 0.12, y: height * 0.07, r: width * 0.62 },
      moonTo: { x: width * 0.72, y: height * 0.16, r: width * 0.2 },
      titleSize: width * 0.075,
      titleAlong: 0.55,
    }
  }
  return {
    horizonStart: { x: width * 0.28, y: height },
    horizonEnd: { x: width, y: height * 0.36 },
    moonFrom: { x: width * 0.1, y: height * 0.1, r: Math.max(200, minSide * 0.46) },
    moonTo: { x: width * 0.8, y: height * 0.2, r: Math.min(170, Math.max(80, minSide * 0.15)) },
    titleSize: Math.min(76, Math.max(34, Math.min(width * 0.05, height * 0.075))),
    titleAlong: 0.58,
  }
}

// Waxing gibbous lit toward the sea, filling to a full moon as you scroll.
const LIGHT_FROM = normalize(Math.cos(0.55) * 0.95, Math.sin(0.55) * 0.95, 0.12)
const LIGHT_TO = normalize(0.1, -0.12, 0.99)
const RIPPLE_SLOTS = 12
// Disc grain re-rolls one bucket per frame tick, so every pixel changes colour
// roughly every BUCKETS ticks without the pixels themselves ever moving.
const SURFACE_BUCKETS = 90
const SURFACE_TICK_MS = 1000 / 60
// Phase drift (0..1) that forces a full grain repaint instead of waiting for re-rolls.
const SURFACE_PHASE_STEP = 0.02
const RIPPLE_LIFE = 2600
// Ripples are circles on a tilted water plane, so they squash along the sea normal.
const RIPPLE_SQUASH = 0.5
const TITLE_TEXT = "BU44ER'S BLOG"

export type LunarScene = {
  setExcited(excited: boolean): void
  destroy(): void
}

export type LunarLayers = {
  /** Static sky, stars and sea; painted once per resize. */
  base: HTMLCanvasElement
  /** Positioned/scaled with CSS transforms (compositor-only) as the moon moves. */
  moon: HTMLElement
  moonFrom: HTMLCanvasElement
  /** Cross-faded in with CSS opacity as the phase fills. */
  moonTo: HTMLCanvasElement
  /** Disc grain: fixed pixels whose colours flicker; shares the moon's transform. */
  moonSurface: HTMLCanvasElement
  /** Transparent per-frame layer: dust, stars, glitter, ripples, title. */
  particles: HTMLCanvasElement
}

export function createLunarScene({
  layers,
  host,
  moonHost,
  theme,
  mode,
}: {
  layers: LunarLayers
  /** Receives static layout variables (sea angle, subtitle anchor, ready flag). */
  host: HTMLElement
  /**
   * Receives the per-frame --moon-* variables. Keep this a small subtree: writing
   * them on <html> would restyle the whole document every frame.
   */
  moonHost: HTMLElement
  theme: LunarTheme
  mode: LunarMode
}): LunarScene {
  const context = layers.particles.getContext('2d')
  const baseContext = layers.base.getContext('2d')
  const fromContext = layers.moonFrom.getContext('2d')
  const toContext = layers.moonTo.getContext('2d')
  const surfaceContext = layers.moonSurface.getContext('2d')
  if (!context || !baseContext || !fromContext || !toContext || !surfaceContext)
    return { setExcited() {}, destroy() {} }
  const palette = PALETTES[theme]
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const craters = makeCraters(52, 131, 0.018, 0.17)

  let cssWidth = 0
  let cssHeight = 0
  let scale = 1
  let width = 0
  let height = 0
  let layout = sceneLayout(1, 1, mode)
  let base = new Uint8ClampedArray(0)
  let image: ImageData | null = null

  // Sea frame in buffer pixels: origin on the horizon, u along it, n into the water.
  let seaX = 0
  let seaY = 0
  let ux = 1
  let uy = 0
  let nx = 0
  let ny = 1
  let seaAngle = 0
  let seaMaxDepth = 1

  // Two full-size moon sprites live in their own canvases; moving, scaling and the
  // phase crossfade are CSS transform/opacity, so the moon costs no CPU per frame.
  let spriteSize = 0
  let spriteRadius = 1
  // Continuous shading of both phases, sampled by the flickering disc grain.
  let shadeFrom = new Uint8Array(0)
  let shadeTo = new Uint8Array(0)
  let lastMoonLayer = ''
  let mx = 0
  let my = 0
  let mr = 1
  let phase = 0
  let lastCssMoon = ''

  let dustCount = 0
  let dustTheta = new Float32Array(0)
  let dustFrac = new Float32Array(0)
  let dustSpeed = new Float32Array(0)
  let dustCosI = new Float32Array(0)
  let dustCosN = new Float32Array(0)
  let dustSinN = new Float32Array(0)
  let dustPhase = new Float32Array(0)

  let sprayCount = 0
  let sprayAngle = new Float32Array(0)
  let sprayDistance = new Float32Array(0)
  let spraySpeed = new Float32Array(0)
  let sprayCurl = new Float32Array(0)
  let sprayLife = new Float32Array(0)
  let sprayRate = new Float32Array(0)

  // Disc grain (like omp.sh's hero field): each disc pixel keeps its place and is
  // re-rolled to a new tone, or to empty, whenever its bucket comes up.
  let surfaceImage: ImageData | null = null
  // Disc texels grouped by bucket: bucket k owns surfaceTexels[start[k]..start[k+1]).
  let surfaceTexels = new Int32Array(0)
  let surfaceBucketStart = new Int32Array(SURFACE_BUCKETS + 1)
  let surfaceBoxX = 0
  let surfaceBoxY = 0
  let surfaceBoxSize = 0
  let surfaceTick = 0
  let surfacePaintedPhase = -1

  let starCount = 0
  let starX = new Float32Array(0)
  let starY = new Float32Array(0)
  let starPhase = new Float32Array(0)

  let titleCount = 0
  let titleHomeX = new Float32Array(0)
  let titleHomeY = new Float32Array(0)
  let titleX = new Float32Array(0)
  let titleY = new Float32Array(0)
  let titleVX = new Float32Array(0)
  let titleVY = new Float32Array(0)
  let titleSeed = new Float32Array(0)
  let titleSeed2 = new Float32Array(0)
  let titleCenterX = 0
  let titleCenterY = 0
  let titleVersion = 0

  const rippleX = new Float32Array(RIPPLE_SLOTS)
  const rippleY = new Float32Array(RIPPLE_SLOTS)
  const rippleBirth = new Float64Array(RIPPLE_SLOTS).fill(-1e9)
  const activeX = new Float32Array(RIPPLE_SLOTS)
  const activeY = new Float32Array(RIPPLE_SLOTS)
  const activeFront = new Float32Array(RIPPLE_SLOTS)
  const activeAmp = new Float32Array(RIPPLE_SLOTS)
  let rippleNext = 0
  let lastRippleX = -1e5
  let lastRippleY = -1e5
  let lastRippleTime = 0

  let scroll = 0
  let scrollTarget = 0
  let excited = 0
  let excitedTarget = 0
  let pointerX = -1e5
  let pointerY = -1e5
  let frame: number | null = null
  let resizeTimer: number | null = null
  let lastTime = 0

  const seaDepth = (x: number, y: number) => (x - seaX) * nx + (y - seaY) * ny
  const seaAlong = (x: number, y: number) => (x - seaX) * ux + (y - seaY) * uy

  // Home: viewport heights scrolled. Page: reading progress (0..1), which drives the moon phase.
  const readScroll = () =>
    mode === 'home'
      ? window.scrollY / cssHeight
      : window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

  const updateMoon = () => {
    const e = mode === 'home' ? smoothstep(0, 1.1, scroll) : 0
    const { moonFrom: from, moonTo: to } = layout
    mx = (from.x + (to.x - from.x) * e) * scale
    my = (from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * cssHeight * 0.06) * scale
    mr = (from.r + (to.r - from.r) * e) * scale
    phase = mode === 'home' ? e : clamp01(scroll)
    const key = `${mx | 0},${my | 0},${mr | 0}`
    if (key === lastCssMoon) return
    lastCssMoon = key
    moonHost.style.setProperty('--moon-x', `${mx / scale}px`)
    moonHost.style.setProperty('--moon-y', `${my / scale}px`)
    moonHost.style.setProperty('--moon-r', `${mr / scale}px`)
    moonHost.style.setProperty('--moon-side', mx < width / 2 ? '1' : '-1')
  }

  const currentLight = (): Vec3 =>
    normalize(
      LIGHT_FROM[0] + (LIGHT_TO[0] - LIGHT_FROM[0]) * phase,
      LIGHT_FROM[1] + (LIGHT_TO[1] - LIGHT_FROM[1]) * phase,
      LIGHT_FROM[2] + (LIGHT_TO[2] - LIGHT_FROM[2]) * phase
    )

  const respawnSpray = (i: number, now: number, initial: boolean) => {
    const seed = (i * 2654435761 + Math.floor(now)) >>> 0
    const a = hash(seed ^ 0x9e37)
    const b = hash(seed ^ 0x85eb)
    const c = hash(seed ^ 0xc2b2)
    const light = currentLight()
    const spread = light[2] > 0.6 ? Math.PI : 1.5
    sprayAngle[i] = Math.atan2(light[1], light[0]) + (a - 0.5) * 2 * spread
    spraySpeed[i] = 0.012 * (0.4 + b) * scale
    sprayCurl[i] = (c - 0.35) * 0.00006
    sprayLife[i] = initial ? c : 0
    sprayRate[i] = 1 / (5000 + 9000 * c)
    sprayDistance[i] = initial ? sprayLife[i] * (spraySpeed[i] / sprayRate[i]) : 0
  }

  const buildParticles = () => {
    const area = Math.min(1.3, Math.max(0.45, (width * height) / 1_300_000))
    dustCount = Math.round((mode === 'home' ? 14000 : 5200) * area)
    dustTheta = new Float32Array(dustCount)
    dustFrac = new Float32Array(dustCount)
    dustSpeed = new Float32Array(dustCount)
    dustCosI = new Float32Array(dustCount)
    dustCosN = new Float32Array(dustCount)
    dustSinN = new Float32Array(dustCount)
    dustPhase = new Float32Array(dustCount)
    for (let i = 0; i < dustCount; i++) {
      const inclination = 1.25 + (hash(i * 5 + 2) - 0.5) * 0.7
      const node = -0.35 + (hash(i * 5 + 3) - 0.5) * 0.5
      dustFrac[i] = Math.pow(hash(i * 5 + 1), 2.4)
      dustTheta[i] = hash(i * 5 + 4) * TAU
      dustSpeed[i] = 0.00013 * (0.75 + 0.5 * hash(i * 5 + 5))
      dustCosI[i] = Math.cos(inclination)
      dustCosN[i] = Math.cos(node)
      dustSinN[i] = Math.sin(node)
      dustPhase[i] = hash(i * 11) * TAU
    }

    sprayCount = Math.round((mode === 'home' ? 3000 : 1400) * area)
    sprayAngle = new Float32Array(sprayCount)
    sprayDistance = new Float32Array(sprayCount)
    spraySpeed = new Float32Array(sprayCount)
    sprayCurl = new Float32Array(sprayCount)
    sprayLife = new Float32Array(sprayCount)
    sprayRate = new Float32Array(sprayCount)
    for (let i = 0; i < sprayCount; i++) respawnSpray(i, 0, true)

    const stars: number[] = []
    for (let i = 0; stars.length < 520 * area && i < 4000; i++) {
      const x = hash(i * 3 + 101) * width
      const y = hash(i * 3 + 102) * height
      if (seaDepth(x, y) < 0) stars.push(x, y)
    }
    starCount = stars.length / 2
    starX = new Float32Array(starCount)
    starY = new Float32Array(starCount)
    starPhase = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      starX[i] = stars[i * 2]
      starY[i] = stars[i * 2 + 1]
      starPhase[i] = hash(i * 3 + 103) * TAU
    }
  }

  const buildBase = () => {
    base = new Uint8ClampedArray(width * height * 4)
    const tint = (index: number, color: RGB, amount: number) => {
      base[index] += (color[0] - base[index]) * amount
      base[index + 1] += (color[1] - base[index + 1]) * amount
      base[index + 2] += (color[2] - base[index + 2]) * amount
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4
        const depth = seaDepth(x + 0.5, y + 0.5)
        const color = depth > 0 ? palette.water : palette.bg
        const grain = (pixelHash(x, y, 0x77) - 0.5) * (palette.light ? 7 : 5)
        base[index] = color[0] + grain
        base[index + 1] = color[1] + grain
        base[index + 2] = color[2] + grain
        base[index + 3] = 255
        if (depth <= 0) {
          if (pixelHash(x, y, 0x5a) < 0.0011)
            tint(index, palette.star, 0.25 + pixelHash(x, y, 0x5b) * 0.6)
          continue
        }
        if (depth < 1) {
          if (pixelHash(x, y, 0x1f) < 0.6) tint(index, palette.star, 0.55)
          continue
        }
        // Static ripple dashes run parallel to the horizon and thin out with depth.
        const fraction = depth / seaMaxDepth
        const along = seaAlong(x + 0.5, y + 0.5)
        const run = pixelHash(Math.floor(along / (4 + fraction * 10)), Math.floor(depth), 0x9d)
        if (run < 0.05 * (1 - fraction * 0.6))
          tint(index, palette.star, palette.light ? 0.18 : 0.12)
      }
    }
  }

  const buildSprites = () => {
    spriteRadius = layout.moonFrom.r * scale
    const pad = Math.min(spriteRadius * 0.5, 85)
    spriteSize = Math.ceil(2 * (spriteRadius + pad)) + 2
    const center = spriteSize / 2
    shadeFrom = new Uint8Array(spriteSize * spriteSize)
    shadeTo = new Uint8Array(spriteSize * spriteSize)
    for (const [target, light, ctx, shade] of [
      [layers.moonFrom, LIGHT_FROM, fromContext, shadeFrom],
      [layers.moonTo, LIGHT_TO, toContext, shadeTo],
    ] as const) {
      const pixels = new Uint8ClampedArray(spriteSize * spriteSize * 4)
      renderMoon(
        pixels,
        spriteSize,
        spriteSize,
        center,
        center,
        spriteRadius,
        light,
        palette,
        craters,
        shade
      )
      target.width = spriteSize
      target.height = spriteSize
      ctx.putImageData(new ImageData(pixels, spriteSize, spriteSize), 0, 0)
    }
    layers.moon.style.width = `${spriteSize / scale}px`
    layers.moon.style.height = `${spriteSize / scale}px`
    lastMoonLayer = ''

    // Grain canvas shares the sprite box; only interior texels are listed, leaving
    // the outer 1.4px to the sprites' lit rim.
    layers.moonSurface.width = spriteSize
    layers.moonSurface.height = spriteSize
    surfaceImage = new ImageData(spriteSize, spriteSize)
    surfaceBoxX = surfaceBoxY = Math.max(0, Math.floor(center - spriteRadius))
    surfaceBoxSize = Math.min(spriteSize - surfaceBoxX, Math.ceil(spriteRadius * 2) + 2)
    const inner = (spriteRadius - 1.4) ** 2
    const bucketOf = (texel: number) => (hash(texel ^ 0x85ebca6b) * SURFACE_BUCKETS) | 0
    const isGrain = (x: number, y: number, texel: number) =>
      shadeFrom[texel] !== 0 &&
      shadeTo[texel] !== 0 &&
      (x + 0.5 - center) ** 2 + (y + 0.5 - center) ** 2 < inner
    const counts = new Int32Array(SURFACE_BUCKETS + 1)
    const boxEnd = surfaceBoxX + surfaceBoxSize
    for (let y = surfaceBoxY; y < boxEnd; y++) {
      for (let x = surfaceBoxX; x < boxEnd; x++) {
        const texel = y * spriteSize + x
        if (isGrain(x, y, texel)) counts[bucketOf(texel) + 1]++
      }
    }
    for (let k = 0; k < SURFACE_BUCKETS; k++) counts[k + 1] += counts[k]
    surfaceBucketStart = counts.slice()
    surfaceTexels = new Int32Array(counts[SURFACE_BUCKETS])
    for (let y = surfaceBoxY; y < boxEnd; y++) {
      for (let x = surfaceBoxX; x < boxEnd; x++) {
        const texel = y * spriteSize + x
        if (isGrain(x, y, texel)) surfaceTexels[counts[bucketOf(texel)]++] = texel
      }
    }
    surfacePaintedPhase = -1
  }

  // Re-rolls every texel in one bucket for the generation that bucket is on at `tick`:
  // blank (disc shows through) or one of three tones, denser where the moon is lit.
  const paintSurfaceBucket = (data: Uint8ClampedArray, bucket: number, tick: number) => {
    const generation = Math.floor((tick + SURFACE_BUCKETS - bucket) / SURFACE_BUCKETS)
    const salt = Math.imul(generation, 0xc2b2ae35)
    const { shade, lit } = palette
    const end = surfaceBucketStart[bucket + 1]
    for (let k = surfaceBucketStart[bucket]; k < end; k++) {
      const texel = surfaceTexels[k]
      const from = shadeFrom[texel]
      const b = (from + (shadeTo[texel] - from) * phase - 1) / 254
      const probability = palette.light ? 0.035 + 0.8 * (1 - b) : 0.06 + 0.8 * Math.pow(b, 0.9)
      const roll = hash(Math.imul(texel, 0x9e3779b1) ^ salt)
      const index = texel * 4
      if (roll >= probability) {
        data[index + 3] = 0
        continue
      }
      const band = roll / probability
      const t = clamp01(b + (band < 0.35 ? 0.22 : band < 0.7 ? 0 : -0.22))
      const tone = palette.light ? 1 : 0.42 + 0.5 * t
      data[index] = (shade[0] + (lit[0] - shade[0]) * t) * tone
      data[index + 1] = (shade[1] + (lit[1] - shade[1]) * t) * tone
      data[index + 2] = (shade[2] + (lit[2] - shade[2]) * t) * tone
      data[index + 3] = 255
    }
  }

  const updateSurface = (time: number, animate: boolean) => {
    if (!surfaceImage) return
    const data = surfaceImage.data
    const tick = Math.floor(time / SURFACE_TICK_MS)
    if (surfacePaintedPhase < 0 || Math.abs(phase - surfacePaintedPhase) > SURFACE_PHASE_STEP) {
      if (animate) surfaceTick = tick
      for (let k = 0; k < SURFACE_BUCKETS; k++) paintSurfaceBucket(data, k, surfaceTick)
      surfacePaintedPhase = phase
    } else {
      if (!animate || tick <= surfaceTick) return
      // After a pause only catch up a few ticks; stale buckets refresh on their next turn.
      for (let t = Math.max(surfaceTick + 1, tick - 4); t <= tick; t++)
        paintSurfaceBucket(data, t % SURFACE_BUCKETS, t)
      surfaceTick = tick
    }
    surfaceContext.putImageData(
      surfaceImage,
      0,
      0,
      surfaceBoxX,
      surfaceBoxY,
      surfaceBoxSize,
      surfaceBoxSize
    )
  }

  const buildTitle = async () => {
    const version = ++titleVersion
    const family =
      getComputedStyle(document.documentElement).getPropertyValue('--font-exo-2').trim() ||
      'sans-serif'
    const font = (px: number) => `600 ${px}px ${family}`
    let size = layout.titleSize * scale
    try {
      await document.fonts.load(font(size), TITLE_TEXT)
    } catch {
      // Fall back to whatever font is available.
    }
    if (version !== titleVersion) return

    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    const ctx = offscreen.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const measure = () => {
      ctx.font = font(size)
      let total = 0
      for (const char of TITLE_TEXT) total += ctx.measureText(char).width + size * 0.14
      return total - size * 0.14
    }

    // Shrink until the tilted title box sits fully inside the water and the viewport.
    const { horizonStart: start, horizonEnd: end } = layout
    let textWidth = 0
    for (let attempt = 0; attempt < 10; attempt++) {
      textWidth = measure()
      const anchorX = (start.x + (end.x - start.x) * layout.titleAlong) * scale
      const anchorY = (start.y + (end.y - start.y) * layout.titleAlong) * scale
      titleCenterX = anchorX + nx * size * 1.2
      titleCenterY = anchorY + ny * size * 1.2
      let fits = true
      for (const [a, b] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        const x = titleCenterX + (ux * (a * textWidth)) / 2 + nx * (b * size) * 0.55
        const y = titleCenterY + (uy * (a * textWidth)) / 2 + ny * (b * size) * 0.55
        if (x < 12 || y < 12 || x > width - 12 || y > height - 12 || seaDepth(x, y) < size * 0.3)
          fits = false
      }
      if (fits) break
      size *= 0.9
    }

    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'alphabetic'
    ctx.translate(titleCenterX, titleCenterY)
    ctx.rotate(seaAngle)
    let cursor = -textWidth / 2
    for (const char of TITLE_TEXT) {
      ctx.fillText(char, cursor, size * 0.35)
      cursor += ctx.measureText(char).width + size * 0.14
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const subtitleOffset = size * 0.72 + 14 * scale
    host.style.setProperty('--sea-angle', `${seaAngle}rad`)
    host.style.setProperty('--sub-x', `${(titleCenterX + nx * subtitleOffset) / scale}px`)
    host.style.setProperty('--sub-y', `${(titleCenterY + ny * subtitleOffset) / scale}px`)
    host.dataset.lunarReady = 'true'

    const reach = textWidth / 2 + size
    const x0 = Math.max(0, Math.floor(titleCenterX - reach))
    const x1 = Math.min(width, Math.ceil(titleCenterX + reach))
    const y0 = Math.max(0, Math.floor(titleCenterY - reach))
    const y1 = Math.min(height, Math.ceil(titleCenterY + reach))
    if (x1 <= x0 || y1 <= y0) return
    const pixels = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data
    const homesX: number[] = []
    const homesY: number[] = []
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const alpha = pixels[((y - y0) * (x1 - x0) + (x - x0)) * 4 + 3]
        if (alpha < 130 || BAYER_4[(x & 3) + ((y & 3) << 2)] >= 0.8) continue
        homesX.push(x)
        homesY.push(y)
      }
    }
    const stride = Math.max(1, homesX.length / MAX_TITLE_PARTICLES)
    titleCount = Math.floor(homesX.length / stride)
    titleHomeX = new Float32Array(titleCount)
    titleHomeY = new Float32Array(titleCount)
    titleX = new Float32Array(titleCount)
    titleY = new Float32Array(titleCount)
    titleVX = new Float32Array(titleCount)
    titleVY = new Float32Array(titleCount)
    titleSeed = new Float32Array(titleCount)
    titleSeed2 = new Float32Array(titleCount)
    const entrance = reducedMotion.matches ? 0 : 1
    for (let i = 0; i < titleCount; i++) {
      const source = Math.floor(i * stride)
      titleHomeX[i] = homesX[source]
      titleHomeY[i] = homesY[source]
      titleSeed[i] = hash(i * 13 + 7)
      titleSeed2[i] = hash(i * 13 + 8)
      // Surface from the depths on first paint.
      const sink = (20 + hash(i * 13 + 9) * 140) * scale * entrance
      const drift = (hash(i * 13 + 10) - 0.5) * 120 * scale * entrance
      titleX[i] = titleHomeX[i] + nx * sink + ux * drift
      titleY[i] = titleHomeY[i] + ny * sink + uy * drift
    }
    if (frame === null) draw(performance.now(), 0)
  }

  const rebuild = () => {
    cssWidth = window.innerWidth
    cssHeight = window.innerHeight
    // ~1 CSS px per dust pixel on desktop; small screens use device pixels for finer grain.
    scale = Math.min(
      Math.max(1, window.devicePixelRatio || 1),
      Math.sqrt(MAX_BUFFER_PIXELS / (cssWidth * cssHeight))
    )
    width = Math.max(1, Math.round(cssWidth * scale))
    height = Math.max(1, Math.round(cssHeight * scale))
    layers.base.width = layers.particles.width = width
    layers.base.height = layers.particles.height = height
    image = context.createImageData(width, height)
    layout = sceneLayout(cssWidth, cssHeight, mode)

    seaX = layout.horizonStart.x * scale
    seaY = layout.horizonStart.y * scale
    const dx = (layout.horizonEnd.x - layout.horizonStart.x) * scale
    const dy = (layout.horizonEnd.y - layout.horizonStart.y) * scale
    const length = Math.hypot(dx, dy) || 1
    ux = dx / length
    uy = dy / length
    nx = -uy
    ny = ux
    seaAngle = Math.atan2(uy, ux)
    seaMaxDepth = Math.max(1, seaDepth(width, height), seaDepth(0, height), seaDepth(width, 0))

    scroll = scrollTarget = readScroll()
    lastCssMoon = ''
    updateMoon()
    buildBase()
    baseContext.putImageData(new ImageData(base, width, height), 0, 0)
    buildSprites()
    buildParticles()
    titleCount = 0
    if (mode === 'home') {
      void buildTitle()
    } else {
      // No title on inner pages: aim the moonlight path into the sea's corner.
      titleCenterX = width * 0.92
      titleCenterY = height * 0.95
    }
    draw(performance.now(), 0)
  }

  const drawGlitter = (data: Uint8ClampedArray, time: number, dim: number) => {
    // Moonlight path: rows parallel to the horizon, centred on the moon→title axis.
    let vx = titleCenterX - mx
    let vy = titleCenterY - my
    const axisLength = Math.hypot(vx, vy) || 1
    vx /= axisLength
    vy /= axisLength
    const rate = vx * nx + vy * ny
    if (rate <= 0.05) return
    const moonDepth = seaDepth(mx, my)
    const color = palette.light ? palette.ink : palette.lit
    const maxSpread = Math.min(mr * 0.9, 150 * scale)
    for (let depth = 1; depth < seaMaxDepth; depth++) {
      const s = (depth - moonDepth) / rate
      const cx = mx + vx * s
      const cy = my + vy * s
      if (cx < -maxSpread || cy < -maxSpread || cx > width + maxSpread || cy > height + maxSpread)
        break
      const progress = depth / seaMaxDepth
      const spread = Math.min(maxSpread, 8 * scale + depth * 0.35)
      const centerAlong = seaAlong(cx, cy)
      const wave =
        (Math.sin(depth * 0.37 + time * 0.0016) * 6 + Math.sin(depth * 0.11 - time * 0.001) * 10) *
        scale
      const row = Math.imul(depth, 7919)
      const baseX = seaX + nx * depth
      const baseY = seaY + ny * depth
      for (let w = -spread; w < spread; w++) {
        const falloff = 1 - Math.abs(w) / spread
        const probability = falloff * falloff * 0.42 * (1 - progress * 0.5)
        if (hash(Math.floor((w + wave) / (3 + progress * 6) / scale) ^ row) >= probability) continue
        const along = centerAlong + w
        plot(
          data,
          width,
          height,
          baseX + ux * along,
          baseY + uy * along,
          color,
          (0.3 + 0.45 * falloff) * dim
        )
      }
    }
  }

  const drawRipples = (data: Uint8ClampedArray, activeCount: number, time: number, dim: number) => {
    for (let r = 0; r < activeCount; r++) {
      const front = activeFront[r]
      const fade = activeAmp[r] / (6 * scale)
      for (let ring = 0; ring < 2; ring++) {
        const radius = ring === 0 ? front : front * 0.62
        const strength = ring === 0 ? 0.6 : 0.28
        const count = Math.min(360, Math.floor((TAU * radius) / (2.2 * scale)))
        for (let k = 0; k < count; k++) {
          if (hash(k * 31 + r * 977 + (radius | 0)) > 0.7) continue
          const angle = ((k + 0.5) / count) * TAU
          const along = Math.cos(angle) * radius
          const normal = Math.sin(angle) * radius * RIPPLE_SQUASH
          const x = activeX[r] + ux * along + nx * normal
          const y = activeY[r] + uy * along + ny * normal
          if (seaDepth(x, y) <= 1) continue
          plot(data, width, height, x, y, palette.ink, strength * fade * dim)
        }
      }
    }
  }

  const draw = (time: number, dt: number) => {
    if (!image) return
    const data = image.data

    scroll += (scrollTarget - scroll) * (dt > 0 ? Math.min(1, dt * 0.008) : 1)
    excited += (excitedTarget - excited) * (dt > 0 ? Math.min(1, dt * 0.004) : 1)
    updateMoon()
    const light = currentLight()
    const [lx, ly, lz] = light
    const dim = mode === 'home' ? 1 - 0.7 * smoothstep(0.7, 1.4, scroll) : 0.72
    const dissolve = smoothstep(0.04, 0.8, scroll)
    const pointerReach = POINTER_RADIUS * scale
    const pointerActive = dt > 0 && pointerX > -1e4
    const speedBoost = 1 + excited * 2.5

    let activeCount = 0
    for (let r = 0; r < RIPPLE_SLOTS; r++) {
      const age = time - rippleBirth[r]
      if (age < 0 || age > RIPPLE_LIFE) continue
      activeX[activeCount] = rippleX[r]
      activeY[activeCount] = rippleY[r]
      activeFront[activeCount] = (4 + age * 0.11) * scale
      activeAmp[activeCount] = 6 * scale * Math.exp(-age / 1000)
      activeCount++
    }

    const moonAlpha = 0.35 + 0.65 * dim
    const ratio = mr / spriteRadius
    const moonKey = `${mx.toFixed(1)},${my.toFixed(1)},${ratio.toFixed(4)},${phase.toFixed(3)},${moonAlpha.toFixed(3)}`
    if (moonKey !== lastMoonLayer) {
      lastMoonLayer = moonKey
      const half = (spriteSize * ratio) / 2
      layers.moon.style.transform = `translate(${(mx - half) / scale}px, ${(my - half) / scale}px) scale(${ratio})`
      layers.moon.style.opacity = moonAlpha.toFixed(3)
      layers.moonTo.style.opacity = phase.toFixed(3)
    }
    updateSurface(time, dt > 0)
    data.fill(0)

    drawGlitter(data, time, dim)
    drawRipples(data, activeCount, time, dim)

    for (let i = 0; i < starCount; i++) {
      const dx = starX[i] - mx
      const dy = starY[i] - my
      if (dx * dx + dy * dy < mr * mr * 1.1) continue
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.0011 + starPhase[i] * 7)
      plot(data, width, height, starX[i], starY[i], palette.star, pulse * pulse * pulse * 0.9)
    }

    // Dust shell: thickness is capped in pixels so the huge cropped moon stays crisp.
    const spread = Math.min(2.2, (300 * scale) / mr)
    const linearCap = Math.min(1, (160 * scale) / mr)
    for (let i = 0; i < dustCount; i++) {
      if (dt > 0) dustTheta[i] += dustSpeed[i] * dt * speedBoost * linearCap
      const rad = 1.02 + dustFrac[i] * spread
      const c = Math.cos(dustTheta[i])
      const s = Math.sin(dustTheta[i])
      const x0 = rad * c
      const y0 = rad * s * dustCosI[i]
      const x = x0 * dustCosN[i] - y0 * dustSinN[i]
      const y = x0 * dustSinN[i] + y0 * dustCosN[i]
      // The shell only shows outside the disc; the disc is made of surface pixels.
      if (x * x + y * y < 1) continue
      let px = mx + x * mr
      let py = my + y * mr
      if (px < -2 || py < -2 || px > width + 2 || py > height + 2 || seaDepth(px, py) > 0) continue
      const fade = Math.pow(clamp01(1 - dustFrac[i]), 1.6)
      const lit = 0.3 + 0.7 * clamp01(((x * lx + y * ly) / rad + lz) * 0.8 + 0.3)
      let alpha = fade * lit * (0.7 + 0.3 * Math.sin(time * 0.002 + dustPhase[i])) * dim
      if (pointerActive) {
        const dx = px - pointerX
        const dy = py - pointerY
        const distance = Math.hypot(dx, dy)
        if (distance < pointerReach && distance > 0.01) {
          const push = (1 - distance / pointerReach) * 14 * scale
          px += (dx / distance) * push
          py += (dy / distance) * push
        }
      }
      plot(data, width, height, px, py, palette.ink, alpha * (0.6 + excited * 0.4))
    }

    for (let i = 0; i < sprayCount; i++) {
      if (dt > 0) {
        sprayDistance[i] += spraySpeed[i] * dt * speedBoost
        sprayAngle[i] += sprayCurl[i] * dt
        sprayLife[i] += sprayRate[i] * dt
        if (sprayLife[i] >= 1) respawnSpray(i, time, false)
      }
      const r = mr + sprayDistance[i]
      const px = mx + Math.cos(sprayAngle[i]) * r
      const py = my + Math.sin(sprayAngle[i]) * r
      if (seaDepth(px, py) > 0) continue
      plot(data, width, height, px, py, palette.ink, Math.sin(sprayLife[i] * Math.PI) * 0.75 * dim)
    }

    // Title floating in the water: spring to home, water wobble along the horizon,
    // and pointer ripples pushing pixels outward as their wavefront passes.
    const step = dt / 16.67
    const stiffness = 0.04 * step
    const damping = Math.pow(0.85, step)
    const rippleWidth = 22 * scale
    for (let i = 0; i < titleCount; i++) {
      const seed = titleSeed[i]
      const q = smoothstep(seed * 0.55, seed * 0.55 + 0.45, dissolve)
      const sink = q * (30 + seed * 170) * scale
      const drift = (titleSeed2[i] - 0.5) * q * 90 * scale
      const tx = titleHomeX[i] + nx * sink + ux * drift
      const ty = titleHomeY[i] + ny * sink + uy * drift
      let x = titleX[i]
      let y = titleY[i]
      if (dt > 0) {
        let vx = (titleVX[i] + (tx - x) * stiffness) * damping
        let vy = (titleVY[i] + (ty - y) * stiffness) * damping
        x += vx * step
        y += vy * step
        titleVX[i] = vx
        titleVY[i] = vy
        titleX[i] = x
        titleY[i] = y
      } else if (reducedMotion.matches) {
        x = titleX[i] = tx
        y = titleY[i] = ty
      }

      const depth = seaDepth(x, y)
      const wobble =
        (Math.sin(depth * 0.23 + time * 0.0021) * 0.9 +
          Math.sin(seaAlong(x, y) * 0.05 - time * 0.0013) * 0.5) *
        scale
      let ox = ux * wobble
      let oy = uy * wobble
      let crest = 0
      for (let r = 0; r < activeCount; r++) {
        const dx = x - activeX[r]
        const dy = y - activeY[r]
        const along = dx * ux + dy * uy
        const normal = (dx * nx + dy * ny) / RIPPLE_SQUASH
        const delta = Math.hypot(along, normal) - activeFront[r]
        if (delta <= -rippleWidth || delta >= rippleWidth) continue
        const envelope = 1 - Math.abs(delta) / rippleWidth
        const push = Math.sin((delta / rippleWidth) * Math.PI) * envelope * activeAmp[r]
        const distance = Math.hypot(dx, dy) || 1
        ox += (dx / distance) * push
        oy += (dy / distance) * push
        crest += envelope * (activeAmp[r] / (6 * scale))
      }
      const shimmer = 0.82 + 0.18 * Math.sin(time * 0.0017 + seed * 20)
      const alpha = 0.88 * shimmer * (1 - 0.85 * q) * dim * (1 + Math.min(1, crest) * 0.5)
      plot(data, width, height, x + ox, y + oy, palette.ink, alpha)
    }

    context.putImageData(image, 0, 0)
  }

  const loop = (time: number) => {
    const dt = lastTime ? Math.min(50, time - lastTime) : 16
    lastTime = time
    draw(time, dt)
    frame = requestAnimationFrame(loop)
  }
  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    lastTime = 0
  }
  const start = () => {
    if (frame !== null || reducedMotion.matches || document.hidden) return
    frame = requestAnimationFrame(loop)
  }
  const sync = () => {
    stop()
    start()
    if (frame === null) draw(performance.now(), 0)
  }

  const onScroll = () => {
    scrollTarget = readScroll()
    if (frame === null) {
      scroll = scrollTarget
      draw(performance.now(), 0)
    }
  }
  const onResize = () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null
      // Mobile toolbars change height constantly; only rebuild on real layout changes.
      if (window.innerWidth !== cssWidth || Math.abs(window.innerHeight - cssHeight) > 120)
        rebuild()
    }, 120)
  }
  const onPointerMove = (event: PointerEvent) => {
    pointerX = event.clientX * scale
    pointerY = event.clientY * scale
    if (frame === null || seaDepth(pointerX, pointerY) <= 2 * scale) return
    const now = performance.now()
    const moved = Math.hypot(pointerX - lastRippleX, pointerY - lastRippleY)
    if (now - lastRippleTime < 70 || (moved < 18 * scale && now - lastRippleTime < 450)) return
    rippleX[rippleNext] = pointerX
    rippleY[rippleNext] = pointerY
    rippleBirth[rippleNext] = now
    rippleNext = (rippleNext + 1) % RIPPLE_SLOTS
    lastRippleX = pointerX
    lastRippleY = pointerY
    lastRippleTime = now
  }
  const onPointerLeave = () => {
    pointerX = -1e5
    pointerY = -1e5
  }

  rebuild()
  sync()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('visibilitychange', sync)
  reducedMotion.addEventListener('change', sync)

  return {
    setExcited(value) {
      excitedTarget = value ? 1 : 0
    },
    destroy() {
      stop()
      titleVersion++
      delete host.dataset.lunarReady
      if (resizeTimer !== null) window.clearTimeout(resizeTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', sync)
      reducedMotion.removeEventListener('change', sync)
    },
  }
}
