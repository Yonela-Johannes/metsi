"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboard, goToView } from "@/lib/dashboard";
import type { ViewId } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { ThemeSwitcher } from "./ThemeSwitcher";

type MenuLink = {
  title: string;
  desc: string;
  href: string;
  locked?: boolean;
  view?: ViewId;
};
type MenuSection = { title: string; links: MenuLink[] };

const MENUS: { label: string; sections: MenuSection[] }[] = [
  {
    label: "Monitor",
    sections: [
      {
        title: "Live conditions",
        links: [
          {
            title: "Overview",
            desc: "National headline reading and priority alerts",
            href: "/?view=overview",
            view: "overview",
          },
          {
            title: "Flood alerts",
            desc: "Every gauge above the 80% alert line",
            href: "/?view=alerts",
            view: "alerts",
            locked: true,
          },
          {
            title: "Rising gauges",
            desc: "Biggest week-on-week increases",
            href: "/?view=statistics",
            view: "statistics",
            locked: true,
          },
        ],
      },
      {
        title: "By measure",
        links: [
          {
            title: "Dam water levels",
            desc: "Percent of full storage capacity",
            href: "/?view=water-level",
            view: "water-level",
          },
          {
            title: "24-hour rainfall",
            desc: "Accumulated precipitation by station",
            href: "/?view=rainfall",
            view: "rainfall",
          },
          {
            title: "Basin distribution",
            desc: "Coverage across the nine provinces",
            href: "/?view=basins",
            view: "basins",
          },
        ],
      },
      {
        title: "Places",
        links: [
          {
            title: "Monitoring map",
            desc: "Every reporting station on one canvas",
            href: "/?view=map",
            view: "map",
          },
          {
            title: "Station inventory",
            desc: "Search, filter and export all gauges",
            href: "/?view=stations",
            view: "stations",
          },
          {
            title: "Custom watch areas",
            desc: "Postcode and basin alerts by email",
            href: "/signup?next=watch-areas",
            locked: true,
          },
        ],
      },
    ],
  },
  {
    label: "Data",
    sections: [
      {
        title: "Raw feeds",
        links: [
          {
            title: "Gauge JSON feed",
            desc: "Records updated every five minutes",
            href: "/data/gauges_2_view.json",
          },
          {
            title: "CSV export",
            desc: "Full station table, one row per gauge",
            href: "/data/gauges_2_view.csv",
          },
          {
            title: "DWS Hydrology portal",
            desc: "Source readings on dws.gov.za",
            href: "https://www.dws.gov.za/Hydrology/",
          },
        ],
      },
      {
        title: "Method",
        links: [
          {
            title: "Threshold rules",
            desc: "80 / 100 / 110% classification",
            href: "/#thresholds",
          },
          {
            title: "Refresh & caching",
            desc: "How stale readings are handled",
            href: "/#data-credits",
          },
          {
            title: "API access",
            desc: "Programmatic reads for teams",
            href: "/signup?next=api",
            locked: true,
          },
        ],
      },
    ],
  },
  {
    label: "About",
    sections: [
      {
        title: "The platform",
        links: [
          {
            title: "What we do",
            desc: "Flood Watch for South Africa",
            href: "/#mission",
          },
          {
            title: "Our data partners",
            desc: "DWS Lakes and Open-Meteo",
            href: "/#data-credits",
          },
          { title: "News", desc: "Platform and data updates", href: "/#news" },
        ],
      },
    ],
  },
];

export function Header({ alerts }: { alerts: number }) {
  const { records, dispatch, setSelected, d } = useDashboard();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return records
      .filter(
        (r) =>
          r.gauge.toLowerCase().includes(q) ||
          r.river.toLowerCase().includes(q) ||
          r.basin.toLowerCase().includes(q) ||
          r.station_id.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, records]);

  // close mega-menus on outside click / Esc
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node))
        setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const severity =
    d.counts.major > 0
      ? "danger"
      : d.counts.minor > 0
        ? "above"
        : d.counts.alert > 0
          ? "warn"
          : "ok";
  const topAlerts = [...records]
    .filter((r) => r.status !== "normal")
    .sort(
      (a, b) =>
        STATUS_META[b.status].rank - STATUS_META[a.status].rank ||
        b.water_level - a.water_level,
    )
    .slice(0, 4);

  const go = (view: ViewId) => {
    setBellOpen(false);
    goToView(view, dispatch);
  };

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header__bar ui-wrap">
        <a
          href="#main"
          className="brand"
          aria-label="Metsi Water Monitor — home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="brand__logo"
            priority
          />
          <span className="brand__text">
            <strong>Metsi</strong>
            <span>Water Monitor</span>
          </span>
        </a>

        <form
          className="site-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();

            const first = results[0];
            if (first) {
              setSelected(first);
              setQuery("");
            }
          }}
        >
          <label htmlFor="site-search" className="sr">
            Search stations, rivers or provinces
          </label>
          <Icon name="search" className="site-search__icon" size={16} />
          <input
            id="site-search"
            className="site-search__input"
            type="search"
            placeholder="Search a station, river or province"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-controls="site-search-results"
            aria-expanded={results.length > 0}
          />
          {query ? (
            <button
              type="button"
              className="site-search__clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <Icon name="close" size={14} />
            </button>
          ) : null}
          {results.length > 0 ? (
            <ul
              id="site-search-results"
              className="site-search__results"
              role="listbox"
              aria-label="Station results"
            >
              {results.map((r) => (
                <li key={`${r.station_id}-${r.gauge}-${r.latitude}`}>
                  <button
                    type="button"
                    role="option"
                    className="site-search__result"
                    onClick={() => {
                      setSelected(r);
                      setQuery("");
                    }}
                  >
                    <Icon name="pin" size={15} />
                    <span>
                      <strong>{r.gauge}</strong>
                      <small>
                        {r.river} · {r.basin}
                      </small>
                    </span>
                    <span className="num site-search__result-val">
                      {r.water_level.toFixed(1)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 ? (
            <p className="site-search__empty faint" role="status">
              No station, river or province matches “{query.trim()}”.
            </p>
          ) : null}
        </form>

        <nav className="site-nav" aria-label="Primary">
          <ul>
            {MENUS.map((menu) => {
              const isOpen = openMenu === menu.label;
              return (
                <li key={menu.label} className="site-nav__item">
                  <details open={isOpen}>
                    <summary
                      className="site-nav__summary"
                      aria-expanded={isOpen}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenMenu(isOpen ? null : menu.label);
                      }}
                    >
                      {menu.label}
                      <Icon name="chevron-down" size={14} />
                    </summary>
                    <div
                      className="mega"
                      role="group"
                      aria-label={`${menu.label} menu`}
                    >
                      <div className="mega__grid">
                        {menu.sections.map((section) => (
                          <div key={section.title} className="mega__section">
                            <h3>{section.title}</h3>
                            <ul>
                              {section.links.map((link) => (
                                <li key={link.title}>
                                  <a
                                    href={
                                      link.locked
                                        ? `/signup?next=${encodeURIComponent(link.href)}`
                                        : link.href
                                    }
                                    className={`mega__link${link.locked ? " is-locked" : ""}`}
                                    title={
                                      link.locked
                                        ? "A free account unlocks this"
                                        : undefined
                                    }
                                    onClick={(e) => {
                                      const view = link.view;
                                      if (!view || link.locked) return;
                                      e.preventDefault();
                                      setOpenMenu(null);
                                      goToView(view, dispatch);
                                    }}
                                    target={
                                      link.href.startsWith("http") ||
                                      link.href.endsWith(".json") ||
                                      link.href.endsWith(".csv")
                                        ? "_blank"
                                        : undefined
                                    }
                                    rel="noreferrer"
                                  >
                                    <span className="mega__title">
                                      {link.title}
                                      {link.locked ? (
                                        <Icon
                                          name="lock"
                                          size={12}
                                          className="mega__lock"
                                          label="Account required"
                                        />
                                      ) : null}
                                    </span>
                                    <span className="mega__desc">
                                      {link.desc}
                                    </span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <p className="mega__foot">
                        A free account unlocks these.{" "}
                        <a href="/signup">Sign up</a> or{" "}
                        <a href="/login">log in</a>
                      </p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="site-actions">
          <ThemeSwitcher />

          <div className="bell">
            <button
              type="button"
              id="bell-button"
              className="icon-btn"
              aria-expanded={bellOpen}
              aria-controls="bell-panel"
              onClick={() => setBellOpen((v) => !v)}
              aria-label={`Notifications, ${alerts} unread`}
            >
              <Icon name="bell" size={19} />
              {alerts > 0 ? (
                <span
                  className={`bell__dot bell__dot--${severity}`}
                  aria-hidden="true"
                />
              ) : null}
            </button>
            <div
              id="bell-panel"
              className={`popover bell__panel${bellOpen ? " is-open" : ""}`}
              role="dialog"
              aria-label="Notifications"
              hidden={!bellOpen}
            >
              <div className="popover__head">
                <strong>Alerts</strong>
                <button type="button" onClick={() => go("alerts")}>
                  All alerts
                </button>
              </div>
              <ul className="popover__list">
                {topAlerts.map((a) => (
                  <li key={`${a.gauge}-${a.latitude}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(a);
                        setBellOpen(false);
                      }}
                    >
                      <span
                        className={`dot${a.status === "major" ? " dot--halo" : ""}`}
                        style={{ color: STATUS_META[a.status].token }}
                      />
                      <span>
                        <strong>
                          {a.gauge} · {a.water_level.toFixed(1)}%
                        </strong>
                        <small>
                          {STATUS_META[a.status].label} — {a.basin}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <a href="/login" className="site-actions__login">
            Log in
          </a>
          <a
            href="/signup"
            className="ui-btn ui-btn--primary ui-btn--sm site-actions__cta"
          >
            Create free account
          </a>

          <button
            type="button"
            className="icon-btn site-actions__menu"
            id="mobile-sheet-trigger"
            aria-expanded={sheetOpen}
            aria-controls="mobile-sheet"
            onClick={() => setSheetOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>

      <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </header>
  );
}

function MobileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { dispatch } = useDashboard();
  const shortcuts: { id: ViewId; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "chart" },
    { id: "alerts", label: "Alerts", icon: "warning" },
    { id: "map", label: "Map", icon: "pin" },
    { id: "stations", label: "Stations", icon: "table" },
  ];

  function go(view: ViewId) {
    onClose();
    goToView(view, dispatch);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Menu"
      className="mobile-sheet"
      returnFocusTo="mobile-sheet-trigger"
    >
      <div className="sheet-shortcuts">
        {shortcuts.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sheet-shortcut"
            onClick={() => go(s.id)}
          >
            <Icon name={s.icon} size={18} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <div className="sheet-acc">
        {MENUS.map((menu) => (
          <details key={menu.label} className="sheet-acc__item">
            <summary>
              <span className="sheet-acc__label">
                <Icon
                  name={
                    menu.label === "Monitor"
                      ? "activity"
                      : menu.label === "Data"
                        ? "table"
                        : "info"
                  }
                  size={18}
                />
                {menu.label}
              </span>
              <Icon name="chevron-down" size={16} className="sheet-acc__chev" />
            </summary>
            <ul>
              {menu.sections
                .flatMap((s) => s.links)
                .map((l) => (
                  <li key={l.title}>
                    <a
                      href={
                        l.locked
                          ? `/signup?next=${encodeURIComponent(l.href)}`
                          : l.href
                      }
                      onClick={(e) => {
                        if (l.locked) return;
                        if (l.view) {
                          e.preventDefault();
                          go(l.view);
                        } else {
                          onClose();
                        }
                      }}
                    >
                      {l.title}
                      {l.locked ? (
                        <Icon name="lock" size={12} label="Account required" />
                      ) : null}
                    </a>
                  </li>
                ))}
            </ul>
          </details>
        ))}
      </div>
      <div className="sheet-auth">
        <a href="/login" className="ui-btn ui-btn--secondary">
          Log in
        </a>
        <a href="/signup" className="ui-btn ui-btn--primary">
          Create free account
        </a>
      </div>
      <ThemeSwitcher />
    </Dialog>
  );
}
