import { CONTACT_HTML, EDUCATION_HTML } from '../cv/cv-document'
import { renderCvPage } from '../cv/cv-shared'

export const CV_PM_HTML = renderCvPage({
  title: '张杰 | 简历',
  body: String.raw`
      <header class="masthead">
        <div>
          <h1 class="name">张杰</h1>
          <p class="role">产品经理 · 技术出身 · 全栈交付</p>
        </div>${CONTACT_HTML}
      </header>

      <p class="lede">
        写代码出身、懂用户的产品人。习惯从真实使用场景出发找到需求，再亲手把它做成能用的产品：从定义 MVP、设计交互，到写前后端、打包发布、接住用户反馈，一个人就能把一个想法推进到有人在用。
      </p>

      <section class="section">
        <h2 class="section-label">优势<small>Profile</small></h2>
        <ol class="principles">
          <li>
            <b>用户视角</b>
            <p>从真实工作流里找痛点，用降低上手门槛、减少迁移成本、讲清楚隐私边界的方式赢得用户信任。</p>
          </li>
          <li>
            <b>技术判断</b>
            <p>具备 Go、TypeScript 与客户端全栈能力，能准确评估方案成本，与研发用同一种语言沟通取舍。</p>
          </li>
          <li>
            <b>快速交付</b>
            <p>小步快跑，快速发版，以用户反馈驱动迭代；擅长借助 AI 编程工具把验证周期从数月压缩到数周。</p>
          </li>
        </ol>
      </section>

      <section class="section">
        <h2 class="section-label">代表作<small>Featured</small></h2>
        <article>
          <p class="feature-kicker">从 0 到 1 · 主导产品与开发</p>
          <h3 class="feature-title">
            <a href="https://github.com/cynicalight/NeoRead">NeoRead</a>
          </h3>
          <p class="feature-desc">
            本地优先的 EPUB / PDF AI 阅读器：读电子书与论文时，在同一个界面完成对照翻译、批注，并结合原文向 AI 提问。
          </p>

          <p class="figures-lead">开源发布后一周内：</p>

          <div class="figures">
            <div class="figure"><strong>20 万+</strong><span>社交媒体浏览</span></div>
            <div class="figure"><strong>~300</strong><span>GitHub Star</span></div>
            <div class="figure"><strong>7,000+</strong><span>安装包下载</span></div>
          </div>

          <div class="facet">
            <h4>需求洞察</h4>
            <ul class="points">
              <li>读外文论文和书时，翻译、批注、AI 问答分散在多个工具里来回切换；将其收拢为“原文 · 译文 · AI”的三栏阅读界面。</li>
              <li>识别出电子书与论文是两类用户任务，将书库与论文库分开设计：论文侧补齐元数据、引用导出（GB/T 7714 / APA / BibTeX）与期刊评级。</li>
            </ul>
          </div>

          <div class="facet">
            <h4>降低门槛</h4>
            <ul class="points">
              <li><b>零配置接入 AI</b>：直接复用用户已登录的 Claude Code、Codex 与 Kimi CLI，不必另填 API Key；同时保留 API 接入方式。</li>
              <li><b>减少迁移成本</b>：支持从 Zotero 一键迁移，配套 Chrome 插件从论文页面直接收录；空书库提供示例文档，首次使用有引导。</li>
              <li><b>建立信任</b>：文档与笔记只存本机，并在产品内明确说明哪些内容会在调用 AI 时离开本机。</li>
            </ul>
          </div>

          <div class="facet">
            <h4>交付与增长</h4>
            <ul class="points">
              <li>三周内连续发布 24 个版本，内置应用更新与可导出的诊断日志，更新提示可直达 GitHub 反馈，收集并处理 40+ 个 issue。</li>
              <li>开放协作吸引 6 位外部贡献者，合并 50+ 个社区 PR，产品由个人项目成长为社区共建。</li>
              <li>主导技术架构：Electron + React 桌面端、Go 本地服务、SQLite 全文检索，以及本地 ONNX 版面模型实现 PDF 离线解析。</li>
            </ul>
          </div>
        </article>
      </section>

      <section class="section">
        <h2 class="section-label">工作<small>Experience</small></h2>
        <div class="entries">
          <article>
            <div class="entry-head">
              <h3 class="entry-title">全栈开发工程师<span class="org">小宇宙 · 上海星汉灿烂网络科技有限公司</span></h3>
              <span class="period">2026.01 — 2026.08</span>
            </div>
            <ul class="points">
              <li>负责 AI 客户端 Chatbox 的功能开发，在一线面对真实用户的使用场景。<span class="tech">TypeScript</span></li>
              <li>负责 Chatbox 反馈平台的开发与维护，承接用户反馈的收集与流转。<span class="tech">TypeScript · Go</span></li>
            </ul>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title">安全开发工程师<span class="org">得物 · 上海得物信息集团有限公司</span></h3>
              <span class="period">2025.01 — 2025.02</span>
            </div>
            <ul class="points">
              <li>对公司内部资产进行渗透测试，从攻击者视角审视产品暴露面。</li>
              <li>基于 goroutine 开发高并发端口服务扫描器，提升内部资产探测效率。<span class="tech">Go</span></li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">其他项目<small>Projects</small></h2>
        <div class="entries">
          <article>
            <div class="entry-head">
              <h3 class="entry-title">Just Rent<span class="org">C2C 服务租赁平台</span></h3>
              <span class="tech">iOS · Swift</span>
            </div>
            <ul class="points">
              <li>梳理服务发布、浏览、单次与周期预约、订单处理的完整交易流程，并落地为 iOS 客户端。</li>
              <li>站在用户角度处理弱网体验：消息乐观更新、回显去重，发送失败时自动降级与重连，尽量不让用户丢失消息。</li>
            </ul>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title"><a href="https://bu44er.ink">bu44er.ink</a><span class="org">个人博客与内容后台</span></h3>
              <span class="tech">Next.js · TypeScript</span>
            </div>
            <ul class="points">
              <li>自建写作后台：在线编辑文章、粘贴即上传图片、本地自动保存草稿，提交后自动构建发布，持续打磨自己的写作流程。</li>
            </ul>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title">Cage Fleet<span class="org">网络靶场资源调度平台</span></h3>
              <span class="tech">Go · PostgreSQL</span>
            </div>
            <ul class="points">
              <li>设计靶场资源的调度与生命周期管理，在网络异常、重复提交等边界场景下保证状态可恢复。</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">能力<small>Skills</small></h2>
        <dl class="defs">
          <dt>产品</dt>
          <dd>用户场景拆解、需求定义与 MVP 取舍、交互设计、版本规划与发布、用户反馈闭环、开源社区运营。</dd>
          <dt>工程</dt>
          <dd>TypeScript / React / Next.js、Go、Electron、Swift；SQLite / PostgreSQL；网络与 Web 安全。</dd>
          <dt>AI</dt>
          <dd>熟练使用 Claude Code、Codex 等 AI 编程工具提升交付速度，并有将 Agent 能力集成进产品的实践。</dd>
        </dl>
      </section>
${EDUCATION_HTML}`,
})
