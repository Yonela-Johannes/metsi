"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useDashboard } from "@/lib/dashboard";
import { formatDate } from "@/lib/data";
import { STATUS_META } from "@/lib/types";
import type { Station } from "@/lib/types";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { Delta, StatusBadge } from "./visuals";

/* Leaflet is client-only and below the first paint — no SSR, no layout shift. */
const MapCanvas = dynamic(
  () => import("./MapCanvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => <div className="stage-map__loading" aria-hidden="true" />,
  },
);

const LAYER_GROUPS = [
  {
    group: "Monitoring layers",
    items: [
      {
        id: "stations",
        title: "Gauge stations",
        help: "One marker per DWS gauging station, coloured by status.",
      },
      {
        id: "rain",
        title: "24-hour rainfall",
        help: "Blue halos sized by accumulated precipitation.",
      },
    ],
  },
  {
    group: "Reference",
    items: [
      {
        id: "levels",
        title: "Alert thresholds",
        help: "Show the 80 / 100 / 110% classification in the legend.",
      },
      {
        id: "floodline",
        title: "Major river corridor",
        help: "Simplified drainage path for orientation only.",
      },
    ],
  },
] as const;

type StationStatus = Station["status"];

const levelOptions: { id: "all" | "elevated" | "normal"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "elevated", label: "Elevated" },
  { id: "normal", label: "Normal" },
];

export function HeroStage() {
  const { records, d, dataset, state, dispatch, setSelected } = useDashboard();
  const [layersOpen, setLayersOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [layersButton, setLayersButton] = useState<string | undefined>();
  const [postcode, setPostcode] = useState("");
  const [near, setNear] = useState<Station | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLButtonElement>(null);

  const visible = useMemo(() => {
    if (state.levelMode === "elevated")
      return records.filter((r) => r.status !== "normal");
    if (state.levelMode === "normal")
      return records.filter((r) => r.status === "normal");
    return records;
  }, [records, state.levelMode]);

  const liveTime = dataset.last_updated_utc
    ? new Date(dataset.last_updated_utc).toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : "—";

  const headline =
    d.counts.major > 0
      ? `${d.counts.major} gauge${d.counts.major === 1 ? "" : "s"} above the major flood line`
      : d.elevated > 0
        ? `${d.elevated} of ${d.total} gauges are above the alert line`
        : "Every monitored gauge sits below the alert line";

  function announce(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }

  function lookUp(e: React.FormEvent) {
    e.preventDefault();
    const q = postcode.trim().toLowerCase();
    if (!q) return;
    const hit = records.find(
      (r) =>
        r.basin.toLowerCase().includes(q) || r.gauge.toLowerCase().includes(q),
    );
    if (hit) {
      setNear(hit);
      announce(`Nearest reporting gauge: ${hit.gauge}`);
    } else {
      setNear(null);
      announce(
        `No gauge matched “${postcode.trim()}”. Try a province, e.g. “Limpopo”.`,
      );
    }
  }

  function zoom(dir: 1 | -1 | 0) {
    // The Leaflet instance lives in MapCanvas — signal it through a DOM event.
    window.dispatchEvent(new CustomEvent('stage-zoom', { detail: dir }));
  }

  return (
    <>
      {/* ---------------- alert strips ---------------- */}
      <div className="strips" id="alerts-strip">
        {d.counts.major > 0 ? (
          <div className="strip strip--danger" role="status">
            <Icon name="warning" size={17} />
            <strong>
              Major flood: {d.counts.major} gauge
              {d.counts.major === 1 ? "" : "s"} at 110%+
            </strong>
            <span className="strip__meta muted">
              {d.byLevel[0].gauge} · {d.byLevel[0].water_level.toFixed(1)}% of
              full capacity · {d.byLevel[0].basin}
            </span>
            <a className="ui-link strip__link" href="#alerts">
              All alerts <Icon name="arrow" size={14} />
            </a>
          </div>
        ) : d.elevated > 0 ? (
          <div className="strip strip--alert" role="status">
            <Icon name="bell" size={17} />
            <strong>{d.elevated} gauges above the alert line</strong>
            <span className="strip__meta muted">
              Highest: {d.byLevel[0].gauge} at{" "}
              {d.byLevel[0].water_level.toFixed(1)}%
            </span>
            <a className="ui-link strip__link" href="#alerts">
              All alerts <Icon name="arrow" size={14} />
            </a>
          </div>
        ) : (
          <div className="strip strip--ok" role="status">
            <Icon name="shield" size={17} />
            <strong>No warnings</strong>
            <span className="strip__meta muted">
              All {d.total} gauges are below the 80% alert threshold
            </span>
            <a className="ui-link strip__link" href="#alerts">
              All alerts <Icon name="arrow" size={14} />
            </a>
          </div>
        )}
        <div className="strip strip--chips">
          <a className="chip" href="#stations">
            <span className="chip__tile">
              <Icon name="list" size={18} />
            </span>
            <span>
              <strong>Station inventory</strong>
              <small>{d.total} gauges · search &amp; CSV export</small>
            </span>
            <Icon name="chevron" size={15} />
          </a>
          <a className="chip" href="#view-water-level">
            <span className="chip__tile">
              <Icon name="water" size={18} />
            </span>
            <span>
              <strong>Water level ranking</strong>
              <small>Median {d.median.toFixed(1)}% of capacity</small>
            </span>
            <Icon name="chevron" size={15} />
          </a>
          <a className="chip" href="#view-rainfall">
            <span className="chip__tile">
              <Icon name="rain" size={18} />
            </span>
            <span>
              <strong>24h rainfall</strong>
              <small>
                {d.rainReporters === 0
                  ? "No measurable rain reported"
                  : `${d.totalRain.toFixed(1)} mm across ${d.rainReporters} reporting gauges`}
              </small>
            </span>
            <Icon name="chevron" size={15} />
          </a>
        </div>
      </div>

      {/* one grid child for everything from here down */}
      <div className="hero-main">
      <section
        className="stage"
        aria-labelledby="briefing-title"
        data-motion={state.motionPaused ? "paused" : "running"}
      >
        <MapCanvas
          stations={visible}
          layers={state.layerOn}
          onSelect={(s) => setSelected(s)}
          playing={!state.motionPaused}
        />

        {/* ---------- briefing overlay ---------- */}
        <div className={`briefing${briefingOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="briefing__toggle"
            aria-expanded={briefingOpen}
            aria-controls="briefing-body"
            onClick={() => setBriefingOpen((v) => !v)}
          >
            <span className="eyebrow">
              <Icon name="waves" size={14} /> Briefing
            </span>
            <strong className="briefing__toggle-text">{headline}</strong>
            <Icon name="chevron-down" size={16} className="briefing__chev" />
          </button>
          <div id="briefing-body" className="briefing__body">
            <span className="briefing__live is-desktop">
              <span className="ui-live">
                <span className="ui-live__dot" aria-hidden="true" />
                Latest reading {liveTime} UTC
              </span>
            </span>
            <h1 id="briefing-title" className="briefing__title">
              {headline}
            </h1>
            <p className="briefing__summary">
              Readings from {d.total} DWS gauges on{" "}
              {formatDate(records[0]?.date)}. Alert line at 80% of full storage
              capacity, minor flood at 100%, major at 110%.
            </p>

            <ul className="metrics">
              <li className="metric">
                <span
                  className="metric__dot"
                  style={{ color: "var(--ui-warn)" }}
                  aria-hidden="true"
                />
                <span className="metric__value num">{d.counts.alert}</span>
                <span className="metric__label">
                  <strong>At alert level</strong>
                  <small className="muted">80–99% of capacity</small>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.levelMode === "elevated"}
                  aria-label="Show only elevated gauges on the canvas"
                  className="ui-switch"
                  onClick={() =>
                    dispatch({
                      type: "levelMode",
                      mode: state.levelMode === "elevated" ? "all" : "elevated",
                    })
                  }
                />
              </li>
              <li className="metric">
                <span
                  className="metric__dot dot--halo"
                  style={{ color: "var(--ui-danger)" }}
                  aria-hidden="true"
                />
                <span className="metric__value num">
                  {d.counts.minor + d.counts.major}
                </span>
                <span className="metric__label">
                  <strong>Flooding gauges</strong>
                  <small className="muted">At or above 100%</small>
                </span>
                <div
                  className="ui-seg metric__seg"
                  role="radiogroup"
                  aria-label="Canvas filter"
                  onKeyDown={rovingKeys}
                >
                  {levelOptions.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={state.levelMode === o.id}
                      tabIndex={state.levelMode === o.id ? 0 : -1}
                      className="ui-seg__btn"
                      onClick={() =>
                        dispatch({ type: "levelMode", mode: o.id })
                      }
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </li>
              <li className="metric">
                <span
                  className="metric__dot"
                  style={{ color: "var(--ui-info)" }}
                  aria-hidden="true"
                />
                <span className="metric__value num">{d.rainReporters}</span>
                <span className="metric__label">
                  <strong>Gauges reporting rain</strong>
                  <small className="muted">Last 24 hours</small>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.layerOn.rain}
                  aria-label="Show 24-hour rainfall on the canvas"
                  className="ui-switch"
                  onClick={() => dispatch({ type: "layer", id: "rain" })}
                />
              </li>
              <li className="metric">
                <span
                  className="metric__dot dot--pulse"
                  style={{ color: "var(--ui-rising)" }}
                  aria-hidden="true"
                />
                <span className="metric__value num">{d.risingStreams}%</span>
                <span className="metric__label">
                  <strong>Rising week on week</strong>
                  <small className="muted">
                    {d.risingCount} gauges climbed
                  </small>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!state.motionPaused}
                  aria-label="Pause map animation"
                  className="ui-switch"
                  onClick={() => dispatch({ type: "motion" })}
                />
              </li>
            </ul>

            <div className="legend" aria-label="Legend">
              {(["normal", "alert", "minor", "major"] as StationStatus[]).map(
                (s) => (
                  <span key={s} className="legend__item">
                    <span
                      className={`dot${s === "major" ? " dot--halo" : ""}`}
                      style={{ color: STATUS_META[s].token }}
                    />
                    {STATUS_META[s].label}
                  </span>
                ),
              )}
              {state.layerOn.rain ? (
                <span className="legend__item">
                  <span className="dot" style={{ color: "var(--ui-info)" }} />{" "}
                  Rain halo
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ---------- right control stack ---------- */}
        <div
          className="stage-controls"
          ref={stackRef}
          aria-label="Map controls"
          role="group"
        >
          <button
            type="button"
            className="stage-btn"
            data-tip="Zoom in"
            onClick={() => zoom(1)}
            aria-label="Zoom in"
          >
            <Icon name="plus" size={18} />
          </button>
          <button
            type="button"
            className="stage-btn"
            data-tip="Zoom out"
            onClick={() => zoom(-1)}
            aria-label="Zoom out"
          >
            <Icon name="minus" size={18} />
          </button>
          <button
            type="button"
            className="stage-btn"
            data-tip="Reset view"
            onClick={() => zoom(0)}
            aria-label="Reset view"
          >
            <Icon name="reset" size={17} />
          </button>
          <button
            type="button"
            className="stage-btn"
            data-tip="Share this view"
            aria-label="Share this view"
            onClick={() => {
              navigator.clipboard
                ?.writeText(window.location.href)
                .catch(() => {});
              announce("Link copied — the live gauge view can be shared.");
            }}
          >
            <Icon name="share" size={17} />
          </button>
          <button
            type="button"
            id="layers-button"
            className="stage-btn"
            data-tip="Layers"
            aria-label="Map layers"
            aria-expanded={layersOpen}
            aria-controls="layers-dialog"
            onClick={() => {
              setLayersButton("layers-button");
              setLayersOpen(true);
            }}
          >
            <Icon name="layers" size={18} />
          </button>
          <div className="stage-controls__pills">
            <button
              type="button"
              className="stage-pill"
              onClick={() => document.getElementById("near-input")?.focus()}
            >
              <Icon name="target" size={15} /> Near me
            </button>
            <button
              type="button"
              className="stage-pill"
              ref={reportRef}
              onClick={() =>
                announce(
                  "Reporting sends a correction request to the data team.",
                )
              }
            >
              <Icon name="flag" size={15} /> Report
            </button>
          </div>
        </div>

        <div className="stage-pause">
          <button
            type="button"
            className="stage-pause__btn"
            aria-pressed={state.motionPaused}
            onClick={() => dispatch({ type: "motion" })}
          >
            <Icon name={state.motionPaused ? "play" : "pause"} size={14} />
            {state.motionPaused ? "Resume animation" : "Pause animation"}
          </button>
        </div>

        {/* ---------- near-you card ---------- */}
        <form className="near-card" onSubmit={lookUp}>
          <span className="eyebrow">
            <Icon name="pin" size={14} /> Near you
          </span>
          <div className="near-card__row">
            <label htmlFor="near-input" className="sr">
              Province, basin or gauge name
            </label>
            <input
              id="near-input"
              className="ui-input"
              placeholder="Province, basin or gauge"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
            <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm">
              Look
            </button>
          </div>
          {near ? (
            <button
              type="button"
              className="near-card__result"
              onClick={() => setSelected(near)}
            >
              <span
                className="dot"
                style={{ color: STATUS_META[near.status].token }}
              />
              <span>
                <strong>{near.gauge}</strong>
                <small className="muted">
                  {near.basin} · {near.water_level.toFixed(1)}% FSC
                </small>
              </span>
              <Icon name="arrow" size={14} />
            </button>
          ) : (
            <p className="near-card__hint faint">
              Readings refresh every five minutes. No account needed.
            </p>
          )}
        </form>

        <p className="sr" role="status">
          {toast}
        </p>
        {toast ? <div className="stage-toast ui-toast">{toast}</div> : null}
      </section>

      {/* ---------------- layers dialog ---------------- */}
      <Dialog
        open={layersOpen}
        onClose={() => setLayersOpen(false)}
        title="Map layers"
        returnFocusTo={layersButton}
      >
        <div className="layers">
          {LAYER_GROUPS.map((g) => (
            <fieldset key={g.group} className="layers__group">
              <legend>{g.group}</legend>
              {g.items.map((item) => {
                const on = state.layerOn[item.id];
                return (
                  <label key={item.id} className="layers__row">
                    <span>
                      <strong>{item.title}</strong>
                      <small className="muted">{item.help}</small>
                    </span>
                    <input
                      type="checkbox"
                      className="sr"
                      checked={on}
                      onChange={() =>
                        dispatch({ type: "layer", id: item.id, on: !on })
                      }
                    />
                    <span
                      className={`layers__box${on ? " is-on" : ""}`}
                      aria-hidden="true"
                    >
                      {on ? <Icon name="check" size={13} /> : null}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ))}
          <p className="layers__foot faint">
            Marker colour follows the reading: green below 80%, yellow 80–99%,
            orange 100–109% and red at 110% and above. Rings pulse on gauges
            that rose more than half a point this week.
          </p>
        </div>
      </Dialog>
      </div>
    </>
  );
}

/* ------------------------- popup for a selected gauge ------------------------ */
export function StationPopup() {
  const { selected, setSelected, saveStation } = useDashboard();
  if (!selected) return null;
  const s = selected;
  const delta = s.water_level - s.last_week_lvl;
  return (
    <div
      className="popover station-popup"
      role="dialog"
      aria-label={`${s.gauge} details`}
    >
      <button
        type="button"
        className="station-popup__close"
        onClick={() => setSelected(null)}
        aria-label="Close station details"
      >
        <Icon name="close" size={15} />
      </button>
      <span className="eyebrow eyebrow--muted">
        <Icon name="pin" size={13} /> {s.basin}
      </span>
      <h3 className="station-popup__title">{s.gauge}</h3>
      <p className="muted station-popup__sub">
        {s.river} · gauge <span className="num">{s.station_id}</span>
      </p>
      <dl className="station-popup__stats">
        <div>
          <dt>Water level</dt>
          <dd className="num">{s.water_level.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Week change</dt>
          <dd>
            <Delta value={delta} />
          </dd>
        </div>
        <div>
          <dt>Full capacity</dt>
          <dd className="num">{s.fsc_mcm.toFixed(1)} MCM</dd>
        </div>
        <div>
          <dt>24h rain</dt>
          <dd className="num">{s.rain_fall.toFixed(1)} mm</dd>
        </div>
      </dl>
      <div className="station-popup__foot">
        <StatusBadge status={s.status} />
        <a
          href={`/stations/${encodeURIComponent(s.station_id)}`}
          className="ui-link"
        >
          Full station record <Icon name="arrow" size={14} />
        </a>
      </div>
      <button
        type="button"
        className="ui-btn ui-btn--secondary ui-btn--sm station-popup__save"
        onClick={() => saveStation(s.gauge)}
      >
        <Icon name="bell" size={14} /> Save to watchlist
      </button>
    </div>
  );
}

function rovingKeys(e: React.KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowLeft", "ArrowRight"];
  if (!keys.includes(e.key)) return;
  const buttons = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  );
  const i = buttons.findIndex((b) => b.getAttribute("aria-checked") === "true");
  const next =
    buttons[
      (i + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length
    ];
  next?.focus();
  next?.click();
  e.preventDefault();
}
