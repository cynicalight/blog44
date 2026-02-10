'use client'

import { Image, Zoom, type ImageProps } from '~/components/ui/image'
import { MDX_COMPONENTS } from '~/components/mdx'
import { useState } from 'react'
import React from 'react'

// 增强的图片组件，统一尺寸显示
const EnhancedGalleryImage = ({ alt = '', src, style, width, height, ...rest }: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)

  if (!src) return null

  return (
    <Zoom zoomImg={{ src, alt }} canSwipeToUnzoom={true} zoomMargin={60}>
      <div className="gallery-image">
        <img
          alt={alt}
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            margin: '0',
            padding: '0',
            ...style,
          }}
          className="transition-transform duration-300 hover:scale-105"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </Zoom>
  )
}

// Gallery 专用的 MDX 组件
export const GALLERY_MDX_COMPONENTS = {
  ...MDX_COMPONENTS,
  // 覆盖默认的 img 标签渲染
  img: (props: ImageProps) => {
    return (
      <div className="gallery-item">
        <EnhancedGalleryImage {...props} />
      </div>
    )
  },
  // 覆盖 Image 组件渲染 (用于包含 width/height 的图片)
  Image: (props: ImageProps) => {
    return (
      <div className="gallery-item">
        <EnhancedGalleryImage {...props} />
      </div>
    )
  },
  // 移除wrapper，让每个图片单独渲染
}

// 隐藏 MDX 正文中的图片 (用于 Parallax 布局)
export const HIDDEN_GALLERY_MDX_COMPONENTS = {
  ...MDX_COMPONENTS,
  // 将图片渲染为空，但保留组件定义以防止 MDX 错误
  img: (props: any) => null,
  Image: (props: any) => null,
  // 仅在段落有真实可见内容时渲染，避免图片被隐藏后留下空白段落
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => {
    const hasVisibleContent = (node: React.ReactNode): boolean => {
      return React.Children.toArray(node).some((child) => {
        if (typeof child === 'string') return child.trim().length > 0
        if (typeof child === 'number') return true
        if (!React.isValidElement(child)) return false

        const childType = child.type
        if (childType === 'img') return false

        const typeName =
          typeof childType === 'function'
            ? ((childType as React.ComponentType & { displayName?: string }).displayName ??
              childType.name ??
              '')
            : ''
        if (typeName === 'Image') return false

        const childProps = child.props as Record<string, unknown> | undefined
        if (typeof childProps?.src === 'string' && !childProps.children) return false

        return hasVisibleContent(childProps?.children as React.ReactNode) || !childProps?.children
      })
    }

    if (!hasVisibleContent(props.children)) return null
    return <p {...props} />
  },
}
