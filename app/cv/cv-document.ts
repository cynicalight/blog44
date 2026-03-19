export const CV_HTML = String.raw`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>张杰 | CV</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe7;
        --surface: rgba(255, 252, 246, 0.9);
        --text: #1d1b18;
        --muted: #655c50;
        --line: rgba(29, 27, 24, 0.12);
        --accent: #b45c2e;
        --accent-soft: rgba(180, 92, 46, 0.12);
        --shadow: 0 24px 80px rgba(66, 48, 29, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
      }

      body {
        min-height: 100vh;
        font-family:
          "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
          sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(180, 92, 46, 0.18), transparent 32%),
          radial-gradient(circle at bottom right, rgba(92, 124, 250, 0.14), transparent 28%),
          linear-gradient(180deg, #fbf7f0 0%, var(--bg) 100%);
      }

      a {
        color: inherit;
      }

      .page {
        width: min(1040px, calc(100% - 32px));
        margin: 32px auto;
        padding: 32px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: var(--surface);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
      }

      .columns {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
        gap: 28px;
        align-items: start;
      }

      .hero-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 22px;
      }

      .name-row {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: flex-end;
        gap: 18px;
        width: 100%;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 15px 0 12px;
        font-size: clamp(34px, 5vw, 56px);
        line-height: 0.94;
        letter-spacing: -0.04em;
        grid-column: 2;
        justify-self: center;
      }

      .subtitle {
        margin: 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.7;
      }

      .school-inline {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.6;
        grid-column: 3;
        justify-self: end;
        text-align: right;
      }

      .section-text {
        margin: 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.8;
      }

      .card {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.6);
        transition:
          transform 220ms ease,
          box-shadow 220ms ease,
          border-color 220ms ease,
          background-color 220ms ease;
        animation: card-enter 680ms ease both;
        animation-delay: var(--delay, 0ms);
      }

      .card:hover {
        transform: translateY(-4px);
        border-color: rgba(180, 92, 46, 0.22);
        background: rgba(255, 255, 255, 0.78);
        box-shadow: 0 18px 44px rgba(66, 48, 29, 0.1);
      }

      .summary {
        padding: 20px;
      }

      .summary h2,
      section h2 {
        margin: 0 0 12px;
        font-size: 14px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .summary p {
        margin: 0;
        color: var(--muted);
        line-height: 1.8;
      }

      .meta {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .meta span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .meta strong {
        display: block;
        margin-top: 6px;
        font-size: 15px;
      }

      section {
        padding: 22px;
      }

      .timeline {
        display: grid;
        gap: 18px;
      }

      .entry {
        padding-bottom: 18px;
        border-bottom: 1px solid var(--line);
      }

      .entry:last-child {
        padding-bottom: 0;
        border-bottom: 0;
      }

      .entry-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: baseline;
        flex-wrap: wrap;
      }

      .entry h3 {
        margin: 0;
        font-size: 20px;
      }

      .entry .period {
        color: var(--muted);
        font-size: 14px;
      }

      .entry p {
        margin: 8px 0 0;
        color: var(--muted);
        line-height: 1.7;
      }

      .list {
        margin: 10px 0 0;
        padding-left: 18px;
        color: var(--muted);
        line-height: 1.7;
      }

      .stack {
        display: grid;
        gap: 40px;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .chip {
        padding: 9px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.85);
        font-size: 14px;
      }

      .note {
        margin-top: 24px;
        padding: 16px 18px;
        border-left: 4px solid var(--accent);
        border-radius: 14px;
        background: rgba(180, 92, 46, 0.08);
        color: var(--muted);
        line-height: 1.7;
      }

      .paper-link {
        color: var(--accent);
        text-decoration-thickness: 1.5px;
        text-underline-offset: 3px;
        word-break: break-word;
      }

      .card:nth-of-type(1) {
        --delay: 60ms;
      }

      .card:nth-of-type(2) {
        --delay: 120ms;
      }

      .card:nth-of-type(3) {
        --delay: 180ms;
      }

      .card:nth-of-type(4) {
        --delay: 240ms;
      }

      @keyframes card-enter {
        from {
          opacity: 0;
          transform: translateY(18px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 860px) {
        .page {
          width: min(100% - 20px, 1040px);
          margin: 10px auto;
          padding: 18px;
          border-radius: 20px;
        }

        .columns {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: clamp(34px, 11vw, 56px);
        }

        .name-row {
          grid-template-columns: 1fr;
          align-items: flex-start;
          gap: 10px;
        }

        h1,
        .school-inline {
          grid-column: 1;
        }

        h1 {
          justify-self: center;
        }

        .school-inline {
          justify-self: end;
        }

        .meta {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        body {
          background: #fff;
        }

        .page {
          width: 100%;
          margin: 0;
          padding: 0;
          border: 0;
          box-shadow: none;
          background: #fff;
        }

        .card {
          animation: none;
          transition: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="columns">
        <div class="stack">
          <div class="hero-copy">
            <div class="eyebrow">AI Learning · Security · Hands-on Engineering</div>
            <div class="name-row">
              <h1>张  杰</h1>
            </div>
          </div>

          <section class="card">
            <h2>个人概述</h2>
            <p class="section-text">
              具备较扎实的计算机基础与编程能力，熟悉 Python、Cpp 、Swift 、React，能够处理网络编程、
              网站开发与安全测试任务。有较好的 AI 理论基础，担任学院深度学习课程助教，并
              参与事实对齐方向的强化学习研究；同时有较完整的 iOS 与全栈项目经验，开发能力较强。
            </p>
          </section>

          <section class="card">
            <h2>工作经历</h2>
            <div class="timeline">
              <article class="entry">
                <div class="entry-head">
                  <h3>安全开发工程师 · 得物</h3>
                  <div class="period">2024.12 - 2025.02</div>
                </div>
                <p>参与公司内部资产安全测试与工具开发，偏重问题定位、自动化扫描和工程实现。</p>
                <ul class="list">
                  <li>对公司内部资产进行渗透测试，协助排查潜在暴露面与安全风险。</li>
                  <li>使用 Go 基于 goroutine 实现高并发端口与服务扫描器，提升资产探测效率。</li>
                  <li>在真实业务环境中锻炼了从需求理解到工具实现、验证与优化的动手能力。</li>
                </ul>
              </article>
            </div>
          </section>

          <section class="card">
            <h2>项目经历</h2>
            <div class="timeline">
              <article class="entry">
                <div class="entry-head">
                  <h3>ncc-bus · 学院班车预约小程序</h3>
                  <div class="period">微信原生前端 / Python Flask</div>
                </div>
                <p>独立参与全栈开发，负责把校园场景需求落成可用系统，覆盖前端交互与后端服务。</p>
              </article>

              <article class="entry">
                <div class="entry-head">
                  <h3>bu44er.ink · 个人博客网站</h3>
                  <div class="period">Next.js / TypeScript / Markdown</div>
                </div>
                <p>从内容组织到站点实现均可独立完成，持续迭代博客功能与页面体验，具备较强的个人工程交付能力。</p>
              </article>

              <article class="entry">
                <div class="entry-head">
                  <h3>JustRent · C2C 服务租赁平台（iOS）</h3>
                  <div class="period">SwiftUI / Swift Concurrency / MVVM / URLSession</div>
                </div>
                <p>围绕现代 iOS 应用架构进行完整实践，重点体现并发编程、网络层设计与 UI 细节实现能力。</p>
                <ul class="list">
                  <li>基于 async/await 与泛型重构网络层，封装 NetworkManager，提升代码复用性与可维护性。</li>
                  <li>使用 Actor 模型处理线程隔离与数据竞争问题，体现对 Swift Concurrency 的理解与实践。</li>
                  <li>实现自定义 Glass TabBar 与沉浸式磨砂玻璃效果，兼顾工程实现与交互质感。</li>
                </ul>
              </article>

            </div>
          </section>
        </div>

        <div class="stack">
          <section class="card">
            <h2>教育背景与奖项</h2>
            <div class="timeline">
              <article class="entry">
                <div class="entry-head">
                  <h3>武汉大学 · 本科</h3>
                  <div class="period">2022.09 - 2026.06</div>
                </div>
                <p>国家网络安全学院 - 信息安全</p>
              </article>
            </div>
            <div class="note">
              获 2023 移动应用创新赛省三等奖、2024 挑战杯省金奖、2025 DATACON 大数据安全网络黑产赛道一等奖（3/102）
            </div>
          </section>

          <aside class="card summary">
            <h2>联系方式</h2>
            <p>
              17740899035<br />
              391900788@qq.com<br />
              <a href="https://github.com/cynicalight">github.com/cynicalight</a><br />
              <a href="https://bu44er.ink">bu44er.ink</a>
            </p>
            <div class="meta">
              <div>
                <span>方向</span>
                <strong>AI 基础 / Web 攻防/ 全栈开发</strong>
              </div>
              <div>
                <span>身份</span>
                <strong>2026 届本科生</strong>
              </div>
              <div>
                <span>优势</span>
                <strong>动手能力强，能独立推进落地</strong>
              </div>
              <div>
                <span>关键词</span>
                <strong>强化学习 / Swift / Go / Python</strong>
              </div>
            </div>
          </aside>

          <section class="card">
            <h2>专业技能</h2>
            <div class="chips">
              <div class="chip">Python</div>
              <div class="chip">Go</div>
              <div class="chip">Swift</div>
              <div class="chip">React</div>
              <div class="chip">Next.js</div>
              <div class="chip">网站开发</div>
              <div class="chip">网络编程</div>
              <div class="chip">AI 基础</div>
            </div>
          </section>

          <section class="card">
            <h2>AI 学习与研究</h2>
            <div class="timeline">
              <article class="entry">
                <div class="entry-head">
                  <h3>深度学习课程助教</h3>
                  <div class="period">武汉大学</div>
                </div>
                <p>担任学院深度学习专业课程助教，具备较扎实的 AI 理论基础，能够持续跟进课程内容并辅助同学理解相关知识。</p>
              </article>
              <article class="entry">
                <div class="entry-head">
                  <h3>强化学习方向研究</h3>
                  <div class="period">事实对齐 / GRPO</div>
                </div>
                <p>
                  关注事实对齐相关问题，参与强化学习研究并完成论文一作，论文链接：
                  <a
                    class="paper-link"
                    href="https://github.com/cynicalight/Weak-to-Strong-Honesty-Alignment-via-Group-Relative-Policy-Optimization"
                  >
                    GitHub Repository
                  </a>
                  ，体现出从理论学习到研究实践的主动性与执行力。
                </p>
              </article>
              <article class="entry">
                <div class="entry-head">
                  <h3>渗透测试 agent 项目</h3>
                  <div class="period">清华大学网络科学与网络空间研究院</div>
                </div>
                <p>网研院实习期间参与了某安全公司横向（渗透测试 agent 开发），主要负责了 browser mcp 的调研与开发</p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  </body>
</html>
`
