import type { ReactNode } from 'react'

export function PostTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-[family-name:var(--font-exo-2)] text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl md:leading-tight">
      {children}
    </h1>
  )
}
