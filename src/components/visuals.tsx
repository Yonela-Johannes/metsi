import { STATUS_META } from "@/lib/types";
import type { FloodStatus } from "@/lib/types";
import { Icon } from "./Icon";

/* ------------------------------ status badge ------------------------------ */
export function StatusBadge({
  status,
  short = false,
}: {
  status: FloodStatus;
  short?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span className={`ui-badge ui-badge--${meta.badge}`}>
      <span
        className={`dot${status === "major" ? " dot--halo" : ""}`}
        aria-hidden="true"
      />
      {short ? meta.label.split(" ")[0] : meta.label}
    </span>
  );
}

export function Delta({ value, unit = "%" }: { value: number; unit?: string }) {
  const dir = value > 0.05 ? "up" : value < -0.05 ? "down" : "flat";
  const sign = dir === "up" ? "+" : "";
  return (
    <span className={`ui-delta ui-delta--${dir}`}>
      {dir === "up" ? <Icon name="trend" size={12} /> : null}
      {sign}
      {value.toFixed(1)} {unit}
      <span className="sr">
        {dir === "up" ? " rising" : dir === "down" ? " falling" : " unchanged"}
      </span>
    </span>
  );
}

/* -------------------------------- donut ---------------------------------- */
export function Donut({
  segments,
  size = 132,
  stroke = 14,
  centerLabel,
  centerSub,
  label,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerSub?: string;
  label: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ui-input)"
          strokeWidth={stroke}
        />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - 1.5)} ${c - Math.max(0, len - 1.5)}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {centerLabel ? (
        <div className="donut__center">
          <strong className="num">{centerLabel}</strong>
          {centerSub ? <span>{centerSub}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------- radar ---------------------------------- */
/** Lightweight SVG radar of the top gauges — calm, no dependency. */
export function GaugeRadar({ size = 200 }: { size?: number }) {
  const rings = [0.35, 0.62, 0.86];
  const blips = [
    { a: 25, r: 0.62, color: "var(--ui-ok)" },
    { a: 70, r: 0.4, color: "var(--ui-ok)" },
    { a: 105, r: 0.78, color: "var(--ui-warn)" },
    { a: 140, r: 0.52, color: "var(--ui-ok)" },
    { a: 175, r: 0.3, color: "var(--ui-info)" },
    { a: 210, r: 0.7, color: "var(--ui-above)" },
    { a: 250, r: 0.45, color: "var(--ui-ok)" },
    { a: 300, r: 0.66, color: "var(--ui-danger)" },
    { a: 335, r: 0.36, color: "var(--ui-ok)" },
  ];
  const mid = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" aria-hidden="true">
      {rings.map((r) => (
        <circle
          key={r}
          cx={mid}
          cy={mid}
          r={mid * r}
          fill="none"
          stroke="var(--ui-coast)"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
      ))}
      <path
        d={`M${mid} 0V${size}M0 ${mid}H${size}`}
        stroke="var(--ui-coast)"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      {blips.map((b, i) => {
        const rad = (b.a * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={mid + Math.cos(rad) * mid * b.r}
            cy={mid + Math.sin(rad) * mid * b.r}
            r={3.4}
            fill={b.color}
            className={i % 3 === 0 ? "map-pulse" : undefined}
            style={{
              transformOrigin: `${mid + Math.cos(rad) * mid * b.r}px ${mid + Math.sin(rad) * mid * b.r}px`,
            }}
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------- sparkbars -------------------------------- */
export function MiniBars({
  values,
  colors,
  label,
}: {
  values: number[];
  colors: string[];
  label: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="minibars" role="img" aria-label={label}>
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            height: `${Math.max(4, (v / max) * 100)}%`,
            background: colors[i],
          }}
        />
      ))}
    </div>
  );
}
