const CV_STYLES = String.raw`
      :root {
        color-scheme: light;
        --desk: #ece8e0;
        --paper: #fbfaf7;
        --ink: #1a1816;
        --body: #34302b;
        --muted: #7a7268;
        --rule: #d9d3c9;
        --accent: #9b2d20;
        --serif:
          "Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", STSong,
          "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", SimSun, serif;
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
        background: var(--desk);
        color: var(--body);
        font-family: var(--serif);
        font-size: 15px;
        line-height: 1.75;
        font-kerning: normal;
        font-variant-numeric: lining-nums tabular-nums;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }

      a {
        color: inherit;
        text-decoration: none;
        border-bottom: 1px solid var(--rule);
        transition: border-color 160ms ease, color 160ms ease;
      }

      a:hover {
        color: var(--accent);
        border-color: var(--accent);
      }

      .sheet {
        width: min(860px, 100%);
        margin: 48px auto 56px;
        padding: 64px 72px 72px;
        background: var(--paper);
        border: 1px solid var(--rule);
        box-shadow: 0 1px 2px rgba(40, 30, 20, 0.04), 0 18px 48px -28px rgba(40, 30, 20, 0.18);
      }

      /* Masthead */

      .masthead {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end;
        gap: 24px;
        padding-bottom: 22px;
        border-bottom: 1.5px solid var(--ink);
      }

      .name {
        margin: 0;
        color: var(--ink);
        font-size: 44px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.32em;
      }

      .role {
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 14px;
        letter-spacing: 0.18em;
      }

      .contact {
        margin: 0;
        padding: 0;
        list-style: none;
        text-align: right;
        font-size: 13px;
        line-height: 1.85;
        color: var(--body);
      }

      .lede {
        margin: 26px 0 0;
        color: var(--ink);
        font-size: 17px;
        line-height: 1.9;
        text-wrap: pretty;
      }

      /* Sections */

      .section {
        display: grid;
        grid-template-columns: 112px minmax(0, 1fr);
        gap: 28px;
        padding: 28px 0 0;
        margin-top: 28px;
        border-top: 1px solid var(--rule);
      }

      .section-label {
        margin: 0;
        color: var(--ink);
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.24em;
        line-height: 1.5;
      }

      .section-label small {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        font-style: italic;
        font-weight: 400;
        letter-spacing: 0.04em;
      }

      .entries > * + * {
        margin-top: 22px;
      }

      .entry-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 18px;
      }

      .entry-title {
        margin: 0;
        color: var(--ink);
        font-size: 16px;
        font-weight: 600;
        line-height: 1.6;
      }

      .entry-title .org {
        color: var(--muted);
        font-weight: 400;
      }

      .entry-title .org::before {
        content: "／";
        margin: 0 0.3em;
        color: var(--rule);
      }

      .period {
        flex: none;
        color: var(--muted);
        font-size: 13px;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }

      .entry-sub {
        margin: 2px 0 0;
        color: var(--muted);
        font-size: 14px;
      }

      .tech {
        color: var(--muted);
        font-size: 13px;
        font-style: italic;
        letter-spacing: 0.02em;
      }

      .points {
        margin: 8px 0 0;
        padding: 0;
        list-style: none;
      }

      .points li {
        position: relative;
        padding-left: 1.15em;
        text-wrap: pretty;
      }

      .points li + li {
        margin-top: 4px;
      }

      .points li::before {
        content: "";
        position: absolute;
        left: 0.1em;
        top: 0.88em;
        width: 0.45em;
        height: 1px;
        background: var(--accent);
      }

      .points b {
        color: var(--ink);
        font-weight: 600;
      }

      .note {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 14px;
      }

      /* Skills as a definition list */

      .defs {
        margin: 0;
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        column-gap: 22px;
        row-gap: 8px;
      }

      .defs dt {
        color: var(--ink);
        font-weight: 600;
      }

      .defs dd {
        margin: 0;
      }

      /* Featured project (PM resume) */

      .feature-kicker {
        margin: 0 0 6px;
        color: var(--accent);
        font-size: 12px;
        letter-spacing: 0.24em;
      }

      .feature-title {
        margin: 0;
        color: var(--ink);
        font-size: 26px;
        font-weight: 600;
        line-height: 1.3;
        letter-spacing: 0.02em;
      }

      .feature-title a {
        border: 0;
      }

      .feature-desc {
        margin: 8px 0 0;
        color: var(--body);
        font-size: 15px;
      }

      .figures-lead {
        margin: 22px 0 0;
        color: var(--ink);
        font-size: 14px;
        letter-spacing: 0.12em;
      }

      .figures {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 10px 0 0;
        padding: 16px 0;
        border-top: 1px solid var(--rule);
        border-bottom: 1px solid var(--rule);
      }

      .figure {
        padding: 0 16px;
      }

      .figure + .figure {
        border-left: 1px solid var(--rule);
      }

      .figure:first-child {
        padding-left: 0;
      }

      .figure strong {
        display: block;
        color: var(--ink);
        font-size: 28px;
        font-weight: 500;
        line-height: 1.15;
        font-variant-numeric: oldstyle-nums proportional-nums;
      }

      .figure span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.08em;
      }

      .facet + .facet {
        margin-top: 16px;
      }

      .facet h4 {
        margin: 18px 0 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.16em;
      }

      .principles {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 26px;
        counter-reset: principle;
      }

      .principles li {
        counter-increment: principle;
      }

      .principles li::before {
        content: "0" counter(principle);
        display: block;
        margin-bottom: 6px;
        color: var(--accent);
        font-size: 13px;
        font-style: italic;
        letter-spacing: 0.08em;
      }

      .principles b {
        display: block;
        color: var(--ink);
        font-size: 15px;
        font-weight: 600;
      }

      .principles p {
        margin: 4px 0 0;
        font-size: 14px;
        line-height: 1.75;
      }

      .colophon {
        margin-top: 40px;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-align: right;
      }

      @media (max-width: 720px) {
        body {
          font-size: 14.5px;
        }

        .sheet {
          margin: 0;
          padding: 40px 22px 44px;
          border: 0;
        }

        .masthead {
          grid-template-columns: 1fr;
          gap: 18px;
        }

        .name {
          font-size: 36px;
        }

        .contact {
          text-align: left;
        }

        .section {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .section-label small {
          display: inline;
          margin-left: 10px;
        }

        .entry-head {
          flex-direction: column;
          gap: 0;
        }

        .defs {
          grid-template-columns: 1fr;
          row-gap: 2px;
        }

        .defs dd + dt {
          margin-top: 10px;
        }

        .figure {
          padding: 0 12px;
        }

        .principles {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }

      @page {
        size: A4;
        margin: 14mm 15mm;
      }

      @media print {
        body {
          background: #fff;
          font-size: 9.5pt;
          line-height: 1.55;
        }

        .name {
          font-size: 32px;
        }

        .lede {
          margin-top: 16px;
          font-size: 10.5pt;
        }

        .entries > * + * {
          margin-top: 12px;
        }

        .points {
          margin-top: 4px;
        }

        .points li + li {
          margin-top: 1px;
        }

        .figures-lead {
          margin-top: 14px;
        }

        .figures {
          margin: 6px 0 0;
          padding: 10px 0;
        }

        .figure strong {
          font-size: 20px;
        }

        .sheet {
          width: 100%;
          margin: 0;
          padding: 0;
          zoom: 0.84;
          border: 0;
          box-shadow: none;
          background: #fff;
        }

        a {
          border: 0;
        }

        .section {
          gap: 20px;
          margin-top: 12px;
          padding-top: 12px;
        }

        .entries > * {
          break-inside: avoid;
        }
      }
`

export function renderCvPage({ title, body }: { title: string; body: string }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>${title}</title>
    <style>${CV_STYLES}</style>
  </head>
  <body>
    <main class="sheet">${body}
    </main>
  </body>
</html>
`
}
