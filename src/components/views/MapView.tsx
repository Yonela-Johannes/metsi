"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import type { FloodStatus } from "@/lib/types";
import { Icon } from "../Icon";

const CITIES = [
  { name: "Cape Town", lat: -33.92, lng: 18.42 },
  { name: "Johannesburg", lat: -26.2, lng: 28.05 },
  { name: "Durban", lat: -29.86, lng: 31.02 },
  { name: "Bloemfontein", lat: -29.12, lng: 26.21 },
  { name: "Polokwane", lat: -23.9, lng: 29.45 },
];


export function MapView() {
  const { records, setSelected, d } = useDashboard();
  const [visible, setVisible] = useState<FloodStatus[]>([
    "normal",
    "alert",
    "minor",
    "major",
  ]);

  const project = (lat: number, lng: number) => ({
    x: ((lng - 16) / (33 - 16)) * 100,
    y: ((lat - -35) / (-22 - -35)) * 100,
  });

  const shown = records.filter((r) => visible.includes(r.status));

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="pin" size={13} /> Monitoring map
          </span>
          <h2>South Africa station distribution</h2>
          <p className="muted">
            Select a marker to open the station record. Zoomed map with terrain
            tiles lives in the hero canvas.
          </p>
        </div>
        <div
          className="mapview__legend"
          role="group"
          aria-label="Filter map markers"
        >
          {(["normal", "alert", "minor", "major"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={visible.includes(k)}
              className={`mapview__chip${visible.includes(k) ? " is-on" : ""}`}
              onClick={() =>
                setVisible((v) =>
                  v.includes(k) ? v.filter((x) => x !== k) : [...v, k],
                )
              }
            >
              <span
                className={`dot${k === "major" ? " dot--halo" : ""}`}
                style={{ color: STATUS_META[k].token }}
              />
              {STATUS_META[k].label.split(" ")[0]}
              <span className="num faint">{d.counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="ui-card mapview" aria-label="Station map">
        <div
          className="mapview__canvas"
          role="img"
          aria-label={`${shown.length} gauges plotted across South Africa`}
        >
          {CITIES.map((c) => {
            const p = project(c.lat, c.lng);
            return (
              <span
                key={c.name}
                className="mapview__city faint"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {c.name}
              </span>
            );
          })}
          {shown.map((s, i) => {
            const p = project(s.latitude, s.longitude);
            return (
              <button
                key={`${s.station_id}-${i}`}
                type="button"
                className={`mapview__marker mapview__marker--${s.status}`}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  background: STATUS_META[s.status].token,
                }}
                onClick={() => setSelected(s)}
                aria-label={`${s.gauge}, ${s.water_level.toFixed(1)}% of capacity, ${STATUS_META[s.status].label}`}
                title={`${s.gauge} — ${s.water_level.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <p className="faint mapview__foot">
          Equirectangular projection of DWS station coordinates. {shown.length}{" "}
          of {d.total} gauges shown.
        </p>
      </section>
    </div>
  );
}
