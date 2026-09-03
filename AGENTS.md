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
- COS 迁移维护命令是 `pnpm assets:inventory`、`pnpm assets:upload`、`pnpm assets:verify` 和 `pnpm assets:check`；只有 `assets:upload --apply` 会执行上传。

**来源**

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.js`
- `scripts/post-build.ts`
- `scripts/cos-assets.ts`

**何时更新**

- `package.json`、lockfile、TypeScript/Next 配置或构建脚本变化时。

**后续修改前先看**

- `package.json`
- `tsconfig.json`
- `next.config.js`
- `scripts/cos-assets.ts`

## 目录职责

**结论**

- `app/` 承载 App Router 页面和 `app/api/*` Route Handlers；`components/`、`layouts/`、`css/` 提供 UI、布局和样式层。
- `data/` 保存站点元数据和 MDX 内容源，`contentlayer.config.ts` 定义内容模型；`public/` 保存静态资源。
- `server/` 放服务端辅助模块，例如 GitHub GraphQL 查询、Prisma client、Markdown TOC 提取；`prisma/` 维护浏览量表的 schema 与迁移。
- `lib/admin-*` 与 `app/api/admin/` 共同实现管理后台认证、GitHub 内容读写和 COS 图片上传。
- `scripts/cos-assets*` 负责静态资源清点、COS 上传与校验；`data/cos-assets-manifest.json` 是当前 Git 资源的内容哈希清单。

**来源**

- `app/`
- `components/`
- `data/`
- `contentlayer.config.ts`
- `server/`
- `prisma/schema.prisma`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`
- `lib/admin-assets.ts`
- `scripts/cos-assets.ts`
- `data/cos-assets-manifest.json`

**何时更新**

- 顶层目录职责、内容目录、管理后台或数据边界变化时。

**后续修改前先看**

- `app/`
- `data/`
- `contentlayer.config.ts`
- `lib/admin-content.ts`
- `server/`
- `scripts/cos-assets/`

## 核心系统与数据流

**结论**

- 内容由 `data/blog`、`data/gallery`、`data/snippets` 等 MDX 源文件进入 Contentlayer；构建时生成标签数据和本地搜索索引。新增画廊 MDX 后仍需手动更新 `data/gallery.ts`。
- 浏览量 Route Handlers 通过 Prisma `views` 表读写；开发环境的 POST 不会自增，生产环境才会写入。
- 管理后台通过同源 `/api/admin/*` 工作：凭据由环境变量校验，签名会话放入 HttpOnly Cookie；文章 CRUD 通过 GitHub API 读取并提交仓库中的 MDX 内容，而不是写入本地文件或独立数据库。
- 新建文章编辑器会把有实际内容的表单按版本化结构自动保存到当前浏览器的 `localStorage`，刷新后先校验再恢复。这个本地工作草稿独立于文章 frontmatter 的 `draft` 发布状态，成功提交到 GitHub 后会清除；编辑已有文章暂不自动保存。
- 管理编辑器会把粘贴到封面或正文输入框的图片提交到 `/api/admin/assets`。该上传路径不经过 Routing Middleware，避免其 4 MB 请求体限制，但 Route Handler 仍会在服务端校验签名会话、同源请求、4 MB 文件上限和实际图片格式，再使用 COS 密钥上传。客户端会兼容平台返回的非 JSON 错误页；正文会插入 Markdown 图片链接，封面会回填公开 URL。
- 当前分支的位图引用已经切换到 Tencent COS，430 个本地位图和 4 个 Playwright 截图已删除。冻结清单按本地原图 SHA-256 将 430 个路径映射为 402 个远端对象；Bucket 工作流会在上传后压缩图片并可能转换格式。SVG 明确保留在 Git 且不上传，字体仍是待确认范围；Git 历史清理尚未执行。

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
- `lib/admin-post-draft.ts`
- `hooks/use-new-post-draft.ts`
- `components/admin/post-editor.tsx`
- `lib/admin-assets.ts`
- `lib/admin-api-response.ts`
- `app/api/admin/assets/route.ts`
- `middleware.ts`
- `scripts/cos-assets/config.ts`
- `scripts/cos-assets.ts`
- `scripts/cos-assets/`
- `data/cos-assets-manifest.json`

**何时更新**

- 内容模型、Route Handler、数据库 schema、管理后台认证、浏览器草稿机制或 GitHub 内容写入方式变化时。

**后续修改前先看**

- `contentlayer.config.ts`
- `data/gallery.ts`
- `app/api/admin/`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`
- `lib/admin-post-draft.ts`
- `hooks/use-new-post-draft.ts`

## 配置与环境变量

**结论**

- Next 侧配置主要分布在 `next.config.js`、`data/site-metadata.ts` 和 `contentlayer.config.ts`，覆盖 CSP、安全头、图片远程域和第三方内容功能。
- 浏览量使用 Prisma 的 `DATABASE_URL`。管理后台在部署环境需要认证变量，以及具有内容读写权限的 GitHub token、仓库所有者、仓库名和目标分支配置。
- COS 维护工具和管理后台图片上传共用 Bucket、Region、存储类型、前缀、公开域名和访问凭据。管理后台部署到 Vercel 后，Production 和需要使用上传功能的 Preview 环境必须分别配置这些服务端变量；变量不得使用 `NEXT_PUBLIC_` 前缀。`STANDARD` 与 `MAZ_STANDARD` 必须分别匹配单可用区和多可用区 Bucket。
- 本地 COS 配置保存在根目录 `.env.local`。该文件由 Git 忽略，任何输出都不得显示变量值。

**来源**

- `next.config.js`
- `data/site-metadata.ts`
- `docs/cos-assets-migration.md`
- `contentlayer.config.ts`
- `prisma/schema.prisma`
- `lib/admin-auth.ts`
- `lib/admin-content.ts`
- `lib/admin-assets.ts`
- `lib/tencent-cos.ts`
- `.env.example`
- `scripts/cos-assets/config.ts`

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
- Tencent COS 已成为站点位图的运行时资源源；迁移工具和管理后台上传 Route Handler 都使用 `cos-nodejs-sdk-v5`，该包必须作为生产依赖安装。`data/cos-assets-manifest.json` 保留本次本地路径到对象键的冻结映射。

**来源**

- `vercel.json`
- `lib/admin-content.ts`
- `next.config.js`
- `data/site-metadata.ts`
- `app/api/`
- `server/`
- `docs/cos-assets-migration.md`
- `scripts/cos-assets/`

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
- 高风险点是画廊索引的人工同步、管理后台所需 GitHub token 与 COS 前缀写入权限，以及管理后台提交后的构建发布延迟。
- `.env.local` 不得加入 Git；公开模板只使用 `.env.example`，真实凭据保存在本地或部署平台，并在疑似泄露后立即轮换。`assets:upload` 默认只执行 dry-run，`--apply` 是明确的外部写入边界；执行前必须人工核对目标 Bucket、Region 和前缀，且不得扩大凭据权限。

**来源**

- `.husky/pre-commit`
- `.husky/commit-msg`
- `commitlint.config.js`
- `tsconfig.json`
- `data/gallery.ts`
- `lib/admin-content.ts`
- `scripts/cos-assets.ts`
- `README.md`
- `docs/cos-assets-migration.md`
- `scripts/cos-assets/cos.ts`

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
