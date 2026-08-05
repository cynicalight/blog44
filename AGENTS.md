# AGENTS.md

此文件面向维护者和 agent，记录当前仓库中经过代码与配置验证的项目事实。

## 项目概览

**结论**

- 这是一个单一 Next.js App Router 内容站点；页面、管理后台和服务端 API 都由同一个 Next 应用提供。
- 仓库不再包含独立后端运行时。`/admin` 是主站内的管理界面，`app/api/admin/*` 是对应的 Next Route Handlers。

**来源**

- `package.json`
- `app/`
- `app/api/admin/`
- `middleware.ts`
- `vercel.json`

**何时更新**

- 新增独立服务、顶层应用目录或替换主应用框架时。

**后续修改前先看**

- `package.json`
- `app/`
- `app/api/`
- `vercel.json`

## 技术栈与运行方式

**结论**

- 主栈是 Next.js 16、React 19、TypeScript、Tailwind CSS、Contentlayer 和 Prisma，包管理器是 pnpm。
- `pnpm dev` 在 3434 端口启动开发服务器；`pnpm build` 依次运行 `prisma generate`、Next build 与 `scripts/post-build.ts`。
- 仓库没有独立测试脚本；`pnpm lint` 实际执行 `tsc --noEmit` 类型检查。

**来源**

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.js`
- `scripts/post-build.ts`

**何时更新**

- `package.json`、lockfile、TypeScript/Next 配置或构建脚本变化时。

**后续修改前先看**

- `package.json`
- `tsconfig.json`
- `next.config.js`

## 目录职责

**结论**

- `app/` 承载 App Router 页面和 `app/api/*` Route Handlers；`components/`、`layouts/`、`css/` 提供 UI、布局和样式层。
- `data/` 保存站点元数据和 MDX 内容源，`contentlayer.config.ts` 定义内容模型；`public/` 保存静态资源。
- `server/` 放服务端辅助模块，例如 GitHub GraphQL 查询、Prisma client、Markdown TOC 提取；`prisma/` 维护浏览量表的 schema 与迁移。
- `lib/admin-*` 与 `app/api/admin/` 共同实现管理后台认证和 GitHub 内容读写。

**来源**

- `app/`
- `components/`
- `data/`
- `contentlayer.config.ts`
- `server/`
- `prisma/schema.prisma`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`

**何时更新**

- 顶层目录职责、内容目录、管理后台或数据边界变化时。

**后续修改前先看**

- `app/`
- `data/`
- `contentlayer.config.ts`
- `lib/admin-content.ts`
- `server/`

## 核心系统与数据流

**结论**

- 内容由 `data/blog`、`data/gallery`、`data/snippets` 等 MDX 源文件进入 Contentlayer；构建时生成标签数据和本地搜索索引。新增画廊 MDX 后仍需手动更新 `data/gallery.ts`。
- 浏览量 Route Handlers 通过 Prisma `views` 表读写；开发环境的 POST 不会自增，生产环境才会写入。
- 管理后台通过同源 `/api/admin/*` 工作：凭据由环境变量校验，签名会话放入 HttpOnly Cookie；文章 CRUD 通过 GitHub API 读取并提交仓库中的 MDX 内容，而不是写入本地文件或独立数据库。

**来源**

- `contentlayer.config.ts`
- `data/gallery.ts`
- `app/api/views/route.ts`
- `app/api/views/[...slug]/route.ts`
- `server/prisma.server.ts`
- `prisma/schema.prisma`
- `app/api/admin/`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`

**何时更新**

- 内容模型、Route Handler、数据库 schema、管理后台认证或 GitHub 内容写入方式变化时。

**后续修改前先看**

- `contentlayer.config.ts`
- `data/gallery.ts`
- `app/api/admin/`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`

## 配置与环境变量

**结论**

- Next 侧配置主要分布在 `next.config.js`、`data/site-metadata.ts` 和 `contentlayer.config.ts`，覆盖 CSP、安全头、图片远程域和第三方内容功能。
- 浏览量使用 Prisma 的 `DATABASE_URL`。管理后台在部署环境需要认证变量，以及具有内容读写权限的 GitHub token、仓库所有者、仓库名和目标分支配置。

**来源**

- `next.config.js`
- `data/site-metadata.ts`
- `contentlayer.config.ts`
- `prisma/schema.prisma`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`

**何时更新**

- 运行时配置、第三方集成、数据库或管理后台 GitHub 接入方式变化时。

**后续修改前先看**

- `next.config.js`
- `data/site-metadata.ts`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`

## 部署与外部依赖

**结论**

- 主站、管理页面和 `app/api/*` Route Handlers 一并部署到 Vercel；`vercel.json` 定义 pnpm 安装和构建命令，并将 `/stats/*` 重写到 Umami。
- 管理后台依赖 GitHub API 持久化内容变更；向目标分支提交内容后，由仓库与 Vercel 的部署集成发布新的站点构建。
- 站点还接入 Umami、Giscus、Buttondown、Spotify 与 GitHub GraphQL，接入点分散在 `data/site-metadata.ts`、`app/api/*` 和 `server/*`。

**来源**

- `vercel.json`
- `lib/admin-content.ts`
- `next.config.js`
- `data/site-metadata.ts`
- `app/api/`
- `server/`

**何时更新**

- 部署平台、外部服务、GitHub 内容写入权限或安全头策略变化时。

**后续修改前先看**

- `vercel.json`
- `lib/admin-content.ts`
- `next.config.js`
- `data/site-metadata.ts`

## 工程约定与危险点

**结论**

- Husky 的 `pre-commit` 通过 lint-staged 对常见文本与代码文件运行 Prettier；`commit-msg` 通过 commitlint 强制 Conventional Commits。
- TypeScript 未开启完整 strict mode，但开启了 `strictNullChecks`；`~/*` 是默认导入别名。
- 高风险点是画廊索引的人工同步、管理后台所需 GitHub token 的写入权限，以及管理后台提交后的构建发布延迟。

**来源**

- `.husky/pre-commit`
- `.husky/commit-msg`
- `commitlint.config.js`
- `tsconfig.json`
- `data/gallery.ts`
- `lib/admin-content.ts`

**何时更新**

- 提交流程、格式化策略、路径别名、内容同步或管理后台写入机制变化时。

**后续修改前先看**

- `.husky/`
- `tsconfig.json`
- `data/gallery.ts`
- `lib/admin-content.ts`

## 维护指南

**结论**

- 页面、组件或 Route Handler 的小范围变更通常只需增量更新对应章节；更改构建链、部署目标、数据层或顶层子系统时需全量重审此文件。
- 维护事实时优先相信当前代码和可执行配置，而不是历史阶段文档。

**来源**

- `AGENTS.md`
- `package.json`
- `vercel.json`
- `contentlayer.config.ts`
- `prisma/schema.prisma`

**何时更新**

- `AGENTS.md` 与源码不一致，或主框架、部署、内容与数据系统发生变化时。

**后续修改前先看**

- `AGENTS.md`
- `package.json`
- `vercel.json`
- `contentlayer.config.ts`
- `prisma/schema.prisma`
