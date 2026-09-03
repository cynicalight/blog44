<h1 align="center">bu44er.ink 🧑‍💻</h1>

<div align="center">

[English](./README.md)

</div>

<img style="border-radius: 6px" src="https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/bu44er-ink/assets/51/51ce023adc70b7d6dda49c3ff71ed9134e6899ccee59e87b1d0ea65022b6e6e9.png">

## 项目结构

```
app/ - Next.js App Router
    layout.tsx: 全局布局组件，包含头部、底部、主题切换
    page.tsx: 主页组件
    blog/[...slug]/page.tsx: 博客文章动态路由
    api/: 服务器API端点
components/ - 可复用组件
    ui/: 基础UI组件（按钮、输入框、卡片）
    blog/: 博客相关组件（文章列表、标签、评论）
    mdx/: MDX渲染增强组件
    gallery/: 图片画廊组件
    header/, footer/: 页面结构组件
layouts/ - 页面布局模板
    post-layout.tsx: 博客文章布局
    list-layout.tsx: 列表页面布局
data/ - 内容数据
    blog/: MDX格式博客文章
    authors/: 作者信息
    site-metadata.ts: 网站元数据
public/ - 静态资源
    static/images/: 图片资源
    fonts/: 字体文件
css/ - 全局样式
    tailwind.css: TailwindCSS入口
    gallery.css: 画廊特定样式
prisma/ - 数据库交互
    schema.prisma: 数据库模型定义
    migrations/: 数据库迁移文件
utils/, hooks/, server/ - 功能代码
    工具函数、自定义钩子、服务器端逻辑
```

## 技术栈

- 🪤 托管在 [Vercel](https://vercel.com/)。
- 🧱 使用 **React 18+** 和 **NextJS 14+** 构建。
- 📊 使用 [Umami](https://umami.is/) 分级监控网站。
- 🎉 采用 **Typescript**，使用 [Conventional Commits](https://www.conventionalcommits.org/) 进行提交。

## 演示

演示站：<https://bu44er.ink>

## 如何部署一个同样的博客？

> 我这里只描述基本的操作步骤。如果你是零基础或在部署过程中遇到任何问题，请发邮件给我：391900788DOTqqDOTcom

### 1. 安装

1. Clone 或 Fork 本仓库。

2. 运行 `npm install` 或 `yarn` 安装依赖。

### 2. 修改数据

1. 将根目录下的 `.env.example` 文件重命名为 `.env`，并修改其中的值。

2. 更新 `/data` 目录下各文件中的信息，这里包含了博客的数据。

> **⚠️ 画廊文章重要提醒：**
>
> 当添加新的画廊文章（`data/gallery/` 目录下的 `.mdx` 文件）时，必须手动更新 `data/gallery.ts` 文件以添加相应的条目。该文件控制哪些画廊显示在画廊索引页面中。
>
> 示例：
>
> ```typescript
> {
>   type: 'trip',
>   title: '你的画廊标题',
>   description: '画廊描述',
>   imgSrc: 'https://bu44er-1313346488.cos.ap-shanghai.myqcloud.com/path/to/cover.webp',
>   url: '/gallery/YYYY/gallery-slug',
> }
> ```

### 3. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmk965%2Fmengke.me&env=NEXT_PUBLIC_GISCUS_REPO,NEXT_PUBLIC_GISCUS_REPOSITORY_ID,NEXT_PUBLIC_GISCUS_CATEGORY,NEXT_PUBLIC_GISCUS_CATEGORY_ID,NEXT_UMAMI_ID,SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,SPOTIFY_REFRESH_TOKEN,DATABASE_URL,GITHUB_API_TOKEN&envDescription=Giscus%5CUmami%5CSpotify%5CData%5CGithub&envLink=https%3A%2F%2Fgithub.com%2Fmk965%2Fmengke.me%2Fblob%2Fmain%2F.env.example&project-name=mengke-me-blog&repository-name=mengke-me-blog&demo-title=mengke.me&demo-description=Mengke's%20blog%20-%20Mengke's%20coding%20journey&demo-url=https%3A%2F%2Fwww.mengke.me%2F&demo-image=https%3A%2F%2Fwww.mengke.me%2Fstatic%2Fimages%2Fhome_page.webp)

### 4. 博文的访问量也可以免费存储在 Vercel 中

1. 在 Vercel 中创建一个 `Postgres Database`。

2. 你会得到一个类似于：`postgres://default:xxxxx@xx-xx-xx-xxxx.us-xx-x.postgres.vercel-storage.com:xxx/verceldb` 的字符串，将其添加到 `DATABASE_URL` 变量中。

3. 运行 `npx prisma db push` 来创建 `views` 表。

4. 每篇博文的阅读量会被自动统计到这个数据库中。

## ☕️ 支持开源

感谢原作者：[Mengke](https://github.com/mengke)

<a href='https://ko-fi.com/P5P2ZV7NP' target='_blank'><img height='50' style='border:0px;height:50px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
