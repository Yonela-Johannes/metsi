import { Icon } from "./Icon";

const COLUMNS = [
  {
    title: "Monitor",
    links: [
      { label: "Overview", href: "/?view=overview" },
      { label: "Water levels", href: "/?view=water-level" },
      { label: "Rainfall", href: "/?view=rainfall" },
      { label: "Flood alerts", href: "/?view=alerts" },
    ],
    more: { label: "All views", href: "/?view=stations" },
  },
  {
    title: "Data",
    links: [
      { label: "Gauge JSON feed", href: "/data/gauges_2_view.json" },
      { label: "CSV export", href: "/data/gauges_2_view.csv" },
      { label: "DWS Hydrology", href: "https://www.dws.gov.za/Hydrology/" },
      { label: "Refresh & caching", href: "/#data-credits" },
    ],
    more: { label: "All sources", href: "/#data-credits" },
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#mission" },
      { label: "News", href: "/#news" },
      { label: "Contact", href: "mailto:data@metsi.example" },
      { label: "Status", href: "/#data-credits" },
    ],
    more: { label: "All pages", href: "/#news" },
  },
  {
    title: "Account",
    links: [
      { label: "Create free account", href: "/signup" },
      { label: "Log in", href: "/login" },
      { label: "Watch areas", href: "/signup?next=watch-areas" },
      { label: "API access", href: "/signup?next=api" },
    ],
    more: { label: "All plans", href: "/signup" },
  },
];

export function Footer({ updatedAt }: { updatedAt: string }) {
  const time = new Date(updatedAt).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <footer className="site-footer" id="data-credits">
      <div className="ui-wrap">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="eyebrow">
              <Icon name="droplet" size={14} /> Metsi Water Monitor
            </span>
            <p className="muted">
              Flood Watch for South Africa, built on public hydrological
              readings. Not an official emergency service.
            </p>
            <a
              className="ui-link"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="globe" size={14} /> Follow the data feed
            </a>
          </div>

          <nav className="site-footer__cols" aria-label="Footer">
            {COLUMNS.map((col) => (
              <details key={col.title} className="site-footer__col" open>
                <summary>
                  <span>{col.title}</span>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="site-footer__chev"
                  />
                </summary>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target={
                          l.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel="noreferrer"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a
                      className="ui-link site-footer__more"
                      href={col.more.href}
                    >
                      {col.more.label} <Icon name="arrow" size={13} />
                    </a>
                  </li>
                </ul>
              </details>
            ))}
          </nav>
        </div>

        <p className="site-footer__credits faint">
          Readings: Department of Water and Sanitation (DWS) South Africa,
          Hydrology Services — retrieved {time} UTC and refreshed every five
          minutes. 24-hour rainfall enrichment: Open-Meteo. Map tiles:
          OpenStreetMap contributors. Thresholds follow the 80 / 100 / 110% of
          full storage capacity classification described in the method note.
        </p>

        <div className="site-footer__legal">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/#data-credits">Sources</a>
          <a href="/sitemap.xml">Sitemap</a>
          <span className="faint">
            © {new Date().getFullYear()} Metsi Water Monitor
          </span>
        </div>
      </div>
    </footer>
  );
}
