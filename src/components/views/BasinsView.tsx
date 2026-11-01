"use client";

import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import { Donut } from "../visuals";
import { Icon } from "../Icon";

export function BasinsView() {
  const { d } = useDashboard();
  const total = d.total || 1;
  const maxStations = Math.max(...d.basins.map((b) => b.stations), 1);

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="globe" size={13} /> Basin distribution
          </span>
          <h2>Coverage across South Africa&apos;s nine provinces</h2>
          <p className="muted">
            Station counts, elevation above the alert line and average level per
            region.
          </p>
        </div>
      </div>

      <div className="split">
        <section className="ui-card" aria-labelledby="coverage-title">
          <div className="ui-card__head">
            <h2 id="coverage-title">Stations per province</h2>
            <span className="faint">{d.basins.length} regions</span>
          </div>
          <ul className="basin-list">
            {d.basins.map((b) => (
              <li key={b.name} id={`basin-${b.name.replace(/\s+/g, "-")}`}>
                <div className="basin-list__top">
                  <strong>{b.name}</strong>
                  <span className="num basin-list__count">
                    {b.stations} <small className="faint">gauges</small>
                  </span>
                </div>
                <div
                  className="basin-list__track"
                  role="img"
                  aria-label={`${b.stations} gauges in ${b.name}, ${b.elevated} above the alert line`}
                >
                  <span
                    style={{ width: `${(b.stations / maxStations) * 100}%` }}
                  />
                  <span
                    className="basin-list__elevated"
                    style={{ width: `${(b.elevated / maxStations) * 100}%` }}
                    title={`${b.elevated} above alert line`}
                  />
                </div>
                <div className="basin-list__meta faint">
                  <span>{b.share}% of coverage</span>
                  <span>{b.elevated} elevated</span>
                  <span>avg {b.avgLevel.toFixed(1)}%</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="faint rank-bars__foot">
            <span className="basin-list__elevated-key">
              <span className="basin-list__key-swatch" /> Above the alert line
            </span>
            <span>Bars are scaled to the largest province.</span>
          </p>
        </section>

        <section className="ui-card" aria-labelledby="national-title">
          <div className="ui-card__head">
            <h2 id="national-title">National status</h2>
            <Icon name="chart" size={18} className="muted" />
          </div>
          <div className="stat-breakdown__body stat-breakdown__body--stack">
            <Donut
              size={156}
              segments={(["normal", "alert", "minor", "major"] as const).map(
                (k) => ({
                  value: d.counts[k],
                  color: STATUS_META[k].token,
                  label: STATUS_META[k].label,
                }),
              )}
              centerLabel={`${((d.elevated / total) * 100).toFixed(0)}%`}
              centerSub="above alert"
              label={`Status split across ${d.total} gauges`}
            />
            <ul className="donut-legend donut-legend--wide">
              {(["normal", "alert", "minor", "major"] as const).map((k) => (
                <li key={k}>
                  <span
                    className="dot"
                    style={{ color: STATUS_META[k].token }}
                  />
                  <span className="muted">{STATUS_META[k].label}</span>
                  <strong className="num">{d.counts[k]}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
