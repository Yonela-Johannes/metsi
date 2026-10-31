import { formatDate } from "@/lib/data";
import { Icon } from "./Icon";

const ITEMS = [
  {
    source: "DWS Hydrology",
    date: "2026-10-26",
    title: "Weekly dam readings published for all nine provinces",
    href: "https://www.dws.gov.za/Hydrology/",
  },
  {
    source: "Platform changelog",
    date: "2026-10-25",
    title: "Rainfall layer now sizes halos by 24-hour accumulation",
    href: "#news",
  },
  {
    source: "Method note",
    date: "2026-10-21",
    title: "How a gauge is classified: the 80 / 100 / 110% rule",
    href: "#thresholds",
  },
  {
    source: "Data quality",
    date: "2026-10-18",
    title: "Duplicate gauge IDs merged in the Free State inventory",
    href: "#news",
  },
];

export function News() {
  return (
    <section className="ui-card news" id="news" aria-labelledby="news-title">
      <div className="ui-card__head">
        <h2 id="news-title">News &amp; updates</h2>
        <a className="ui-link" href="#news">
          All updates <Icon name="arrow" size={14} />
        </a>
      </div>
      <ul className="news__list">
        {ITEMS.map((n) => (
          <li key={n.title}>
            <p className="news__meta muted">
              <span>{n.source}</span> ·{" "}
              <time dateTime={n.date}>{formatDate(n.date)}</time>
            </p>
            <a
              className="news__title"
              href={n.href}
              target={n.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              {n.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Promo() {
  return (
    <section className="ui-card promo" aria-labelledby="promo-title">
      <div className="promo__copy">
        <h2 id="promo-title">Weekly South Africa water briefing</h2>
        <p className="muted">
          The national picture, rising basins and threshold crossings —
          <br className="promo__br" /> read in under three minutes.
        </p>
        <ul className="promo__features">
          <li>
            <span className="dot" style={{ color: "var(--ui-ok)" }} /> Every
            Monday 07:00
          </li>
          <li>
            <span className="dot" style={{ color: "var(--ui-info)" }} />{" "}
            Provincial deltas
          </li>
          <li>
            <span className="dot" style={{ color: "var(--ui-warn)" }} />{" "}
            Gauge-level alerts
          </li>
        </ul>
      </div>
      {/* small inline illustration — decorative, 76px, explicit size */}
      <svg
        className="promo__art"
        width="76"
        height="76"
        viewBox="0 0 76 76"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="74"
          height="74"
          rx="14"
          fill="var(--ui-panel-alt)"
          stroke="var(--ui-border)"
        />
        <path
          d="M10 50c9-8 18-8 27 0s18 8 27 0"
          fill="none"
          stroke="var(--ui-coast)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M10 60c9-8 18-8 27 0s18 8 27 0"
          fill="none"
          stroke="var(--ui-coast)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".6"
        />
        <path
          d="M38 16c7 8 12 14 12 21a12 12 0 0 1-24 0c0-7 5-13 12-21Z"
          fill="var(--ui-accent)"
        />
        <circle cx="33.5" cy="37" r="2.6" fill="var(--ui-accent-text)" />
        <path
          d="M38 44c-3.2 0-5.5 2.4-6.5 5.5a5 5 0 0 0 6.5 0 5 5 0 0 0 6.5 0c-1-3.1-3.3-5.5-6.5-5.5Z"
          fill="var(--ui-accent-text)"
          opacity=".55"
        />
      </svg>
      <div className="promo__cta">
        <a className="ui-btn ui-btn--secondary" href="/signup?next=briefing">
          Get the briefing
        </a>
        <span className="faint promo__caption">Free preview available</span>
      </div>
    </section>
  );
}
