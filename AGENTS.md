# AGENTS.md

此文件面向维护者和 agent，记录当前仓库中经过代码与配置验证的项目事实。

## 项目概览

**结论**

- 这是一个以内容站点为主体的混合仓库：主应用是 Next.js App Router 站点，仓库内还包含一个独立的 Go/Gin 后端服务和一组管理后台页面。
- 仓库不是典型 monorepo，但同时维护前端内容系统、Next Route Handler、Prisma 持久化和 `backend/` 下的第二运行时。
- 维护时要把“主站功能”和“后台/后端实验功能”分开看；两者共用同一仓库，但启动方式和鉴权边界并不统一。

**来源**

- `package.json`
- `app/`
- `backend/main.go`
- `middleware.ts`
- `docs/admin-phase1-complete.md`

**何时更新**

- 新增或删除顶层子系统，例如引入 `packages/`、替换 `backend/`、或把管理后台拆到独立服务时。

**后续修改前先看**

- `package.json`
- `app/`
- `backend/`
- `middleware.ts`

## 技术栈与运行方式

**结论**

- 前端主栈是 `Next.js 16`、`React 19`、`TypeScript`、`Tailwind CSS`、`Contentlayer`、`Prisma`，包管理器是 `pnpm`。
- `pnpm dev` 会在 `3434` 端口启动 Next 开发服务；`pnpm build` 会先执行 `prisma generate`，再执行 Next build，最后运行 `scripts/post-build.ts`。
- 仓库没有独立的测试脚本；`pnpm lint` 实际上是 `tsc --noEmit` 类型检查，不是 ESLint。
- `backend/` 是单独的 Go 模块，需要单独运行，默认通过环境变量中的 `PORT` 提供 API。

**来源**

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `next.config.js`
- `backend/go.mod`
- `backend/main.go`
- `scripts/post-build.ts`

**何时更新**

- `package.json`、lockfile、TypeScript/Next 配置、Go 模块或构建脚本变化时。

**后续修改前先看**

- `package.json`
- `tsconfig.json`
- `next.config.js`
- `backend/go.mod`

## 目录职责

**结论**

- `app/` 承载 App Router 页面和 `app/api/*` Route Handlers；`components/`、`layouts/`、`css/` 提供 UI、布局和样式层。
- `data/` 保存站点元数据和 MDX 内容源，`contentlayer.config.ts` 定义内容模型；`public/` 保存静态资源。
- `server/` 放服务端辅助模块，例如 GitHub GraphQL 查询、Prisma client、Markdown TOC 提取；`prisma/` 只维护浏览量表的 schema 与迁移。
- `backend/` 是独立 Go API；`docs/` 和 `guides/` 保存补充说明，但这些文档不是主事实源。

**来源**

- `app/`
- `components/`
- `layouts/`
- `data/`
- `contentlayer.config.ts`
- `server/`
- `prisma/schema.prisma`
- `backend/`

**何时更新**

- 顶层目录职责变化、新增服务边界、或内容/数据目录迁移时。

**后续修改前先看**

- `app/`
- `data/`
- `contentlayer.config.ts`
- `server/`
- `backend/`

## 核心系统与数据流

**结论**

- 内容流由 `data/blog`、`data/gallery`、`data/snippets` 等 MDX 源文件进入 `contentlayer.config.ts`，构建时生成标签数据和本地搜索索引。
- 画廊系统存在人工同步点：新增 `data/gallery/**/*.mdx` 后，还需要手动更新 `data/gallery.ts`，否则首页索引不会出现新画廊。
- 浏览量流通过 `app/api/views/route.ts` 和 `app/api/views/[...slug]/route.ts` 访问 Prisma `views` 表；开发环境下 `POST` 不会写入计数，只有生产环境会自增。
- 管理后台前端使用 `lib/auth-context.tsx` 调用 `http://localhost:8080/api/login` 并把 token 放在 `localStorage`；但 `middleware.ts` 检查的是 `admin_token` cookie，这说明前端登录状态与路由保护机制目前并不一致。
- `backend/routes/routes.go` 定义了独立的 Go API，公开路由和 JWT/角色保护路由都在 `/api` 下；若调试后台功能，通常需要同时看 Next 前端和 Go 后端。

**来源**

- `contentlayer.config.ts`
- `data/gallery.ts`
- `docs/网站补充说明.md`
- `app/api/views/route.ts`
- `app/api/views/[...slug]/route.ts`
- `server/prisma.server.ts`
- `prisma/schema.prisma`
- `lib/auth-context.tsx`
- `middleware.ts`
- `backend/routes/routes.go`

**何时更新**

- 内容模型、Route Handler、数据库 schema、鉴权方案、后台 API 接入方式变化时。

**后续修改前先看**

- `contentlayer.config.ts`
- `data/gallery.ts`
- `app/api/views/route.ts`
- `app/api/views/[...slug]/route.ts`
- `lib/auth-context.tsx`
- `middleware.ts`
- `backend/routes/routes.go`

## 配置与环境变量

**结论**

- `.env.example` 是当前可见的环境变量总入口，覆盖 Prisma/Postgres、JWT、前端 API 地址和 Go 后端运行参数。
- Next 侧配置主要分布在 `next.config.js`、`data/site-metadata.ts` 和 `contentlayer.config.ts`；这些文件定义 CSP、安全头、图片远程域、评论/分析/搜索/Newsletter 行为。
- 后端和前端共享一部分环境概念，但并不是同一套运行时：Go 后端需要自己的 `.env`，前端也依赖多组第三方集成变量。

**来源**

- `.env.example`
- `next.config.js`
- `data/site-metadata.ts`
- `contentlayer.config.ts`
- `backend/main.go`

**何时更新**

- `.env.example`、运行时配置文件、第三方集成方式或服务间地址关系变化时。

**后续修改前先看**

- `.env.example`
- `next.config.js`
- `data/site-metadata.ts`
- `contentlayer.config.ts`
- `backend/config/`

## 部署与外部依赖

**结论**

- 主站部署目标是 Vercel，`vercel.json` 明确了 `pnpm install`、`pnpm run build`、`pnpm dev`，并把 `/stats/*` 重写到 Umami。
- 站点直接依赖 Umami、Giscus、Buttondown、Spotify、GitHub GraphQL 等外部服务；这些接入点分散在 `data/site-metadata.ts`、`app/api/*` 和 `server/*`。
- `next.config.js` 同时维护了 CSP、安全头和较宽松的图片远程域白名单；改外部服务或资源来源时要同步审查这里。

**来源**

- `vercel.json`
- `next.config.js`
- `data/site-metadata.ts`
- `app/api/github/route.ts`
- `app/api/spotify/route.ts`
- `app/api/newsletter/route.ts`
- `server/github.server.ts`

**何时更新**

- 部署平台、外部服务、分析系统、评论系统、图片来源或安全头策略变化时。

**后续修改前先看**

- `vercel.json`
- `next.config.js`
- `data/site-metadata.ts`
- `app/api/`
- `server/`

## 工程约定与危险点

**结论**

- 提交流程由 Husky 驱动：`pre-commit` 执行 `lint-staged`，对常见文本与代码文件运行 `prettier --write`；`commit-msg` 使用 `commitlint` 强制 Conventional Commits。
- TypeScript 配置不是完全严格模式，`strict` 为 `false`，但 `strictNullChecks` 为 `true`；改类型逻辑时不要误以为仓库已开启完整严格检查。
- `~/*` 路径别名是全仓默认导入习惯；`contentlayer/generated` 也在路径映射里。
- 已知高风险点包括：画廊索引的人工同步、后台前端与中间件的 token 机制不一致、以及仓库缺少统一自动化测试覆盖。

**来源**

- `.husky/pre-commit`
- `.husky/commit-msg`
- `commitlint.config.js`
- `package.json`
- `tsconfig.json`
- `data/gallery.ts`
- `lib/auth-context.tsx`
- `middleware.ts`

**何时更新**

- 提交流程、格式化策略、路径别名、人工同步点或已知风险被修复/新增时。

**后续修改前先看**

- `.husky/pre-commit`
- `.husky/commit-msg`
- `commitlint.config.js`
- `tsconfig.json`
- `data/gallery.ts`
- `lib/auth-context.tsx`
- `middleware.ts`

## 维护指南

**结论**

- 小范围功能变更优先增量刷新 `AGENTS.md`：页面和组件改动通常只影响“目录职责”或“核心系统与数据流”；配置、部署、数据模型变化再更新对应章节。
- 遇到 `package.json`、lockfile、`next.config.js`、`vercel.json`、`contentlayer.config.ts`、`prisma/schema.prisma`、`backend/go.mod` 这类核心文件变化时，默认按全量重审处理。
- 后续如果要自动维护本文件，优先使用全局 skill `~/.codex/skills/project-agent-maintainer/` 下的脚本和模板，不要直接靠 README 摘抄结论。

**来源**

- `~/.codex/skills/project-agent-maintainer/SKILL.md`
- `~/.codex/skills/project-agent-maintainer/references/change-triggers.md`
- `~/.codex/skills/project-agent-maintainer/scripts/detect_project_facts.py`
- `~/.codex/skills/project-agent-maintainer/scripts/detect_refresh_scope.py`

**何时更新**

- `AGENTS.md` 与源码明显不一致、skill 规则更新、或仓库出现新的顶层子系统时。

**后续修改前先看**

- `AGENTS.md`
- `~/.codex/skills/project-agent-maintainer/SKILL.md`
- `~/.codex/skills/project-agent-maintainer/references/change-triggers.md`
- `~/.codex/skills/project-agent-maintainer/references/section-schema.md`
