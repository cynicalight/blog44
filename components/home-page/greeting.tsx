'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  originX: number
  originY: number
  x: number
  y: number
  vx: number
  vy: number
}

const INTERACTION_RADIUS = 128
const INTERACTION_FORCE = 0.85

export function Greeting() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const pointerRef = useRef({ x: -9999, y: -9999, active: false })
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const title = titleRef.current
    const canvas = canvasRef.current
    if (!title || !canvas) return

    let width = 0
    let height = 0
    let context: CanvasRenderingContext2D | null = null

    const buildParticles = () => {
      const rect = title.getBoundingClientRect()
      const styles = window.getComputedStyle(title)
      width = Math.ceil(rect.width)
      height = Math.ceil(rect.height)
      if (!width || !height) return

      const density = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.ceil(width * density)
      canvas.height = Math.ceil(height * density)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(density, 0, 0, density, 0, 0)

      const source = document.createElement('canvas')
      source.width = width * 2
      source.height = height * 2
      const sourceContext = source.getContext('2d', { willReadFrequently: true })
      if (!sourceContext) return
      sourceContext.scale(2, 2)
      sourceContext.fillStyle = '#000'
      sourceContext.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize}/${styles.lineHeight} ${styles.fontFamily}`
      sourceContext.textAlign = 'center'
      sourceContext.textBaseline = 'middle'
      sourceContext.letterSpacing = styles.letterSpacing
      sourceContext.fillText(title.textContent || '', width / 2, height / 2 + 1)

      const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data
      const particles: Particle[] = []
      for (let y = 0; y < source.height; y += 3) {
        for (let x = 0; x < source.width; x += 3) {
          if (pixels[(y * source.width + x) * 4 + 3] < 110) continue
          const originX = x / 2
          const originY = y / 2
          particles.push({ originX, originY, x: originX, y: originY, vx: 0, vy: 0 })
        }
      }
      particlesRef.current = particles
    }

    const observer = new ResizeObserver(buildParticles)
    observer.observe(title)
    document.fonts.ready.then(buildParticles)
    buildParticles()

    const render = (time: number) => {
      frameRef.current = requestAnimationFrame(render)
      if (!context) return
      const pointer = pointerRef.current
      const hasPointer = pointer.active
      context.clearRect(0, 0, width, height)
      context.fillStyle = window.getComputedStyle(title).color

      for (const particle of particlesRef.current) {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distance = Math.hypot(dx, dy) || 0.01
        if (hasPointer && distance < INTERACTION_RADIUS) {
          const strength = (1 - distance / INTERACTION_RADIUS) * INTERACTION_FORCE
          particle.vx += (dx / distance) * strength
          particle.vy += (dy / distance) * strength
        }
        particle.vx += (particle.originX - particle.x) * 0.075
        particle.vy += (particle.originY - particle.y) * 0.075
        particle.vx *= 0.76
        particle.vy *= 0.76
        particle.x += particle.vx
        particle.y += particle.vy

        const idleSignalOffset = hasPointer
          ? 0
          : Math.sin(particle.originY * 0.48 + time * 0.004) * 0.45 +
            Math.sin(time * 0.0018) * 0.15
        context.fillRect(Math.round(particle.x + idleSignalOffset), Math.round(particle.y), 1.7, 1.7)
      }

      if (!hasPointer) {
        context.save()
        context.globalCompositeOperation = 'destination-out'
        context.globalAlpha = 0.07
        for (let y = 1; y < height; y += 4) context.fillRect(0, y, width, 1)
        context.restore()
      }
    }

    frameRef.current = requestAnimationFrame(render)
    return () => {
      observer.disconnect()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const activate = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }
  }

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current.x = event.clientX - rect.left
    pointerRef.current.y = event.clientY - rect.top
  }

  return (
    <div
      className="relative mx-auto inline-grid max-w-4xl cursor-none select-none text-center"
      onPointerEnter={activate}
      onPointerMove={move}
      onPointerLeave={() => {
        pointerRef.current.active = false
      }}
    >
      <h1
        ref={titleRef}
        className="col-start-1 row-start-1 font-greeting text-[40px] font-extrabold leading-[56px] tracking-tight text-gray-700 opacity-0 dark:text-gray-300 md:text-[78px] md:leading-[92px]"
      >
        BU44ER&apos;S BLOG
      </h1>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none col-start-1 row-start-1 drop-shadow-sm"
      />
    </div>
  )
}
