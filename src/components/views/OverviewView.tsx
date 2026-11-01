"use client";

import { useDashboard, goToView } from "@/lib/dashboard";
import { formatDate } from "@/lib/data";
import { STATUS_META } from "@/lib/types";
import type { FloodStatus } from "@/lib/types";
import { Icon } from "../Icon";
import { Delta, MiniBars, StatusBadge } from "../visuals";

const ORDER: FloodStatus[] = ["normal", "alert", "minor", "major"];

export function OverviewView() {
  const { d, records, setSelected, refresh, refreshing, dispatch } =
    useDashboard();
  const total = d.total || 1;
  const top = [...records]
    .filter((r) => r.status !== "normal")
    .sort(
      (a, b) =>
        STATUS_META[b.status].rank - STATUS_META[a.status].rank ||
        b.water_level - a.water_level,
    )
    .slice(0, 6);

  const peak = d.maxWater;
  const cards = [
    {
      label: "Above alert line",
      value: String(d.elevated),
      sub: `${((d.elevated / total) * 100).toFixed(0)}% of gauges`,
      token: "var(--ui-warn)",
    },
    {
      label: "Median level",
      value: `${d.median.toFixed(1)}%`,
      sub: "of full storage capacity",
      token: "var(--ui-accent)",
    },
    {
      label: "Rising this week",
      value: String(d.risingCount),
      sub: `${d.fallingCount} fell · ${d.steadyCount} steady`,
      token: "var(--ui-info)",
    },
    {
      label: "24h rainfall",
      value: `${d.totalRain.toFixed(1)}`,
      unit: "mm",
      sub: `${d.rainReporters} reporting gauges`,
      token: "var(--ui-info)",
    },
    {
      label: "Peak gauge",
      value: peak ? `${peak.water_level.toFixed(1)}%` : "—",
      sub: peak ? peak.gauge : "No readings yet",
      token: peak ? STATUS_META[peak.status].token : "var(--ui-low)",
    },
    {
      label: "Average buffer",
      value: `${d.safetyMargin.toFixed(1)}`,
      unit: "pts",
      sub: "margin below the alert line",
      token: "var(--ui-ok)",
    },
  ];

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="chart" size={13} /> Overview
          </span>
          <h2>National picture at a glance</h2>
          <p className="muted">
            {d.total} gauges · DWS reading of {formatDate(records[0]?.date)}
          </p>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--sm"
          onClick={() => refresh(true)}
          disabled={refreshing}
          aria-busy={refreshing}
          title="Fetch the latest DWS reading"
        >
          <Icon
            name="refresh"
            size={14}
            className={refreshing ? "is-spinning" : undefined}
          />
          {refreshing ? "Refreshing…" : "Refresh data"}
        </button>
      </div>

      {/* four status cards with donut-style proportions */}
      <div className="status-grid">
        {ORDER.map((k) => {
          const meta = STATUS_META[k];
          return (
            <div key={k} className={`ui-card status-card status-card--${k}`}>
              <div className="status-card__head">
                <span
                  className={`dot${k === "major" ? " dot--halo" : ""}`}
                  style={{ color: meta.token }}
                />
                <span>{meta.label}</span>
                <span className="muted num status-card__pct">
                  {((d.counts[k] / total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="status-card__value num">{d.counts[k]}</div>
              <div className="status-card__bar">
                <span
                  style={{
                    width: `${(d.counts[k] / total) * 100}%`,
                    background: meta.token,
                  }}
                />
              </div>
              <p className="muted status-card__blurb">{meta.blurb}</p>
            </div>
          );
        })}
      </div>

      <div className="metric-grid">
        {cards.map((c) => (
          <div key={c.label} className="ui-card kpi">
            <span className="kpi__label">{c.label}</span>
            <span className="kpi__value num">
              {c.value}
              {c.unit ? <small>{c.unit}</small> : null}
            </span>
            <span className="kpi__sub muted">{c.sub}</span>
            <span
              className="kpi__mark"
              style={{ background: c.token }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <div className="split">
        <section className="ui-card" aria-labelledby="priority-alerts">
          <div className="ui-card__head">
            <h2 id="priority-alerts">Priority alerts</h2>
            <a
              className="ui-link"
              href="?view=alerts"
              onClick={(e) => {
                e.preventDefault();
                goToView("alerts", dispatch);
              }}
            >
              All alerts <Icon name="arrow" size={14} />
            </a>
          </div>
          {top.length === 0 ? (
            <p className="muted empty">
              <Icon name="shield" size={22} /> Every gauge is within normal
              operating limits.
            </p>
          ) : (
            <ul className="rows">
              {top.map((s) => (
                <li key={`${s.gauge}-${s.latitude}`}>
                  <button
                    type="button"
                    className="row-btn"
                    onClick={() => setSelected(s)}
                  >
                    <span className="row-btn__main">
                      <strong>{s.gauge}</strong>
                      <small className="muted">
                        {s.river} · {s.basin}
                      </small>
                    </span>
                    <span className="row-btn__side">
                      <span className="num row-btn__value">
                        {s.water_level.toFixed(1)}%
                      </span>
                      <StatusBadge status={s.status} short />
                    </span>
                    <span className="row-btn__delta">
                      <Delta value={s.water_level - s.last_week_lvl} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ui-card" aria-labelledby="distribution">
          <div className="ui-card__head">
            <h2 id="distribution">Level distribution</h2>
            <Icon name="activity" size={18} className="muted" />
          </div>
          <ul className="dist">
            {d.levelBands.map((b) => (
              <li key={b.label}>
                <span className="muted">{b.label}</span>
                <span className="dist__track">
                  <span style={{ width: `${b.share}%` }} />
                </span>
                <strong className="num">{b.count}</strong>
              </li>
            ))}
          </ul>
          <div className="dist__spark">
            <MiniBars
              values={[
                d.counts.normal,
                d.counts.alert,
                d.counts.minor,
                d.counts.major,
              ]}
              colors={[
                STATUS_META.normal.token,
                STATUS_META.alert.token,
                STATUS_META.minor.token,
                STATUS_META.major.token,
              ]}
              label={`Status spread: ${d.counts.normal} normal, ${d.counts.alert} alert, ${d.counts.minor} minor flood, ${d.counts.major} major flood`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
