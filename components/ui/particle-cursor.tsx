'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  originX: number
  originY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
}

type Burst = {
  opacity: number
  particles: Array<Pick<Particle, 'x' | 'y' | 'vx' | 'vy' | 'size' | 'phase'>>
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
  for (let index = 0, previous = CURSOR_OUTLINE.length - 1; index < CURSOR_OUTLINE.length; previous = index++) {
    const [x1, y1] = CURSOR_OUTLINE[index]
    const [x2, y2] = CURSOR_OUTLINE[previous]
    const crossesEdge = (y1 > y) !== (y2 > y)
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
  const burstCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const burstCanvas = burstCanvasRef.current
    const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!canvas || !burstCanvas) return

    let frame: number | null = null
    let context: CanvasRenderingContext2D | null = null
    let burstContext: CanvasRenderingContext2D | null = null
    let visible = false
    let pressed = false
    let pressOpacity = 1
    let pointer = { x: -CURSOR_SIZE, y: -CURSOR_SIZE }
    let previousFrameTime: number | null = null
    let reformProgress = 1
    const bursts: Burst[] = []
    const pointerHistory: PointerSample[] = []
    const particles: Particle[] = CURSOR_PARTICLE_ORIGINS.map(({ x, y }, index) => {
      return {
        originX: x,
        originY: y,
        x,
        y,
        vx: 0,
        vy: 0,
        size: index % 9 === 0 ? 1.7 : 1.35,
        phase: index * 0.79,
      }
    })

    const resizeCanvases = () => {
      if (!context || !burstContext) return
      const density = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * density
      canvas.height = window.innerHeight * density
      burstCanvas.width = window.innerWidth * density
      burstCanvas.height = window.innerHeight * density
      context.setTransform(density, 0, 0, density, 0, 0)
      burstContext.setTransform(density, 0, 0, density, 0, 0)
    }

    const setUp = () => {
      if (!desktopPointer.matches || context) return
      context = canvas.getContext('2d')
      burstContext = burstCanvas.getContext('2d')
      resizeCanvases()
      document.documentElement.classList.add('particle-cursor-active')
    }

    const tearDown = () => {
      document.documentElement.classList.remove('particle-cursor-active')
      context = null
      burstContext = null
      visible = false
      canvas.style.opacity = '0'
    }

    const updateCapability = () => {
      if (desktopPointer.matches) setUp()
      else tearDown()
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
      pressed = true
      for (const particle of particles) {
        particle.x = particle.originX
        particle.y = particle.originY
        particle.vx = 0
        particle.vy = 0
        const dx = particle.x - CURSOR_CENTER.x
        const dy = particle.y - CURSOR_CENTER.y
        const distance = Math.hypot(dx, dy) || 1
        particle.vx += (dx / distance) * 5.6
        particle.vy += (dy / distance) * 5.6
      }
    }

    const release = () => {
      pressed = false
      reformProgress = 0
      if (pressOpacity > 0.01) {
        bursts.push({
          opacity: pressOpacity,
          particles: particles.map(({ x, y, vx, vy, size, phase }) => ({
            x: pointer.x - CURSOR_HOTSPOT.x + x,
            y: pointer.y - CURSOR_HOTSPOT.y + y,
            vx,
            vy,
            size,
            phase,
          })),
        })
      }
      for (const particle of particles) {
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
      frame = requestAnimationFrame(render)
      if (!context) return
      const frameScale = previousFrameTime
        ? Math.min(2.5, Math.max(0.5, (time - previousFrameTime) / (1000 / 60)))
        : 1
      previousFrameTime = time
      canvas.style.opacity = visible ? '1' : '0'
      const cursorX = pointer.x - CURSOR_HOTSPOT.x
      const cursorY = pointer.y - CURSOR_HOTSPOT.y
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      context.fillStyle = getComputedStyle(document.body).color
      pressOpacity += ((pressed ? 0 : 1) - pressOpacity) * (pressed ? 0.055 : 0.09)
      if (!pressed && reformProgress < 1) {
        reformProgress = Math.min(1, reformProgress + 0.075 * frameScale)
      }

      if (burstContext) {
        burstContext.clearRect(0, 0, window.innerWidth, window.innerHeight)
        burstContext.fillStyle = context.fillStyle
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
            burstContext.globalAlpha =
              (0.48 + (Math.sin(time * 0.004 + particle.phase) + 1) * 0.2) * burst.opacity
            burstContext.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size)
          }
        }
        burstContext.globalAlpha = 1
      }

      for (const particle of particles) {
        const lagProgress = Math.min(
          1,
          Math.hypot(particle.originX - CURSOR_CENTER.x, particle.originY - CURSOR_CENTER.y) /
            CURSOR_OUTER_RADIUS
        )
        const slowProgress = Math.pow(Math.max(0, (lagProgress - 0.25) / 0.75), 0.42)
        let drawX: number
        let drawY: number

        if (pressed) {
          particle.vx *= Math.pow(0.78, frameScale)
          particle.vy *= Math.pow(0.78, frameScale)
          particle.x += particle.vx * frameScale
          particle.y += particle.vy * frameScale
          drawX = cursorX + particle.x
          drawY = cursorY + particle.y
        } else if (reformProgress < 1) {
          const expandProgress = 1 - Math.pow(1 - reformProgress, 3)
          drawX = cursorX + CURSOR_CENTER.x + (particle.originX - CURSOR_CENTER.x) * expandProgress
          drawY = cursorY + CURSOR_CENTER.y + (particle.originY - CURSOR_CENTER.y) * expandProgress
        } else {
          const trailPointer = pointerAt(time - slowProgress * TRAIL_DURATION_MS)
          drawX = trailPointer.x - CURSOR_HOTSPOT.x + particle.originX
          drawY = trailPointer.y - CURSOR_HOTSPOT.y + particle.originY
        }
        context.globalAlpha =
          (0.48 + (Math.sin(time * 0.004 + particle.phase) + 1) * 0.2) * pressOpacity
        context.fillRect(Math.round(drawX), Math.round(drawY), particle.size, particle.size)
      }
      context.globalAlpha = 1
    }

    updateCapability()
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    window.addEventListener('pointerup', release, { passive: true })
    window.addEventListener('pointercancel', release, { passive: true })
    window.addEventListener('resize', resizeCanvases, { passive: true })
    desktopPointer.addEventListener('change', updateCapability)
    frame = requestAnimationFrame(render)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('resize', resizeCanvases)
      desktopPointer.removeEventListener('change', updateCapability)
      tearDown()
    }
  }, [])

  return (
    <>
      <canvas ref={burstCanvasRef} aria-hidden="true" className="particle-burst" />
      <canvas ref={canvasRef} aria-hidden="true" className="particle-cursor" />
    </>
  )
}
