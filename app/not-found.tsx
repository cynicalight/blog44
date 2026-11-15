import { PixelEyebrow } from '~/components/lunar/pixel-ui'
import { Container } from '~/components/ui/container'
import { Link } from '~/components/ui/link'

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <PixelEyebrow phase={0}>404 / Lost in orbit</PixelEyebrow>
      <h1 className="font-[family-name:var(--font-exo-2)] text-4xl font-semibold tracking-tight md:text-6xl">
        Nothing out here.
      </h1>
      <p className="max-w-md text-gray-600 dark:text-gray-400">
        This page drifted off. Hover the moon in the corner to find your way, or head home.
      </p>
      <Link
        href="/"
        className="border border-dashed border-gray-400 px-4 py-2 font-pixel text-[11px] tracking-[0.25em] transition-colors hover:border-gray-900 dark:border-white/20 dark:hover:border-white"
      >
        BACK HOME →
      </Link>
    </Container>
  )
}
