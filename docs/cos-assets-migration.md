# COS 静态资源迁移

当前迁移工具只处理当前提交中由 Git 跟踪的图片、SVG 和可选字体。只存在于旧提交中的资源将在历史重写阶段删除，默认不会上传 COS。

## 本地配置

将以下变量写入仓库根目录的 `.env.local`：

```dotenv
TENCENT_COS_SECRET_ID=
TENCENT_COS_SECRET_KEY=
TENCENT_COS_SESSION_TOKEN=
TENCENT_COS_BUCKET=
TENCENT_COS_REGION=
TENCENT_COS_PREFIX=
TENCENT_COS_PUBLIC_BASE_URL=
```

`TENCENT_COS_BUCKET` 必须包含 APPID。`TENCENT_COS_PUBLIC_BASE_URL` 是最终公开访问资源的 HTTPS 域名，不应包含对象前缀。只有使用临时密钥时才需要 `TENCENT_COS_SESSION_TOKEN`。

工具不会输出密钥值。当前仓库按维护者要求跟踪 `.env.local`，因此不得将仓库改为公开可见。

## 命令

```bash
# 生成当前资源清单；字体默认标记为待确认
pnpm assets:inventory

# 将字体也纳入上传集合
pnpm assets:inventory --include-fonts

# 展示目标桶、对象数量和前十条 URL，不访问 COS
pnpm assets:upload

# 上传；已存在的对象必须通过哈希、大小和 MIME 校验，否则停止
pnpm assets:upload --apply

# 校验 COS 元数据、完整下载内容和公开 URL
pnpm assets:verify

# 检查当前 Git 资源是否仍与清单一致
pnpm assets:check
```

资源使用 SHA-256 内容寻址。相同内容和相同扩展名只上传一次。上传前会重新生成并完整比对清单，上传时还会重新读取实际字节并计算哈希。对象使用一年不可变缓存；文件内容变化时会产生新的对象键，不覆盖旧对象。

验证阶段会完整下载每个 COS 对象并重新计算 SHA-256，同时确认 COS 的 CRC64 在 HEAD 与 GET 响应间一致。工具也会通过公开域名重新下载对象，并核对实际字节、SHA-256、MIME、缓存策略和未压缩内容长度。公开访问必须始终使用 HTTPS。

## 当前迁移门槛

在真实上传前必须确定完整存储桶名称、Region、目标前缀、公开 HTTPS 域名、桶访问策略，以及是否迁移字体。上传完成且全部对象验证通过后，才能替换站点引用和删除本地资源。
