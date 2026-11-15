import { JetBrains_Mono, Playpen_Sans, Exo_2, Silkscreen } from 'next/font/google'

export const FONT_JETBRAINS_MONO = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const FONT_PLAYPEN_SANS = Playpen_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playpen-sans',
})

export const FONT_EXO_2 = Exo_2({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-exo-2',
  style: ['normal', 'italic'],
})

export const FONT_SILKSCREEN = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-silkscreen',
})
