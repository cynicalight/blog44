import { clsx } from 'clsx'

export function GradientBorder({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx([
        'relative h-full w-full',
        'border border-gray-200 dark:border-zinc-800',
        className,
      ])}
    >
      <span
        className={clsx([
          'absolute -top-px right-4 h-px w-[40%]',
          'bg-gradient-to-r from-gray-500/0 via-gray-500/40 to-gray-500/0',
          'dark:from-white/0 dark:via-white/40 dark:to-white/0',
        ])}
      />
      <span
        className={clsx([
          'absolute -left-px top-4 h-[40%] w-px',
          'bg-gradient-to-b from-gray-500/0 via-gray-500/40 to-gray-500/0',
          'dark:from-white/0 dark:via-white/40 dark:to-white/0',
        ])}
      />
      {children}
    </div>
  )
}
