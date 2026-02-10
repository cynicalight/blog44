'use client'

import { useScroll, useTransform, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Zoom } from '~/components/ui/image'
import { useWindowSize } from 'react-use'

export function ParallaxGallery({ images }: { images: { src: string; aspectRatio: number }[] }) {
  const container = useRef(null)
  const { width, height } = useWindowSize()
  // 避免 SSR/Hydration 时的 Infinity 问题
  const safeHeight = typeof height === 'number' && isFinite(height) ? height : 800
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end start'],
  })

  // 视差参数 - 调整这些值来改变滚动速度
  // 中间列速度稍慢，两侧列速度稍快，制造错落感
  // 这里的 Y 值表示向下位移的距离，正值越大，视觉上滚动越慢（因为它抵消了页面的向上滚动）
  const y = useTransform(scrollYProgress, [0, 1], [0, safeHeight * 0.2])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, safeHeight * 0.35])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, safeHeight * 0.12])

  const isMobile = width !== 0 && width < 768
  const columns = useMemo(() => {
    const next: { src: string; aspectRatio: number }[][] = [[], [], []]
    const columnHeights = [0, 0, 0] // 记录每列当前的累积高度

    images.forEach((img) => {
      // 贪心算法：找到当前高度最小的列
      const minColIndex = columnHeights.indexOf(Math.min(...columnHeights))

      next[minColIndex].push(img)

      // 更新该列高度 (高度 = 宽度 / aspectRatio，假设宽度为1)
      columnHeights[minColIndex] += 1 / img.aspectRatio
    })

    return next
  }, [images])

  if (!mounted) {
    return (
      <div
        ref={container}
        className="gallery-container box-border flex min-h-[200vh] gap-[2vw] overflow-hidden p-[2vw]"
      >
        {columns.map((col, colIndex) => (
          <div
            key={colIndex}
            className="relative flex h-full w-1/3 min-w-[250px] flex-col gap-[2vw]"
          >
            {col.map((img, i) => (
              <div key={`${colIndex}-${i}`} className="relative w-full rounded-lg">
                <img
                  src={img.src}
                  alt="Gallery Image"
                  className="h-auto w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-6 px-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <Zoom
              zoomImg={{ src: img.src, alt: `Gallery Image ${i + 1}` }}
              canSwipeToUnzoom={true}
              zoomMargin={40}
            >
              <img
                src={img.src}
                alt={`Gallery Image ${i + 1}`}
                className="h-auto w-full rounded-2xl object-contain"
                loading="lazy"
              />
            </Zoom>
          </div>
        ))}
      </div>
    )
  }

  // 计算最大偏移量，用于补偿底部被遮挡的空间
  const maxOffset = safeHeight * 0.35

  return (
    <div
      ref={container}
      className="gallery-container box-border flex min-h-[200vh] gap-[2vw] overflow-hidden p-[2vw]"
      style={{ paddingBottom: maxOffset }}
    >
      <Column images={columns[0]} y={y} />
      <Column images={columns[1]} y={y2} />
      <Column images={columns[2]} y={y3} />
    </div>
  )
}

const Column = ({ images, y }: { images: { src: string; aspectRatio: number }[]; y: any }) => {
  return (
    <motion.div
      suppressHydrationWarning
      style={{ y }}
      className="relative flex h-full w-1/3 min-w-[250px] flex-col gap-[2vw]"
    >
      {images.map((img, i) => {
        return (
          <div
            key={i}
            className="relative w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <Zoom
              zoomImg={{ src: img.src, alt: `Gallery Image` }}
              canSwipeToUnzoom={true}
              zoomMargin={40}
            >
              <img
                src={img.src}
                alt={`Gallery Image`}
                className="h-auto w-full rounded-2xl object-contain"
                loading="lazy"
              />
            </Zoom>
          </div>
        )
      })}
    </motion.div>
  )
}
