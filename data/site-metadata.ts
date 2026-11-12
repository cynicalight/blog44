export const SITE_METADATA = {
  title: `Bu44er's blog - Bu44er's coding journey`,
  author: 'Bu44er',
  headerTitle: `Bu44er's blog`,
  description:
    'A personal space on the cloud where I document my programming journey, sharing lessons, insights, and resources for fellow developers.',
  language: 'en-us',
  theme: 'dark', // dark or light
  siteUrl: 'https://www.bu44er.ink',
  siteRepo: 'https://github.com/cynicalight/bu44er.ink',
  siteLogo: `https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/b6/b668caed71a8836a69d55f03affb92218ae4d6d978663579a278f73f3e8577fe.jpg`,
  socialBanner:
    'https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/4e/4eca87e6c32b6a0db30e27a9a4bee7377982fdf2d8dd21d1ab9ba714843377c8.webp',

  locale: 'en-US',
  stickyNav: true,
  analytics: {
    umamiAnalytics: {
      websiteId: process.env.NEXT_UMAMI_ID,
      shareUrl: 'https://analytics.eu.umami.is/share/EqvpZYPABxaQA3mr/mengke.me',
    },
  },
  newsletter: {
    // supports mailchimp, buttondown, convertkit, klaviyo, revue, emailoctopus, beehive
    // Please add your .env file and modify it according to your selection
    provider: 'buttondown',
  },
  comments: {
    provider: 'giscus', // supported providers: giscus, utterances, disqus
    giscusConfig: {
      // https://giscus.app/
      repo: 'cynicalight/blog44',
      repositoryId: 'R_kgDOUMzByA',
      category: 'Announcements',
      categoryId: 'DIC_kwDOUMzByM4DExtH',
      mapping: 'title', // supported options: pathname, url, title
      reactions: '1', // Emoji reactions: 1 = enable / 0 = disable
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'zh-CN',
    },
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      // path to load documents to search
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}
