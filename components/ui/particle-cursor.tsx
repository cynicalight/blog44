'use client'

import { useEffect, useRef } from 'react'

type CursorParticle = {
  originX: number
  originY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
  renderX: number
  renderY: number
  /** Offset from the hotspot while pressed; null for particles that scatter. */
  anchor: { x: number; y: number } | null
}

type Burst = {
  opacity: number
  particles: Array<Pick<CursorParticle, 'x' | 'y' | 'vx' | 'vy' | 'size' | 'phase'>>
}

type PointerSample = {
  x: number
  y: number
  time: number
}

const CURSOR_SIZE = 72
const PARTICLE_COUNT = 176
const CURSOR_HOTSPOT = { x: 28, y: 22 }
const CURSOR_CENTER = { x: 35, y: 37 }
const CURSOR_OUTER_RADIUS = 15
const TRAIL_DURATION_MS = 180
// While the button is held (clicking, dragging a text selection) a small cluster
// stays on the hotspot so the pointer never disappears.
const ANCHOR_OFFSETS = [
  [0, 0],
  [1.6, 0],
  [0, 1.6],
  [1.6, 1.6],
  [-1.6, 0],
  [0, -1.6],
  [3.2, 1.6],
  [1.6, 3.2],
  [-1.6, -1.6],
]
const CURSOR_OUTLINE: Array<[number, number]> = [
  [28, 22],
  [28, 42],
  [33, 37],
  [36, 45],
  [41, 43],
  [38, 35],
  [46, 35],
]

function isInsideCursorOutline(x: number, y: number) {
  let inside = false
  for (
    let index = 0, previous = CURSOR_OUTLINE.length - 1;
    index < CURSOR_OUTLINE.length;
    previous = index++
  ) {
    const [x1, y1] = CURSOR_OUTLINE[index]
    const [x2, y2] = CURSOR_OUTLINE[previous]
    const crossesEdge = y1 > y !== y2 > y
    const edgeX = ((x2 - x1) * (y - y1)) / (y2 - y1) + x1
    if (crossesEdge && x < edgeX) inside = !inside
  }
  return inside
}

const CURSOR_PARTICLE_ORIGINS = (() => {
  const points: Array<{ x: number; y: number }> = []
  for (let y = 23; y < 46; y += 1.6) {
    for (let x = 28; x < 47; x += 1.6) {
      if (isInsideCursorOutline(x, y)) points.push({ x, y })
    }
  }
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    return points[Math.floor((index / PARTICLE_COUNT) * points.length)]
  })
})()

export function ParticleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!canvas) return

    let frame: number | null = null
    const context = canvas.getContext('2d')
    if (!context) return

    let visible = false
    let pressed = false
    let pressOpacity = 1
    let pointer = { x: -CURSOR_SIZE, y: -CURSOR_SIZE }
    let previousFrameTime: number | null = null
    let reformProgress = 1
    let disposed = false
    const bursts: Burst[] = []
    const pointerHistory: PointerSample[] = []
    // The particles nearest the hotspot form the pressed-state cluster.
    const anchorIndices = CURSOR_PARTICLE_ORIGINS.map(({ x, y }, index) => ({
      index,
      distance: Math.hypot(x - CURSOR_HOTSPOT.x, y - CURSOR_HOTSPOT.y),
    }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, ANCHOR_OFFSETS.length)
      .map(({ index }) => index)
    const cursorParticles: CursorParticle[] = CURSOR_PARTICLE_ORIGINS.map(({ x, y }, index) => {
      const anchorSlot = anchorIndices.indexOf(index)
      return {
        originX: x,
        originY: y,
        x,
        y,
        vx: 0,
        vy: 0,
        size: index % 9 === 0 ? 1.7 : 1.35,
        phase: index * 0.79,
        renderX: -CURSOR_SIZE,
        renderY: -CURSOR_SIZE,
        anchor:
          anchorSlot === -1
            ? null
            : {
                x: CURSOR_HOTSPOT.x + ANCHOR_OFFSETS[anchorSlot][0],
                y: CURSOR_HOTSPOT.y + ANCHOR_OFFSETS[anchorSlot][1],
              },
      }
    })

    const resizeCanvas = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * density
      canvas.height = window.innerHeight * density
      context.setTransform(density, 0, 0, density, 0, 0)
    }

    const updateCapability = () => {
      document.documentElement.classList.toggle('particle-cursor-active', desktopPointer.matches)
      if (!desktopPointer.matches) {
        pressed = false
        pressOpacity = 1
        reformProgress = 1
        bursts.length = 0
        for (const particle of cursorParticles) {
          particle.x = particle.originX
          particle.y = particle.originY
          particle.vx = 0
          particle.vy = 0
        }
      }
      startAnimation()
    }

    const move = (event: PointerEvent) => {
      const eventTime = event.timeStamp || performance.now()
      pointer = { x: event.clientX, y: event.clientY }
      pointerHistory.push({ ...pointer, time: eventTime })
      while (pointerHistory.length > 1 && pointerHistory[0].time < eventTime - TRAIL_DURATION_MS) {
        pointerHistory.shift()
      }
      visible = true
    }

    const press = () => {
      if (!desktopPointer.matches) return
      pressed = true
      for (const particle of cursorParticles) {
        particle.x = particle.originX
        particle.y = particle.originY
        particle.vx = 0
        particle.vy = 0
        if (particle.anchor) continue
        const dx = particle.x - CURSOR_CENTER.x
        const dy = particle.y - CURSOR_CENTER.y
        const distance = Math.hypot(dx, dy) || 1
        particle.vx += (dx / distance) * 5.6
        particle.vy += (dy / distance) * 5.6
      }
    }

    const release = () => {
      if (!desktopPointer.matches || !pressed) return
      pressed = false
      reformProgress = 0
      if (pressOpacity > 0.01) {
        bursts.push({
          opacity: pressOpacity,
          particles: cursorParticles
            .filter((particle) => !particle.anchor)
            .map(({ renderX, renderY, vx, vy, size, phase }) => ({
              x: renderX,
              y: renderY,
              vx,
              vy,
              size,
              phase,
            })),
        })
      }
      for (const particle of cursorParticles) {
        particle.x = CURSOR_CENTER.x
        particle.y = CURSOR_CENTER.y
        particle.vx = 0
        particle.vy = 0
      }
    }

    const pointerAt = (targetTime: number) => {
      if (!pointerHistory.length || targetTime >= pointerHistory.at(-1)!.time) return pointer
      const oldest = pointerHistory[0]
      if (targetTime <= oldest.time) return oldest

      for (let index = pointerHistory.length - 1; index > 0; index -= 1) {
        const before = pointerHistory[index - 1]
        const after = pointerHistory[index]
        if (targetTime < before.time || targetTime > after.time) continue
        const progress = (targetTime - before.time) / (after.time - before.time)
        return {
          x: before.x + (after.x - before.x) * progress,
          y: before.y + (after.y - before.y) * progress,
        }
      }

      return oldest
    }

    const render = (time: number) => {
      frame = null
      if (!desktopPointer.matches) {
        canvas.style.opacity = '0'
        return
      }
      frame = requestAnimationFrame(render)
      const frameScale = previousFrameTime
        ? Math.min(2.5, Math.max(0.5, (time - previousFrameTime) / (1000 / 60)))
        : 1
      previousFrameTime = time
      const showCursor = visible && desktopPointer.matches
      canvas.style.opacity = showCursor ? '1' : '0'
      const cursorX = pointer.x - CURSOR_HOTSPOT.x
      const cursorY = pointer.y - CURSOR_HOTSPOT.y
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      pressOpacity += ((pressed ? 0 : 1) - pressOpacity) * (pressed ? 0.055 : 0.09)
      if (!pressed && reformProgress < 1) {
        reformProgress = Math.min(1, reformProgress + 0.075 * frameScale)
      }

      context.fillStyle = getComputedStyle(document.body).color
      for (let index = bursts.length - 1; index >= 0; index -= 1) {
        const burst = bursts[index]
        burst.opacity *= 0.955
        if (burst.opacity < 0.01) {
          bursts.splice(index, 1)
          continue
        }
        for (const particle of burst.particles) {
          particle.vx *= 0.88
          particle.vy *= 0.88
          particle.x += particle.vx
          particle.y += particle.vy
          context.globalAlpha =
            (0.48 + (Math.sin(time * 0.004 + particle.phase) + 1) * 0.2) * burst.opacity
          context.fillRect(
            Math.round(particle.x),
            Math.round(particle.y),
            particle.size,
            particle.size
          )
        }
      }

      if (showCursor) {
        for (const particle of cursorParticles) {
          const lagProgress = Math.min(
            1,
            Math.hypot(particle.originX - CURSOR_CENTER.x, particle.originY - CURSOR_CENTER.y) /
              CURSOR_OUTER_RADIUS
          )
          const slowProgress = Math.pow(Math.max(0, (lagProgress - 0.25) / 0.75), 0.42)
          let drawX: number
          let drawY: number

          if (pressed && particle.anchor) {
            // Contract onto the hotspot and follow the pointer without trail lag.
            const pull = 1 - Math.pow(0.65, frameScale)
            particle.x += (particle.anchor.x - particle.x) * pull
            particle.y += (particle.anchor.y - particle.y) * pull
            drawX = cursorX + particle.x
            drawY = cursorY + particle.y
          } else if (pressed) {
            particle.vx *= Math.pow(0.78, frameScale)
            particle.vy *= Math.pow(0.78, frameScale)
            particle.x += particle.vx * frameScale
            particle.y += particle.vy * frameScale
            drawX = cursorX + particle.x
            drawY = cursorY + particle.y
          } else if (reformProgress < 1) {
            const expandProgress = 1 - Math.pow(1 - reformProgress, 3)
            drawX =
              cursorX + CURSOR_CENTER.x + (particle.originX - CURSOR_CENTER.x) * expandProgress
            drawY =
              cursorY + CURSOR_CENTER.y + (particle.originY - CURSOR_CENTER.y) * expandProgress
          } else {
            const trailPointer = pointerAt(time - slowProgress * TRAIL_DURATION_MS)
            drawX = trailPointer.x - CURSOR_HOTSPOT.x + particle.originX
            drawY = trailPointer.y - CURSOR_HOTSPOT.y + particle.originY
          }

          particle.renderX = drawX
          particle.renderY = drawY

          const shimmer = 0.48 + (Math.sin(time * 0.004 + particle.phase) + 1) * 0.2
          context.globalAlpha =
            pressed && particle.anchor ? 0.6 + shimmer * 0.4 : shimmer * pressOpacity
          context.fillRect(Math.round(drawX), Math.round(drawY), particle.size, particle.size)
        }
      }
      context.globalAlpha = 1
    }

    function startAnimation() {
      if (!disposed && frame === null) frame = requestAnimationFrame(render)
    }

    resizeCanvas()
    updateCapability()
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    window.addEventListener('pointerup', release, { passive: true })
    window.addEventListener('pointercancel', release, { passive: true })
    window.addEventListener('resize', resizeCanvas, { passive: true })
    desktopPointer.addEventListener('change', updateCapability)
    startAnimation()

    return () => {
      disposed = true
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('resize', resizeCanvas)
      desktopPointer.removeEventListener('change', updateCapability)
      document.documentElement.classList.remove('particle-cursor-active')
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="particle-cursor" />
}
