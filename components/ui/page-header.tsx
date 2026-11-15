import { PixelEyebrow, PixelRule } from '~/components/lunar/pixel-ui'

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="space-y-4 pb-2 pt-2 md:space-y-6">
      <PixelEyebrow>BU44ER / {title}</PixelEyebrow>
      <h1 className="font-[family-name:var(--font-exo-2)] text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-6xl">
        {title}
      </h1>
      <div className="max-w-2xl text-gray-600 dark:text-gray-400 md:text-lg md:leading-7">
        {description}
      </div>
      {children}
      <PixelRule className="!mt-8" />
    </header>
  )
}
