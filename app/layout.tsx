import 'css/tailwind.css'
import 'css/twemoji.css'
import 'react-medium-image-zoom/dist/styles.css'
import 'remark-github-blockquote-alert/alert.css'
import 'katex/dist/katex.css'
import 'css/gallery.css'

import clsx from 'clsx'
import type { Metadata } from 'next'
import type { SearchConfig } from 'pliny/search'
import { SearchProvider } from 'pliny/search'
import { UmamiAnalytics } from '~/components/analytics/umami'
import { SiteChrome } from '~/components/site-chrome'
import { TiltedGridBackground } from '~/components/ui/tilted-grid-background'
import { SITE_METADATA } from '~/data/site-metadata'
import { ThemeProviders } from './theme-providers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { FONT_JETBRAINS_MONO, FONT_PLAYPEN_SANS, FONT_EXO_2 } from '~/lib/fonts'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_METADATA.siteUrl),
  title: {
    default: SITE_METADATA.title,
    template: `%s | ${SITE_METADATA.title}`,
  },
  description: SITE_METADATA.description,
  openGraph: {
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    url: './',
    siteName: SITE_METADATA.title,
    images: [SITE_METADATA.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${SITE_METADATA.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: SITE_METADATA.title,
    card: 'summary_large_image',
    images: [SITE_METADATA.socialBanner],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''

  return (
    <html
      lang={SITE_METADATA.language}
      className={clsx(
        'scroll-smooth',
        FONT_JETBRAINS_MONO.variable,
        FONT_PLAYPEN_SANS.variable,
        FONT_EXO_2.variable
      )}
      suppressHydrationWarning
    >
      <link rel="apple-touch-icon" sizes="76x76" href={`https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/18/1863a330ef629f70969df36034f2105c3d49b63107bc6dc352860c7e17c919b4.ico`} />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/c0/c0ca457521ea2a6fd618257bcf2584c162d25ce298889774ed337623fe183d35.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/c0/c0ca457521ea2a6fd618257bcf2584c162d25ce298889774ed337623fe183d35.png`}
      />
      <link rel="manifest" href={`${basePath}/static/favicons/site.webmanifest`} />
      <link
        rel="mask-icon"
        href={`${basePath}/static/favicons/safari-pinned-tab.svg`}
        color="#5bbad5"
      />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <body
        className={clsx([
          'antialiased',
          'relative min-h-screen pl-[calc(100vw-100%)]',
          'flex flex-col',
          'bg-white text-gray-900',
          'dark:bg-dark dark:text-gray-100',
        ])}
      >
        <TiltedGridBackground className="inset-x-0 top-0 z-[-1] h-[50vh]" />
        <ThemeProviders>
          <UmamiAnalytics websiteId={SITE_METADATA.analytics.umamiAnalytics.websiteId} />
          <SearchProvider searchConfig={SITE_METADATA.search as SearchConfig}>
            <SiteChrome>{children}</SiteChrome>
          </SearchProvider>
          <SpeedInsights />
        </ThemeProviders>
        <Analytics />
      </body>
    </html>
  )
}
