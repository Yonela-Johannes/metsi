export type FloodStatus = "normal" | "alert" | "minor" | "major";

export interface Station {
  gauge: string;
  station_id: string;
  river: string;
  basin: string;
  province: string;
  water_level: number;
  fsc_mcm: number;
  last_week_lvl: number;
  last_year_lvl: number;
  alertpull: number;
  warningpull: number;
  dangerpull: number;
  latitude: number;
  longitude: number;
  date: string;
  status: FloodStatus;
  source: string;
  rain_fall: number;
}

export interface GaugeDataset {
  last_updated_utc: string;
  source: string;
  source_url: string;
  record_count: number;
  records: Station[];
}

export const THRESHOLDS = { alert: 80, minor: 100, major: 110 } as const;

export const STATUS_META: Record<
  FloodStatus,
  {
    label: string;
    token: string;
    badge: "ok" | "warn" | "above" | "danger";
    rank: number;
    blurb: string;
  }
> = {
  normal: {
    label: "Normal",
    token: "var(--ui-ok)",
    badge: "ok",
    rank: 0,
    blurb: "Below 80% of full capacity",
  },
  alert: {
    label: "Alert",
    token: "var(--ui-warn)",
    badge: "warn",
    rank: 1,
    blurb: "80–99% — nearing capacity",
  },
  minor: {
    label: "Minor flood",
    token: "var(--ui-above)",
    badge: "above",
    rank: 2,
    blurb: "100–109% — spilling over capacity",
  },
  major: {
    label: "Major flood",
    token: "var(--ui-danger)",
    badge: "danger",
    rank: 3,
    blurb: "110%+ — heavy spillway overflow",
  },
};
