"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import type { FloodStatus } from "@/lib/types";
import { Icon } from "../Icon";
import { Delta, StatusBadge } from "../visuals";

export function AlertsView() {
  const { records, setSelected } = useDashboard();
  const [active, setActive] = useState<
    Record<Exclude<FloodStatus, "normal">, boolean>
  >({
    alert: true,
    minor: true,
    major: true,
  });

  const filtered = useMemo(
    () =>
      records
        .filter((r) => r.status !== "normal" && active[r.status])
        .sort(
          (a, b) =>
            STATUS_META[b.status].rank - STATUS_META[a.status].rank ||
            b.water_level - a.water_level,
        ),
    [records, active],
  );

  const thresholds: { key: Exclude<FloodStatus, "normal">; range: string }[] = [
    { key: "alert", range: "80–99%" },
    { key: "minor", range: "100–109%" },
    { key: "major", range: "110%+" },
  ];

  return (
    <div className="view" id="alerts">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="warning" size={13} /> Flood alerts
          </span>
          <h2>Active hydrological warnings</h2>
          <p className="muted">
            Sorted by severity, highest reading first. Thresholds describe water
            level relative to full capacity and do not replace official
            disaster-management advice.
          </p>
        </div>
      </div>

      <div
        className="alert-filters"
        role="group"
        aria-label="Filter by severity"
      >
        {thresholds.map((t) => {
          const meta = STATUS_META[t.key];
          return (
            <button
              key={t.key}
              type="button"
              role="switch"
              aria-checked={active[t.key]}
              className={`alert-filter${active[t.key] ? " is-on" : ""}`}
              onClick={() => setActive((a) => ({ ...a, [t.key]: !a[t.key] }))}
            >
              <span
                className={`dot${t.key === "major" ? " dot--halo" : ""}`}
                style={{ color: meta.token }}
              />
              <span>
                <strong>{meta.label}</strong>
                <small className="muted">{t.range} of capacity</small>
              </span>
              <span className="alert-filter__count num">
                {records.filter((r) => r.status === t.key).length}
              </span>
              <span
                className="ui-switch"
                aria-hidden="true"
                data-on={active[t.key]}
              />
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="ui-card empty muted">
          <Icon name="shield" size={24} /> No active alerts match the selected
          severities.
        </p>
      ) : (
        <ul className="alert-cards">
          {filtered.map((s) => {
            const threshold =
              s.status === "major" ? 110 : s.status === "minor" ? 100 : 80;
            return (
              <li
                key={`${s.gauge}-${s.station_id}-${s.latitude}`}
                className={`alert-card alert-card--${s.status}`}
              >
                <button
                  type="button"
                  className="alert-card__btn"
                  onClick={() => setSelected(s)}
                >
                  <span className="alert-card__top">
                    <span className="alert-card__name">
                      <span
                        className={`dot${s.status === "major" ? " dot--halo" : ""}`}
                        style={{ color: STATUS_META[s.status].token }}
                      />
                      <strong>{s.gauge}</strong>
                    </span>
                    <StatusBadge status={s.status} />
                  </span>
                  <span className="alert-card__sub muted">
                    {s.basin} · {s.river} · gauge {s.station_id}
                  </span>
                  <span className="alert-card__stats">
                    <span>
                      <small className="muted">Water level</small>
                      <strong className="num">
                        {s.water_level.toFixed(1)}%
                      </strong>
                    </span>
                    <span>
                      <small className="muted">Over {threshold}% line</small>
                      <strong className="num">
                        +{(s.water_level - threshold).toFixed(1)} pts
                      </strong>
                    </span>
                    <span>
                      <small className="muted">Week change</small>
                      <Delta value={s.water_level - s.last_week_lvl} />
                    </span>
                    <span>
                      <small className="muted">24h rain</small>
                      <strong className="num">
                        {s.rain_fall.toFixed(1)} mm
                      </strong>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
