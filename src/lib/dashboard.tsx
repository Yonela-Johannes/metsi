"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  countByStatus,
  formatUtc,
  LIVE_DATA_URL,
  mean,
  median,
  pct,
  statusOf,
  sum,
} from "./data";
import type { FloodStatus, GaugeDataset, Station } from "./types";

export type ViewId =
  | "overview"
  | "statistics"
  | "water-level"
  | "rainfall"
  | "basins"
  | "alerts"
  | "map"
  | "stations";

export const VIEWS: {
  id: ViewId;
  label: string;
  short: string;
  icon: string;
}[] = [
  { id: "overview", label: "Overview", short: "Overview", icon: "chart" },
  { id: "statistics", label: "Statistics", short: "Stats", icon: "activity" },
  { id: "water-level", label: "Water level", short: "Levels", icon: "water" },
  { id: "rainfall", label: "Rainfall", short: "Rain", icon: "rain" },
  { id: "basins", label: "Basin distribution", short: "Basins", icon: "globe" },
  { id: "alerts", label: "Flood alerts", short: "Alerts", icon: "warning" },
  { id: "map", label: "Monitoring map", short: "Map", icon: "pin" },
  { id: "stations", label: "All stations", short: "Stations", icon: "table" },
];

const REFRESH_INTERVAL = 5 * 60 * 1000;
const CACHE_KEY = "sa-water-cache-v2";

export function viewFromSearch(search: string): ViewId {
  const wanted = new URLSearchParams(search).get("view");
  return VIEWS.some((v) => v.id === wanted) ? (wanted as ViewId) : "overview";
}

export function goToView(
  view: ViewId,
  dispatch: React.Dispatch<Action>,
  options: { scroll?: boolean; replace?: boolean } = {},
) {
  const { scroll = true, replace = false } = options;
  dispatch({ type: "view", view });

  try {
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    url.hash = "";
    const next = `${url.pathname}${url.search}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      if (replace) window.history.replaceState(null, "", next);
      else window.history.pushState(null, "", next);
    }
  } catch {
    /* history is unavailable — the view still switches */
  }

  if (scroll) {
    window.requestAnimationFrame(() => {
      document
        .getElementById("dashboard")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

/** One station per dam name — pristine station appears first so dedupe keeps it. */
export function dedupeStations(records: Station[]): Station[] {
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const r of records) {
    const key = (r.gauge || r.station_id || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/* ------------------------------ derived data ------------------------------ */
export type Ranked = {
  name: string;
  sub: string;
  value: number;
  delta: number;
  status: FloodStatus;
  /** The underlying record — dam names are not unique, so never re-look it up by name. */
  station: Station;
};

function toRanked(r: Station): Ranked {
  return {
    name: r.gauge,
    sub: [r.river, r.basin].filter(Boolean).join(" · "),
    value: r.water_level,
    delta: r.water_level - r.last_week_lvl,
    status: statusOf(r),
    station: r,
  };
}

export function derive(records: Station[]) {
  const counts = countByStatus(records);
  const total = records.length || 1;
  const levels = records
    .map((r) => r.water_level)
    .filter((n) => Number.isFinite(n));
  const rain = records
    .map((r) => r.rain_fall)
    .filter((n) => Number.isFinite(n));
  const byLevel = [...records].sort(
    (a, b) => b.water_level - a.water_level,
  );
  const byRain = [...records].sort((a, b) => b.rain_fall - a.rain_fall);

  const weekDelta = (r: Station) => r.water_level - r.last_week_lvl;
  const rising = [...records]
    .sort((a, b) => weekDelta(b) - weekDelta(a))
    .filter((r) => weekDelta(r) > 0)
    .slice(0, 6)
    .map<Ranked>(toRanked);

  const falling = [...records]
    .sort((a, b) => weekDelta(a) - weekDelta(b))
    .filter((r) => weekDelta(r) < 0)
    .slice(0, 6)
    .map<Ranked>(toRanked);

  const basins = Object.entries(
    records.reduce<Record<string, Station[]>>((acc, r) => {
      (acc[r.basin || "Other"] ||= []).push(r);
      return acc;
    }, {}),
  )
    .map(([name, list]) => {
      const c = countByStatus(list);
      return {
        name,
        stations: list.length,
        elevated: c.alert + c.minor + c.major,
        avgLevel: mean(list.map((s) => s.water_level)),
        share: pct(list.length, records.length),
      };
    })
    .sort((a, b) => b.stations - a.stations);

  const levelBands = [
    { label: "Under 60%", test: (n: number) => n < 60 },
    { label: "60–79%", test: (n: number) => n >= 60 && n < 80 },
    { label: "80–99%", test: (n: number) => n >= 80 && n < 100 },
    { label: "100–109%", test: (n: number) => n >= 100 && n < 110 },
    { label: "110% and above", test: (n: number) => n >= 110 },
  ].map((b) => ({
    label: b.label,
    count: levels.filter(b.test).length,
    share: pct(levels.filter(b.test).length, levels.length),
  }));

  const rainReporters = records.filter((r) => r.rain_fall > 0).length;
  const safetyMargin = mean(
    records.map((r) => Math.max(0, r.alertpull - r.water_level)),
  );

  return {
    counts,
    total: records.length,
    byLevel,
    byRain,
    rising,
    falling,
    basins,
    levelBands,
    risingCount: records.filter((r) => weekDelta(r) > 0).length,
    fallingCount: records.filter((r) => weekDelta(r) < 0).length,
    steadyCount: records.filter((r) => weekDelta(r) === 0).length,
    median: median(levels),
    avg: mean(levels),
    risingStreams: pct(records.filter((r) => weekDelta(r) > 0).length, total),
    maxWater: byLevel[0] as Station | undefined,
    maxRain: byRain[0] as Station | undefined,
    totalRain: sum(rain),
    rainReporters,
    safetyMargin,
    elevated: counts.alert + counts.minor + counts.major,
  };
}

export type Derived = ReturnType<typeof derive>;

/* ------------------------------- store shape ------------------------------ */
type LayerId = "levels" | "rain" | "stations" | "floodline";

interface State {
  layerOn: Record<LayerId, boolean>;
  levelMode: "all" | "elevated" | "normal";
  view: ViewId;
  motionPaused: boolean;
  status: "live" | "cached" | "loading" | "error";
}

type Action =
  | { type: "layer"; id: LayerId; on?: boolean }
  | { type: "levelMode"; mode: State["levelMode"] }
  | { type: "view"; view: ViewId }
  | { type: "motion" }
  | { type: "status"; status: State["status"] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "layer":
      return {
        ...state,
        layerOn: {
          ...state.layerOn,
          [action.id]: action.on ?? !state.layerOn[action.id],
        },
      };
    case "levelMode":
      return { ...state, levelMode: action.mode };
    case "view":
      return { ...state, view: action.view };
    case "motion":
      return { ...state, motionPaused: !state.motionPaused };
    case "status":
      return { ...state, status: action.status };
  }
}

const initial: State = {
  layerOn: { levels: true, rain: true, stations: true, floodline: false },
  levelMode: "all",
  view: "overview",
  motionPaused: false,
  status: "loading",
};

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  dataset: GaugeDataset;
  records: Station[];
  d: Derived;
  lastFetched: number | null;
  refresh: (manual?: boolean) => Promise<void>;
  saveStation: (name: string) => void;
  selected: Station | null;
  setSelected: (s: Station | null) => void;
}

const DashboardContext = createContext<Ctx | null>(null);

export function useDashboard(): Ctx {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}

export function DashboardProvider({
  initialData,
  children,
}: {
  initialData: GaugeDataset;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [dataset, setDataset] = useState<GaugeDataset>(initialData);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [selected, setSelected] = useState<Station | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const initial = viewFromSearch(window.location.search);
    if (initial !== "overview") dispatch({ type: "view", view: initial });

    const onPop = () => {
      dispatch({ type: "view", view: viewFromSearch(window.location.search) });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const applyDataset = useCallback((next: GaugeDataset, fromCache: boolean) => {
    setDataset(next);
    setLastFetched(Date.now());
    dispatch({ type: "status", status: fromCache ? "cached" : "live" });
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be full or blocked — non fatal */
    }
    return fromCache;
  }, []);

  const refresh = useCallback(
    async (manual = false) => {
      try {
        const res = await fetch(`${LIVE_DATA_URL}?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        applyDataset((await res.json()) as GaugeDataset, false);
        if (manual)
          window.dispatchEvent(
            new CustomEvent("sa-toast", { detail: "Live DWS data refreshed." }),
          );
      } catch {
        try {
          const cached = sessionStorage.getItem(CACHE_KEY);
          if (cached) {
            applyDataset(JSON.parse(cached) as GaugeDataset, true);
          } else {
            dispatch({ type: "status", status: "error" });
          }
        } catch {
          dispatch({ type: "status", status: "error" });
        }
        if (manual)
          window.dispatchEvent(
            new CustomEvent("sa-toast", {
              detail: "Network unavailable — showing the last saved dataset.",
            }),
          );
      }
    },
    [applyDataset],
  );

  useEffect(() => {
    timer.current = window.setInterval(() => refresh(false), REFRESH_INTERVAL);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [refresh]);

  const saveStation = useCallback((name: string) => {
    window.dispatchEvent(
      new CustomEvent("sa-toast", {
        detail: `Saved ${name} to your watchlist (this session).`,
      }),
    );
  }, []);

  const records = useMemo(
    () => dedupeStations(dataset.records),
    [dataset.records],
  );
  const d = useMemo(() => derive(records), [records]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      dataset,
      records,
      d,
      lastFetched,
      refresh,
      saveStation,
      selected,
      setSelected,
    }),
    [state, dataset, records, d, lastFetched, refresh, saveStation, selected],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}


