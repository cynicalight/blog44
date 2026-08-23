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
}

type TitleParticle = {
  characterIndex: number
  originX: number
  originY: number
  x: number
  y: number
  vx: number
  vy: number
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
const TITLE_SCATTER_RADIUS = 128
const TITLE_SCATTER_FORCE = 0.85
const TITLE_GRAVITY_RADIUS = 220
const TITLE_GRAVITY_FORCE = 0.16
const TITLE_MERGE_RADIUS = 22
const TITLE_MERGE_COMPLETE_RADIUS = 6
const TITLE_MERGE_STAGGER = 0.18
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
    let mergeProgress = 0
    let disposed = false
    let title: HTMLElement | null = null
    let titleParticles: TitleParticle[] = []
    let titleParticleSignature = ''
    let cursorMergeTargets: number[] = []
    let cursorTargetOwners = new Map<number, number>()
    let activeMergeCharacter = -1
    let titleObserver: ResizeObserver | null = null
    const bursts: Burst[] = []
    const pointerHistory: PointerSample[] = []
    const cursorParticles: CursorParticle[] = CURSOR_PARTICLE_ORIGINS.map(({ x, y }, index) => {
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
      }
    })

    const resizeCanvas = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * density
      canvas.height = window.innerHeight * density
      context.setTransform(density, 0, 0, density, 0, 0)
    }

    const buildTitleParticles = () => {
      if (disposed) return
      if (!title) {
        titleParticles = []
        return
      }

      const rect = title.getBoundingClientRect()
      const styles = window.getComputedStyle(title)
      const width = Math.ceil(rect.width)
      const height = Math.ceil(rect.height)
      if (!width || !height) return
      const signature = [
        width,
        height,
        styles.fontStyle,
        styles.fontWeight,
        styles.fontSize,
        styles.lineHeight,
        styles.fontFamily,
        styles.letterSpacing,
        title.textContent,
      ].join('|')
      if (signature === titleParticleSignature && titleParticles.length) return
      titleParticleSignature = signature

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
      const titleText = title.textContent || ''
      sourceContext.fillText(titleText, width / 2, height / 2 + 1)

      const characters = Array.from(titleText)
      const textStartX = width / 2 - sourceContext.measureText(titleText).width / 2
      const characterEnds = characters.map((_, index) => {
        return textStartX + sourceContext.measureText(characters.slice(0, index + 1).join('')).width
      })

      const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data
      const particles: TitleParticle[] = []
      for (let y = 0; y < source.height; y += 3) {
        for (let x = 0; x < source.width; x += 3) {
          if (pixels[(y * source.width + x) * 4 + 3] < 110) continue
          const originX = x / 2
          const originY = y / 2
          const matchingCharacter = characterEnds.findIndex(
            (characterEnd) => originX <= characterEnd
          )
          const characterIndex =
            matchingCharacter === -1 ? characters.length - 1 : matchingCharacter
          particles.push({
            characterIndex,
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
          })
        }
      }
      titleParticles = particles
      cursorMergeTargets = []
      cursorTargetOwners = new Map()
      activeMergeCharacter = -1
      startAnimation()
    }

    const assignCursorMergeTargets = (characterIndex: number) => {
      if (characterIndex === activeMergeCharacter) return
      if (activeMergeCharacter !== -1) mergeProgress = 0
      activeMergeCharacter = characterIndex
      const characterTargets = titleParticles.flatMap((particle, index) => {
        return particle.characterIndex === characterIndex ? [index] : []
      })
      const mergeParticleCount = Math.min(cursorParticles.length, characterTargets.length)
      cursorMergeTargets = Array.from({ length: cursorParticles.length }, (_, index) => {
        if (index >= mergeParticleCount) return -1
        return characterTargets[
          Math.floor(((index + 0.5) / mergeParticleCount) * characterTargets.length)
        ]
      })
      cursorTargetOwners = new Map(
        cursorMergeTargets
          .map((targetIndex, cursorIndex) => [targetIndex, cursorIndex] as const)
          .filter(([targetIndex]) => targetIndex >= 0)
      )
    }

    const findTitle = () => {
      const nextTitle = document.querySelector<HTMLElement>('[data-particle-title]')
      if (nextTitle === title) return
      titleObserver?.disconnect()
      title = nextTitle
      titleParticles = []
      titleParticleSignature = ''
      cursorMergeTargets = []
      cursorTargetOwners = new Map()
      activeMergeCharacter = -1
      mergeProgress = 0
      if (!title) return
      titleObserver = new ResizeObserver(buildTitleParticles)
      titleObserver.observe(title)
      buildTitleParticles()
    }

    const updateCapability = () => {
      document.documentElement.classList.toggle('particle-cursor-active', desktopPointer.matches)
      if (!desktopPointer.matches) {
        pressed = false
        pressOpacity = 1
        reformProgress = 1
        mergeProgress = 0
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
      mergeProgress = 0
      for (const particle of cursorParticles) {
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
      if (!desktopPointer.matches || !pressed) return
      pressed = false
      reformProgress = 0
      if (pressOpacity > 0.01) {
        bursts.push({
          opacity: pressOpacity,
          particles: cursorParticles.map(({ renderX, renderY, vx, vy, size, phase }) => ({
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

    const cursorParticleMergeProgress = (cursorIndex: number) => {
      const stagger =
        (((cursorIndex * 47) % cursorParticles.length) / cursorParticles.length) *
        TITLE_MERGE_STAGGER
      const progress = Math.max(0, Math.min(1, (mergeProgress - stagger) / (1 - stagger)))
      return 1 - Math.pow(1 - progress, 3)
    }

    const render = (time: number) => {
      frame = null
      if (!desktopPointer.matches && !titleParticles.length) {
        canvas.style.opacity = '0'
        return
      }
      frame = requestAnimationFrame(render)
      const frameScale = previousFrameTime
        ? Math.min(2.5, Math.max(0.5, (time - previousFrameTime) / (1000 / 60)))
        : 1
      previousFrameTime = time
      const showCursor = visible && desktopPointer.matches
      canvas.style.opacity = showCursor || titleParticles.length ? '1' : '0'
      const cursorX = pointer.x - CURSOR_HOTSPOT.x
      const cursorY = pointer.y - CURSOR_HOTSPOT.y
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      pressOpacity += ((pressed ? 0 : 1) - pressOpacity) * (pressed ? 0.055 : 0.09)
      if (!pressed && reformProgress < 1) {
        reformProgress = Math.min(1, reformProgress + 0.075 * frameScale)
      }

      const bodyColor = getComputedStyle(document.body).color
      const titleColor = title ? getComputedStyle(title).color : bodyColor
      context.fillStyle = bodyColor
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

      let titleRect: DOMRect | null = null
      if (title) {
        const currentTitle = title
        const rect = currentTitle.getBoundingClientRect()
        const isFullyOnscreen =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        const samplePoints = [0.12, 0.5, 0.88].flatMap((x) =>
          [0.15, 0.5, 0.85].map((y) => ({
            x: rect.left + rect.width * x,
            y: rect.top + rect.height * y,
          }))
        )
        const isUncovered = samplePoints.every(({ x, y }) => {
          const topElement = document.elementFromPoint(x, y)
          return (
            topElement === currentTitle || Boolean(topElement && currentTitle.contains(topElement))
          )
        })
        if (isFullyOnscreen && isUncovered) {
          titleRect = rect
        }
      }
      let gravityTarget: { x: number; y: number; distance: number; characterIndex: number } | null =
        null
      if (visible && titleRect) {
        for (const particle of titleParticles) {
          const x = titleRect.left + particle.originX
          const y = titleRect.top + particle.originY
          const distance = Math.hypot(x - pointer.x, y - pointer.y)
          if (!gravityTarget || distance < gravityTarget.distance) {
            gravityTarget = { x, y, distance, characterIndex: particle.characterIndex }
          }
        }
      }
      if (gravityTarget) assignCursorMergeTargets(gravityTarget.characterIndex)

      const desiredMergeProgress =
        showCursor && !pressed && gravityTarget
          ? Math.max(
              0,
              Math.min(
                1,
                1 -
                  (gravityTarget.distance - TITLE_MERGE_COMPLETE_RADIUS) /
                    (TITLE_MERGE_RADIUS - TITLE_MERGE_COMPLETE_RADIUS)
              )
            )
          : 0
      const mergeRate = desiredMergeProgress > mergeProgress ? 0.11 : 0.18
      mergeProgress += (desiredMergeProgress - mergeProgress) * mergeRate * frameScale
      if (Math.abs(desiredMergeProgress - mergeProgress) < 0.001) {
        mergeProgress = desiredMergeProgress
      }

      if (showCursor) {
        for (let cursorIndex = 0; cursorIndex < cursorParticles.length; cursorIndex += 1) {
          const particle = cursorParticles[cursorIndex]
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
            drawX =
              cursorX + CURSOR_CENTER.x + (particle.originX - CURSOR_CENTER.x) * expandProgress
            drawY =
              cursorY + CURSOR_CENTER.y + (particle.originY - CURSOR_CENTER.y) * expandProgress
          } else {
            const trailPointer = pointerAt(time - slowProgress * TRAIL_DURATION_MS)
            drawX = trailPointer.x - CURSOR_HOTSPOT.x + particle.originX
            drawY = trailPointer.y - CURSOR_HOTSPOT.y + particle.originY
          }

          const targetIndex = cursorMergeTargets[cursorIndex]
          const mergeTarget = titleRect && titleParticles[targetIndex]
          const particleMergeProgress = cursorParticleMergeProgress(cursorIndex)
          if (titleRect && mergeTarget && particleMergeProgress > 0) {
            const targetX = titleRect.left + mergeTarget.x
            const targetY = titleRect.top + mergeTarget.y
            drawX += (targetX - drawX) * particleMergeProgress
            drawY += (targetY - drawY) * particleMergeProgress
          }
          particle.renderX = drawX
          particle.renderY = drawY

          const cursorAlpha =
            (0.48 + (Math.sin(time * 0.004 + particle.phase) + 1) * 0.2) * pressOpacity
          context.fillStyle = particleMergeProgress > 0 ? titleColor : bodyColor
          context.globalAlpha = cursorAlpha + (1 - cursorAlpha) * particleMergeProgress
          context.fillRect(Math.round(drawX), Math.round(drawY), particle.size, particle.size)
        }
      }
      context.globalAlpha = 1

      if (title && titleRect) {
        const interacting = Boolean(gravityTarget && gravityTarget.distance < TITLE_GRAVITY_RADIUS)
        context.fillStyle = titleColor

        for (let titleIndex = 0; titleIndex < titleParticles.length; titleIndex += 1) {
          const particle = titleParticles[titleIndex]
          const globalX = titleRect.left + particle.x
          const globalY = titleRect.top + particle.y
          const dx = pointer.x - globalX
          const dy = pointer.y - globalY
          const distance = Math.hypot(dx, dy) || 0.01

          if (visible && distance < TITLE_SCATTER_RADIUS) {
            const strength = (1 - distance / TITLE_SCATTER_RADIUS) * TITLE_SCATTER_FORCE
            particle.vx -= (dx / distance) * strength
            particle.vy -= (dy / distance) * strength
          } else if (visible && distance < TITLE_GRAVITY_RADIUS) {
            const strength =
              (1 -
                (distance - TITLE_SCATTER_RADIUS) / (TITLE_GRAVITY_RADIUS - TITLE_SCATTER_RADIUS)) *
              TITLE_GRAVITY_FORCE
            particle.vx += (dx / distance) * strength
            particle.vy += (dy / distance) * strength
          }

          particle.vx += (particle.originX - particle.x) * 0.075
          particle.vy += (particle.originY - particle.y) * 0.075
          particle.vx *= 0.76
          particle.vy *= 0.76
          particle.x += particle.vx
          particle.y += particle.vy

          const idleSignalOffset = interacting
            ? 0
            : Math.sin(particle.originY * 0.48 + time * 0.004) * 0.45 +
              Math.sin(time * 0.0018) * 0.15
          const cursorOwner = cursorTargetOwners.get(titleIndex)
          const replacementProgress =
            cursorOwner === undefined ? 0 : cursorParticleMergeProgress(cursorOwner)
          if (replacementProgress < 1) {
            context.globalAlpha = 1 - replacementProgress
            context.fillRect(
              Math.round(titleRect.left + particle.x + idleSignalOffset),
              Math.round(titleRect.top + particle.y),
              1.7,
              1.7
            )
          }
        }
        context.globalAlpha = 1

        if (!interacting) {
          context.save()
          context.globalCompositeOperation = 'destination-out'
          context.globalAlpha = 0.07
          for (let y = titleRect.top + 1; y < titleRect.bottom; y += 4) {
            context.fillRect(titleRect.left, y, titleRect.width, 1)
          }
          context.restore()
        }
      }
    }

    function startAnimation() {
      if (!disposed && frame === null) frame = requestAnimationFrame(render)
    }

    resizeCanvas()
    updateCapability()
    findTitle()
    const mutationObserver = new MutationObserver(findTitle)
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    document.fonts.ready.then(buildTitleParticles)
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
      mutationObserver.disconnect()
      titleObserver?.disconnect()
      document.documentElement.classList.remove('particle-cursor-active')
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="particle-cursor" />
}
