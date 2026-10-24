import { renderCvPage } from './cv-shared'

export const CONTACT_HTML = String.raw`
        <ul class="contact">
          <li>17740899035</li>
          <li><a href="mailto:391900788@qq.com">391900788@qq.com</a></li>
          <li><a href="https://github.com/cynicalight">github.com/cynicalight</a></li>
          <li><a href="https://bu44er.ink">bu44er.ink</a></li>
        </ul>`

export const EDUCATION_HTML = String.raw`
      <section class="section">
        <h2 class="section-label">教育<small>Education</small></h2>
        <div class="entries">
          <article>
            <div class="entry-head">
              <h3 class="entry-title">复旦大学<span class="org">硕士研究生</span></h3>
              <span class="period">2026.09 — 至今</span>
            </div>
            <p class="entry-sub">计算与智能创新学院 · 智能系统安全方向</p>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title">武汉大学<span class="org">本科</span></h3>
              <span class="period">2022.09 — 2026.06</span>
            </div>
            <p class="entry-sub">国家网络安全学院 · 信息安全专业</p>
            <p class="note">
              2025 DATACON 大数据安全网络黑产赛道一等奖（3/102）；2024 挑战杯省金奖；2023 移动应用创新赛省三等奖。
            </p>
          </article>
        </div>
      </section>`

export const CV_HTML = renderCvPage({
  title: '张杰 | 简历',
  body: String.raw`
      <header class="masthead">
        <div>
          <h1 class="name">张杰</h1>
          <p class="role">全栈开发 · Go 后端 · Web 安全</p>
        </div>${CONTACT_HTML}
      </header>

      <p class="lede">
        复旦大学智能系统安全方向在读研究生。擅长 Go 后端与 TypeScript 全栈开发，有并发服务、幂等接口和故障恢复的实践经验；主导开发并开源了本地优先的 AI 阅读器 NeoRead。
      </p>
${EDUCATION_HTML}

      <section class="section">
        <h2 class="section-label">工作<small>Experience</small></h2>
        <div class="entries">
          <article>
            <div class="entry-head">
              <h3 class="entry-title">全栈开发工程师<span class="org">小宇宙 · 上海星汉灿烂网络科技有限公司</span></h3>
              <span class="period">2026.01 — 2026.08</span>
            </div>
            <ul class="points">
              <li>负责 Chatbox 客户端开发。<span class="tech">TypeScript</span></li>
              <li>负责 Chatbox 反馈平台的开发与维护。<span class="tech">TypeScript · Go</span></li>
            </ul>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title">安全开发工程师<span class="org">得物 · 上海得物信息集团有限公司</span></h3>
              <span class="period">2025.01 — 2025.02</span>
            </div>
            <ul class="points">
              <li>对公司内部资产进行渗透测试。</li>
              <li>基于 goroutine 开发高并发端口服务扫描器。<span class="tech">Go</span></li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">项目<small>Projects</small></h2>
        <div class="entries">
          <article>
            <div class="entry-head">
              <h3 class="entry-title">
                <a href="https://github.com/cynicalight/NeoRead">NeoRead</a><span class="org">本地优先的 EPUB / PDF AI 阅读器</span>
              </h3>
              <span class="tech">Go · TypeScript · Electron</span>
            </div>
            <ul class="points">
              <li>主导设计与开发 Electron + React 桌面端与 Go 本地服务，以 SQLite 与 FTS5 管理文档、批注、对话和全文检索。</li>
              <li>通过 CLI 桥接 Claude Code、Codex 与 Kimi，兼容 OpenAI / Anthropic 协议，统一各家流式输出。</li>
              <li>开源三周获得近 300 Star，发布 24 个版本，安装包下载 7,000+ 次，6 位外部贡献者合并 50+ 个 PR。</li>
            </ul>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title">Cage Fleet<span class="org">网络靶场资源调度平台</span></h3>
              <span class="tech">Go · Gin · PostgreSQL</span>
            </div>
            <ul class="points">
              <li>基于 Go、Gin 和 PostgreSQL 构建控制面 API，管理 Task Token、Node 容量与 Arena 生命周期。</li>
              <li>设计可恢复的 Arena 生命周期：启动响应丢失后幂等对账，以执行租约防止重复提交，清理未确认时隔离节点。</li>
            </ul>
          </article>
          <article>
            <div class="entry-head">
              <h3 class="entry-title">Just Rent<span class="org">C2C 服务租赁平台</span></h3>
              <span class="tech">Swift</span>
            </div>
            <ul class="points">
              <li>实现服务发布与浏览、单次及周期预约、订单处理等客户端流程。</li>
              <li>基于 Moya 封装 JRNetwork 请求层，统一响应解析与错误处理；使用 Actor 合并并发的 Token 刷新。</li>
              <li>基于 WebSocket 实现实时聊天、心跳和退避重连；通过乐观更新、回显去重与 REST 降级处理消息发送失败。</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-label">技能<small>Skills</small></h2>
        <dl class="defs">
          <dt>Go 后端</dt>
          <dd>精通 Go，熟悉 goroutine、channel 和 context，具备并发服务与异步任务开发经验。</dd>
          <dt>接口与鉴权</dt>
          <dd>熟悉 Gin、net/http 和 REST API 开发，具备鉴权、超时控制与错误处理经验。</dd>
          <dt>数据库</dt>
          <dd>熟悉 PostgreSQL 的事务、索引和并发控制，能够设计幂等接口与故障恢复流程。</dd>
          <dt>计算机基础</dt>
          <dd>熟悉 TCP/IP、HTTP/HTTPS、网络编程和网站开发；熟悉 Swift、Python、PHP；擅长计算机网络、Web 安全与深度学习。</dd>
        </dl>
      </section>`,
})
