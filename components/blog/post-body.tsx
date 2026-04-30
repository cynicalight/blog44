'use client'

import type { ReactNode } from 'react'

export function PostBody({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 2000px',
      }}
    >
      {children}
    </div>
  )
}
