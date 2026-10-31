"use client";

import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import { Donut } from "../visuals";
import { Icon } from "../Icon";

const RISK = [
  {
    key: "major",
    label: "Critical risk",
    desc: "Major flood threshold exceeded (110%+)",
    badge: "danger",
  },
  {
    key: "minor",
    label: "High risk",
    desc: "Minor flood threshold exceeded (100%+)",
    badge: "above",
  },
  {
    key: "alert",
    label: "Medium risk",
    desc: "Alert threshold reached (80%+)",
    badge: "warn",
  },
  {
    key: "normal",
    label: "Low risk",
    desc: "Below the alert threshold (<80%)",
    badge: "ok",
  },
] as const;

export function StatisticsView() {
  const { d } = useDashboard();
  const total = d.total || 1;

  const donut = (["normal", "alert", "minor", "major"] as const).map((k) => ({
    value: d.counts[k],
    color: STATUS_META[k].token,
    label: STATUS_META[k].label,
  }));

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="activity" size={13} /> Statistics
          </span>
          <h2>Hydrological statistics</h2>
          <p className="muted">
            Risk classes, movement between readings and the buffer to the alert
            line.
          </p>
        </div>
      </div>

      <div className="split">
        <section
          className="ui-card stat-breakdown"
          aria-labelledby="stat-donut"
        >
          <div className="ui-card__head">
            <h2 id="stat-donut">Status breakdown</h2>
            <Icon name="chart" size={18} className="muted" />
          </div>
          <div className="stat-breakdown__body">
            <Donut
              segments={donut}
              centerLabel={`${Math.round((d.elevated / total) * 100)}%`}
              centerSub="elevated"
              label={`${d.counts.major} major, ${d.counts.minor} minor, ${d.counts.alert} alert and ${d.counts.normal} normal gauges`}
            />
            <ul className="donut-legend">
              {donut.map((s) => (
                <li key={s.label}>
                  <span className="dot" style={{ color: s.color }} />
                  <span className="muted">{s.label}</span>
                  <strong className="num">{s.value}</strong>
                  <small className="faint num">
                    {((s.value / total) * 100).toFixed(1)}%
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ui-card" aria-labelledby="week-move">
          <div className="ui-card__head">
            <h2 id="week-move">Movement since last week</h2>
            <Icon name="trend" size={18} className="muted" />
          </div>
          <ul className="bars">
            {[
              {
                label: "Rising",
                value: d.risingCount,
                color: "var(--ui-danger)",
              },
              {
                label: "Falling",
                value: d.fallingCount,
                color: "var(--ui-ok)",
              },
              { label: "Steady", value: d.steadyCount, color: "var(--ui-low)" },
            ].map((b) => (
              <li key={b.label}>
                <span>{b.label}</span>
                <span className="bars__track">
                  <span
                    style={{
                      width: `${(b.value / total) * 100}%`,
                      background: b.color,
                    }}
                  />
                </span>
                <strong className="num">{b.value}</strong>
              </li>
            ))}
          </ul>
          <div className="stat-pairs">
            <div>
              <span className="muted">Average buffer</span>
              <strong className="num">{d.safetyMargin.toFixed(1)} pts</strong>
            </div>
            <div>
              <span className="muted">Median level</span>
              <strong className="num">{d.median.toFixed(1)}%</strong>
            </div>
            <div>
              <span className="muted">Mean level</span>
              <strong className="num">{d.avg.toFixed(1)}%</strong>
            </div>
            <div>
              <span className="muted">Rain reporting</span>
              <strong className="num">
                {d.rainReporters}/{total}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section className="ui-card" aria-labelledby="risk-title">
        <div className="ui-card__head">
          <h2 id="risk-title">Risk assessment by threshold category</h2>
          <span className="faint">
            Classified from station-specific thresholds
          </span>
        </div>
        <ul className="risk">
          {RISK.map((r) => {
            const count = d.counts[r.key];
            return (
              <li key={r.key} className={`risk__row risk__row--${r.badge}`}>
                <span className="risk__icon">
                  <Icon
                    name={r.key === "normal" ? "shield" : "warning"}
                    size={18}
                  />
                </span>
                <span className="risk__main">
                  <strong>{r.label}</strong>
                  <small className="muted">{r.desc}</small>
                </span>
                <span className="num risk__count">{count}</span>
                <span className={`ui-badge ui-badge--${r.badge}`}>
                  {((count / total) * 100).toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
