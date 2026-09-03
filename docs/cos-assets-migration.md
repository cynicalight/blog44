# COS 静态资源迁移

当前分支中的位图已经上传到 COS，运行时引用已经切换为 COS URL，本地位图也已删除。SVG 保留在 Git 中，不上传 COS，也未在历史重写阶段删除。只存在于旧提交中的位图已从清洗后的仓库历史中删除，也没有上传 COS。

## 本地配置

将以下变量写入仓库根目录的 `.env.local`：

```dotenv
TENCENT_COS_SECRET_ID=
TENCENT_COS_SECRET_KEY=
TENCENT_COS_SESSION_TOKEN=
TENCENT_COS_BUCKET=
TENCENT_COS_REGION=
TENCENT_COS_STORAGE_CLASS=
TENCENT_COS_PREFIX=
TENCENT_COS_PUBLIC_BASE_URL=
```

`TENCENT_COS_BUCKET` 必须包含 APPID。单可用区 Bucket 将 `TENCENT_COS_STORAGE_CLASS` 设为 `STANDARD`，多可用区 Bucket 设为 `MAZ_STANDARD`。`TENCENT_COS_PUBLIC_BASE_URL` 是最终公开访问资源的 HTTPS 域名，不应包含对象前缀。只有使用临时密钥时才需要 `TENCENT_COS_SESSION_TOKEN`。

工具不会输出密钥值。`.env.local` 已被 Git 忽略，不得提交；请从 `.env.example` 复制模板，并把真实值保存在本地或 Vercel 环境变量中。

## 命令

```bash
# 切换前使用：生成资源清单；SVG 保留在 Git，字体默认标记为待确认
pnpm assets:inventory

# 将字体也纳入上传集合
pnpm assets:inventory --include-fonts

# 展示目标桶、对象数量和前十条 URL，不访问 COS
pnpm assets:upload

# 上传；已存在对象必须保留原图 SHA-256 元数据和 MIME，否则停止
pnpm assets:upload --apply

# 使用冻结的迁移清单校验 COS 元数据、完整下载内容和公开 URL
pnpm assets:verify

# 切换前使用：检查 Git 资源是否仍与清单一致
pnpm assets:check
```

资源使用 SHA-256 内容寻址。相同内容和相同扩展名只上传一次。上传前会重新生成并完整比对清单，上传时还会重新读取实际字节并计算哈希。对象使用一年缓存；文件内容变化时会产生新的对象键，不覆盖旧对象。

Bucket 的工作流会在上传后自动压缩位图，也可能在保持尺寸的同时转换图片格式。因此远端文件大小、SHA-256 和 MIME 可以不同于本地原图。对象键和 `x-cos-meta-sha256` 始终记录本地原图哈希，供引用映射和来源核对使用。

验证阶段会确认远端对象保留原图 SHA-256 元数据和 CRC64，并完整下载压缩后的内容。工具会识别压缩结果的图片格式和尺寸，并确认响应 MIME 与实际格式一致。工具还会通过公开域名再次下载对象，确认公开响应与认证后的 COS 响应具有完全相同的字节、SHA-256、大小和 MIME，同时检查 HTTPS 与一年缓存策略。压缩工作流会移除 `immutable` 标记，因此校验只要求 `max-age=31536000`。

`data/cos-assets-manifest.json` 是本次切换的冻结映射。它继续保存已经删除的本地路径与 COS 对象键之间的对应关系，因此切换后不要再次运行 `assets:inventory` 覆盖它。`assets:verify` 不依赖本地位图，可以继续用于远端复核。

## 当前状态

- 430 个当前位图路径已映射为 402 个去重 COS 对象，并全部通过远端验证。
- 689 处真实资源引用已切换为 COS URL。
- 430 个本地位图和 4 个 Playwright 截图已从当前分支删除。
- 66 个 SVG 保留在 Git；3 个字体仍未纳入迁移。
- 清洗后的公开仓库历史不再包含旧位图、`.env.local` 或 Playwright 截图。
