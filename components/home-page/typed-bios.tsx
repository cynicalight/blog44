'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Particle = {
  originX: number
  originY: number
  x: number
  y: number
  vx: number
  vy: number
}

const LINES = [
  'I work mostly with Swift and TypeScript.',
  'I love street photography.',
  'My first programming language was C on Arduino.',
  'My favorite band is the Beatles.',
  'I live in Shanghai, China.',
  "I'm a dog-person. 🐶",
  "I'm a sport-guy. I love 🏸, 🏃.",
  "I'm a learner, builder, and freedom seeker.",
]

const TYPE_SPEED = 80
const BACKSPACE_SPEED = 30
const COMPLETED_LINE_DELAY = 5000
const INTERACTION_RADIUS = 96
const INTERACTION_FORCE = 0.65

export function TypedBios() {
  const textRef = useRef<HTMLSpanElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const textStartRef = useRef(0)
  const pointerRef = useRef({ x: -9999, y: -9999, active: false })
  const holdingRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    let lineIndex = 0
    let characterIndex = 0
    let deleting = false
    let timeout: number
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const line = LINES[lineIndex]
      if (!deleting) {
        holdingRef.current = false
        characterIndex += 1
        setText(line.slice(0, characterIndex))
        if (characterIndex === line.length) {
          holdingRef.current = true
          deleting = true
          timeout = window.setTimeout(tick, COMPLETED_LINE_DELAY)
          return
        }
        timeout = window.setTimeout(tick, TYPE_SPEED)
        return
      }

      holdingRef.current = false
      characterIndex -= 1
      setText(line.slice(0, characterIndex))
      if (characterIndex === 0) {
        deleting = false
        lineIndex = (lineIndex + 1) % LINES.length
        timeout = window.setTimeout(tick, 280)
        return
      }
      timeout = window.setTimeout(tick, BACKSPACE_SPEED)
    }

    tick()
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  useLayoutEffect(() => {
    const textElement = textRef.current
    const canvas = canvasRef.current
    if (!textElement || !canvas) return

    let width = 0
    let height = 0
    let context: CanvasRenderingContext2D | null = null

    const buildParticles = () => {
      const rect = textElement.getBoundingClientRect()
      const styles = window.getComputedStyle(textElement)
      width = Math.ceil(rect.width)
      height = Math.ceil(rect.height)
      if (!width || !height) return

      const density = Math.min(window.devicePixelRatio || 1, 2)
      const canvasWidth = Math.ceil(width * density)
      const canvasHeight = Math.ceil(height * density)
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth
        canvas.height = canvasHeight
      }
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
      sourceContext.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize}/${styles.lineHeight} ${styles.fontFamily}`
      sourceContext.textBaseline = 'middle'
      const textWidth = sourceContext.measureText(textElement.textContent || '').width
      const textStart = (width - textWidth) / 2
      sourceContext.fillText(textElement.textContent || '', textStart, height / 2 + 1)

      const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data
      const previousStart = textStartRef.current
      const existing = new Map(
        particlesRef.current.map((particle) => [
          `${Math.round((particle.originX - previousStart) * 10)}:${particle.originY}`,
          particle,
        ])
      )
      const particles: Particle[] = []
      for (let y = 0; y < source.height; y += 3) {
        for (let x = 0; x < source.width; x += 3) {
          if (pixels[(y * source.width + x) * 4 + 3] < 110) continue
          const originX = x / 2
          const originY = y / 2
          const previous = existing.get(`${Math.round((originX - textStart) * 10)}:${originY}`)
          particles.push(
            previous
              ? {
                  ...previous,
                  originX,
                  originY,
                  x: previous.x + textStart - previousStart,
                }
              : { originX, originY, x: originX, y: originY, vx: 0, vy: 0 }
          )
        }
      }
      particlesRef.current = particles
      textStartRef.current = textStart
    }

    buildParticles()
    const observer = new ResizeObserver(buildParticles)
    observer.observe(textElement)
    const render = (time: number) => {
      frameRef.current = requestAnimationFrame(render)
      if (!context) return
      const pointer = pointerRef.current
      const canDisturbParticles = pointer.active && holdingRef.current
      context.clearRect(0, 0, width, height)
      context.fillStyle = window.getComputedStyle(textElement).color
      for (const particle of particlesRef.current) {
        const dx = particle.x - pointer.x
        const dy = particle.y - pointer.y
        const distance = Math.hypot(dx, dy) || 0.01
        if (canDisturbParticles && distance < INTERACTION_RADIUS) {
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
        const signal = canDisturbParticles ? 0 : Math.sin(particle.originY * 0.48 + time * 0.004) * 0.38
        context.fillRect(Math.round(particle.x + signal), Math.round(particle.y), 1.55, 1.55)
      }
      if (!canDisturbParticles) {
        context.save()
        context.globalCompositeOperation = 'destination-out'
        context.globalAlpha = 0.06
        for (let y = 1; y < height; y += 4) context.fillRect(0, y, width, 1)
        context.restore()
      }
    }

    frameRef.current = requestAnimationFrame(render)
    return () => {
      observer.disconnect()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [text])

  return (
    <div
      className="relative mx-auto h-8 w-full max-w-3xl cursor-none select-none md:h-9"
      onPointerEnter={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        pointerRef.current.x = event.clientX - rect.left
        pointerRef.current.y = event.clientY - rect.top
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false
      }}
    >
      <span
        ref={textRef}
        className="absolute inset-0 w-full text-left text-lg leading-8 text-gray-700 opacity-0 dark:text-gray-300 md:text-xl md:leading-9"
        style={{ fontFamily: 'var(--font-exo-2)' }}
      >
        {text}
      </span>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
    </div>
  )
}
