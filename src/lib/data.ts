import type { FloodStatus, Station } from './types';

/** Client-side revalidation: the endpoint the ingestion job writes to. */
export const LIVE_DATA_URL = '/data/gauges_2_view.json';

export function statusOf(s: Station): FloodStatus {
  if (s.status) return s.status;
  if (s.water_level >= 110) return "major";
  if (s.water_level >= 100) return "minor";
  if (s.water_level >= 80) return "alert";
  return "normal";
}

export function countByStatus(records: Station[]): Record<FloodStatus, number> {
  const out: Record<FloodStatus, number> = {
    normal: 0,
    alert: 0,
    minor: 0,
    major: 0,
  };
  for (const r of records) out[statusOf(r)] += 1;
  return out;
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function formatUtc(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function mean(values: number[]): number {
  return values.length ? sum(values) / values.length : 0;
}

export function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}
