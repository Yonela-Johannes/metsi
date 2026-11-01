"use client";

import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import type { Station } from "@/lib/types";
import { Icon } from "../Icon";
import { Delta } from "../visuals";

interface Props {
  kind: "water-level" | "rainfall";
}

/** Shared horizontal ranking used by the Water level and Rainfall views. */
export function RankingView({ kind }: Props) {
  const { d, setSelected } = useDashboard();
  const list = (kind === "water-level" ? d.byLevel : d.byRain).slice(0, 15);
  const max = Math.max(
    ...list.map((s) => (kind === "water-level" ? s.water_level : s.rain_fall)),
    1,
  );
  const unit = kind === "water-level" ? "%" : " mm";

  const get = (s: Station) =>
    kind === "water-level" ? s.water_level : s.rain_fall;

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name={kind === "water-level" ? "water" : "rain"} size={13} />
            {kind === "water-level" ? "Water level" : "Rainfall"}
          </span>
          <h2>
            {kind === "water-level"
              ? "Fullest gauges by percent of capacity"
              : "Heaviest 24-hour rainfall by gauge"}
          </h2>
          <p className="muted">
            {kind === "water-level"
              ? `Median across all gauges is ${d.median.toFixed(1)}% of full storage capacity. Showing the ${list.length} fullest gauges.`
              : d.rainReporters === 0
                ? "No gauge reported measurable rain in this reading."
                : `${d.totalRain.toFixed(1)} mm accumulated across ${d.rainReporters} reporting gauges. Showing the wettest ${list.length}.`}
          </p>
        </div>
        <a
          className="ui-btn ui-btn--secondary ui-btn--sm"
          href="/data/gauges_2_view.csv"
          download
          title="Download the full station dataset as CSV"
        >
          <Icon name="download" size={14} /> Export CSV
        </a>
      </div>

      <section
        className="ui-card"
        aria-label={
          kind === "water-level" ? "Water level ranking" : "Rainfall ranking"
        }
      >
        {list.length === 0 ? (
          <p className="empty empty--stack">
            <Icon name="water" size={24} />
            <span>No gauge readings are available for this ranking yet.</span>
          </p>
        ) : (
        <ol className="rank-bars">
          {list.map((s, i) => {
            const value = get(s);
            return (
              <li key={`${s.gauge}-${s.station_id}-${i}`}>
                <button
                  type="button"
                  className="rank-bars__row"
                  onClick={() => setSelected(s)}
                >
                  <span className="rank-bars__pos num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="rank-bars__main">
                    <span className="rank-bars__top">
                      <strong>{s.gauge}</strong>
                      <span className="num rank-bars__value">
                        {value.toFixed(1)}
                        {unit}
                      </span>
                    </span>
                    <span className="rank-bars__sub muted">
                      {s.river} · {s.basin}
                    </span>
                    <span className="rank-bars__track">
                      <span
                        style={{
                          width: `${(value / max) * 100}%`,
                          background:
                            kind === "water-level"
                              ? STATUS_META[s.status].token
                              : "var(--ui-info)",
                        }}
                      />
                      {kind === "water-level"
                        ? [80, 100, 110].map((t) => (
                            <span
                              key={t}
                              className="rank-bars__tick"
                              style={{
                                left: `${Math.min(100, (t / max) * 100)}%`,
                              }}
                            />
                          ))
                        : null}
                    </span>
                  </span>
                  <span className="rank-bars__side">
                    {kind === "water-level" ? (
                      <Delta value={s.water_level - s.last_week_lvl} />
                    ) : (
                      <span
                        className="rank-bars__status"
                        style={{ color: STATUS_META[s.status].token }}
                      >
                        <span
                          className={`dot${s.status === "major" ? " dot--halo" : ""}`}
                          aria-hidden="true"
                        />
                        {STATUS_META[s.status].label}
                      </span>
                    )}
                    <small className="faint">{s.date}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        )}
        {kind === "water-level" && list.length > 0 ? (
          <p className="faint rank-bars__foot">
            <span className="rank-bars__key">
              Ticks: 80% alert · 100% minor flood · 110% major flood
            </span>
            <span>Colour follows the gauge status.</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
