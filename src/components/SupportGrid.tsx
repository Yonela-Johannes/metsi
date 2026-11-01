"use client";

import { useDashboard, goToView } from "@/lib/dashboard";
import type { ViewId } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import { Icon } from "./Icon";

export function SupportGrid() {
  const { d, setSelected, dispatch } = useDashboard();
  const total = d.total || 1;

  const topByLevel = d.byLevel.slice(0, 3);
  const topByRain = d.byRain.slice(0, 3);
  const topBasins = d.basins.slice(0, 3);
  const top = topByLevel[0];

  const jump = (view: ViewId) => goToView(view, dispatch);

  return (
    <section className="support-grid" aria-labelledby="support-title">
      <h2 id="support-title" className="sr">
        Monitoring summaries
      </h2>

      <article className="ui-card support-card" id="view-water-level">
        <div className="ui-card__head">
          <h2>Water levels</h2>
          <Icon name="water" size={19} className="muted" />
        </div>
        <ul>
          {topByLevel.map((s) => (
            <li key={`${s.station_id}-${s.gauge}`} className="support-row">
              <span className="support-row__main">
                <button
                  type="button"
                  className="support-row__name"
                  onClick={() => setSelected(s)}
                >
                  {s.gauge}
                </button>
                <small className="muted">{s.basin}</small>
              </span>
              <span className="support-row__side">
                <small
                  className="muted"
                  style={{ color: STATUS_META[s.status].token }}
                >
                  {STATUS_META[s.status].label}
                </small>
                <strong className="num">{s.water_level.toFixed(1)}%</strong>
              </span>
            </li>
          ))}
        </ul>
        <div className="support-meter">
          <meter
            className="ui-meter"
            min={0}
            max={100}
            low={80}
            high={95}
            optimum={50}
            value={Math.min(100, top?.water_level ?? 0)}
            aria-label={`${top?.gauge ?? "Peak gauge"} at ${(top?.water_level ?? 0).toFixed(1)}% of capacity`}
          >
            {(top?.water_level ?? 0).toFixed(1)}%
          </meter>
          <span className="num">{(top?.water_level ?? 0).toFixed(1)}%</span>
        </div>
        <button
          type="button"
          className="ui-link support-card__foot"
          onClick={() => jump("water-level")}
        >
          Water level ranking <Icon name="arrow" size={14} />
        </button>
      </article>

      <article className="ui-card support-card" id="view-rainfall">
        <div className="ui-card__head">
          <h2>24-hour rainfall</h2>
          <Icon name="rain" size={19} className="muted" />
        </div>
        <ul>
          {topByRain.map((s) => (
            <li key={`${s.station_id}-${s.gauge}`} className="support-row">
              <span className="support-row__main">
                <button
                  type="button"
                  className="support-row__name"
                  onClick={() => setSelected(s)}
                >
                  {s.gauge}
                </button>
                <small className="muted">{s.river}</small>
              </span>
              <span className="support-row__side">
                <small className="muted">{s.basin.split(" ")[0]}</small>
                <strong className="num">{s.rain_fall.toFixed(1)} mm</strong>
              </span>
            </li>
          ))}
        </ul>
        <div className="support-meter">
          <meter
            className="ui-meter"
            min={0}
            max={Math.max(50, Math.ceil(topByRain[0]?.rain_fall ?? 10))}
            value={topByRain[0]?.rain_fall ?? 0}
            optimum={0}
            aria-label={`Heaviest gauge recorded ${(topByRain[0]?.rain_fall ?? 0).toFixed(1)} millimetres`}
          >
            {(topByRain[0]?.rain_fall ?? 0).toFixed(1)} mm
          </meter>
          <span className="num">
            {d.rainReporters}/{total}
          </span>
        </div>
        <button
          type="button"
          className="ui-link support-card__foot"
          onClick={() => jump("rainfall")}
        >
          Rainfall ranking <Icon name="arrow" size={14} />
        </button>
      </article>

      <article className="ui-card support-card" id="view-basins">
        <div className="ui-card__head">
          <h2>Provincial coverage</h2>
          <Icon name="globe" size={19} className="muted" />
        </div>
        <ul>
          {topBasins.map((b) => (
            <li key={b.name} className="support-row">
              <span className="support-row__main">
                <a
                  className="support-row__name"
                  href="?view=basins"
                  onClick={(e) => {
                    e.preventDefault();
                    jump("basins");
                  }}
                >
                  {b.name}
                </a>
                <small className="muted">
                  {b.elevated} above the alert line
                </small>
              </span>
              <span className="support-row__side">
                <small className="muted">gauges</small>
                <strong className="num">{b.stations}</strong>
              </span>
            </li>
          ))}
        </ul>
        <div className="support-meter">
          <meter
            className="ui-meter"
            min={0}
            max={100}
            low={45}
            optimum={70}
            value={topBasins[0]?.share ?? 0}
            aria-label={`${topBasins[0]?.name} holds ${topBasins[0]?.share}% of monitored gauges`}
          >
            {topBasins[0]?.share}%
          </meter>
          <span className="num">{topBasins[0]?.share}%</span>
        </div>
        <button
          type="button"
          className="ui-link support-card__foot"
          onClick={() => jump("basins")}
        >
          Basin distribution <Icon name="arrow" size={14} />
        </button>
      </article>

      <article className="ui-card support-card" id="view-alerts">
        <div className="ui-card__head">
          <h2>Alert thresholds</h2>
          <Icon name="warning" size={19} className="muted" />
        </div>
        <ul>
          {(["alert", "minor", "major"] as const).map((k) => (
            <li key={k} className="support-row">
              <span className="support-row__main">
                <button
                  type="button"
                  className="support-row__name"
                  onClick={() => jump("alerts")}
                >
                  {STATUS_META[k].label}
                </button>
                <small className="muted">{STATUS_META[k].blurb}</small>
              </span>
              <span className="support-row__side">
                <small className="muted">gauges</small>
                <strong className="num" style={{ color: STATUS_META[k].token }}>
                  {d.counts[k]}
                </strong>
              </span>
            </li>
          ))}
        </ul>
        <div className="support-meter">
          <meter
            className="ui-meter"
            min={0}
            max={100}
            low={25}
            high={60}
            optimum={0}
            value={Math.round((d.elevated / total) * 100)}
            aria-label={`${Math.round((d.elevated / total) * 100)}% of gauges are elevated`}
          >
            {Math.round((d.elevated / total) * 100)}%
          </meter>
          <span className="num">{Math.round((d.elevated / total) * 100)}%</span>
        </div>
        <button
          type="button"
          className="ui-link support-card__foot"
          onClick={() => jump("alerts")}
        >
          Full alert register <Icon name="arrow" size={14} />
        </button>
      </article>
    </section>
  );
}
