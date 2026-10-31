"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import type { FloodStatus } from "@/lib/types";
import { Icon } from "../Icon";
import { StatusBadge } from "../visuals";

const PAGE_SIZE = 15;
type SortKey = "gauge" | "water_level" | "rain_fall" | "basin";

export function StationsView() {
  const { records, setSelected } = useDashboard();
  const [query, setQuery] = useState("");
  const [basin, setBasin] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "water_level",
    dir: -1,
  });
  const [page, setPage] = useState(1);

  const basins = useMemo(
    () => [...new Set(records.map((r) => r.basin))].filter(Boolean).sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter(
        (r) =>
          (!q ||
            r.gauge.toLowerCase().includes(q) ||
            r.river.toLowerCase().includes(q) ||
            r.basin.toLowerCase().includes(q) ||
            r.station_id.toLowerCase().includes(q)) &&
          (!basin || r.basin === basin) &&
          (!status || r.status === status),
      )
      .sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (typeof av === "number" && typeof bv === "number")
          return (av - bv) * sort.dir;
        return String(av).localeCompare(String(bv)) * sort.dir;
      });
  }, [records, query, basin, status, sort]);

  useEffect(() => setPage(1), [query, basin, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const headers = [
      "Station",
      "ID",
      "Basin",
      "River",
      "Water level (%)",
      "Capacity (MCM)",
      "24h rain (mm)",
      "Status",
      "Date",
    ];
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        [
          r.gauge,
          r.station_id,
          r.basin,
          r.river,
          r.water_level,
          r.fsc_mcm,
          r.rain_fall,
          r.status,
          r.date,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "south_africa_water_monitoring.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 1 ? -1 : 1 }
        : { key, dir: key === "gauge" || key === "basin" ? 1 : -1 },
    );
  }

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="table" size={13} /> All stations
          </span>
          <h2>Station inventory</h2>
          <p className="muted">
            {filtered.length} of {records.length} gauges · sorted by{" "}
            {sort.key.replace("_", " ")}
          </p>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--sm"
          onClick={exportCsv}
        >
          <Icon name="download" size={14} /> Export CSV
        </button>
      </div>

      <div className="table-tools">
        <div className="table-tools__search">
          <Icon name="search" size={16} />
          <label htmlFor="station-search" className="sr">
            Search stations
          </label>
          <input
            id="station-search"
            className="ui-input"
            type="search"
            placeholder="Station, river, ID or province"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sr" htmlFor="station-basin">
          Filter by province
        </label>
        <select
          id="station-basin"
          className="ui-select"
          value={basin}
          onChange={(e) => setBasin(e.target.value)}
        >
          <option value="">All provinces</option>
          {basins.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <label className="sr" htmlFor="station-status">
          Filter by status
        </label>
        <select
          id="station-status"
          className="ui-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_META) as FloodStatus[]).map((k) => (
            <option key={k} value={k}>
              {STATUS_META[k].label}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="ui-card empty muted">
          <Icon name="search" size={22} /> No gauges match this search and
          filter combination.
        </p>
      ) : (
        <div className="ui-card table-card">
          <table className="table">
            <caption className="sr">Water monitoring stations</caption>
            <thead>
              <tr>
                {(
                  [
                    ["gauge", "Station"],
                    ["station_id", "ID"],
                    ["basin", "Province"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={
                      sort.key === key
                        ? sort.dir === 1
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="table__sort"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <Icon
                        name="chevron-down"
                        size={12}
                        className={
                          sort.key === key && sort.dir === 1
                            ? "is-flipped"
                            : undefined
                        }
                      />
                    </button>
                  </th>
                ))}
                <th scope="col">River</th>
                {(
                  [
                    ["water_level", "Level"],
                    ["rain_fall", "24h rain"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    scope="col"
                    className="num"
                    aria-sort={
                      sort.key === key
                        ? sort.dir === 1
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="table__sort"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <Icon
                        name="chevron-down"
                        size={12}
                        className={
                          sort.key === key && sort.dir === 1
                            ? "is-flipped"
                            : undefined
                        }
                      />
                    </button>
                  </th>
                ))}
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={`${s.station_id}-${s.gauge}-${i}`}>
                  <td data-label="Station">
                    <button
                      type="button"
                      className="table__link"
                      onClick={() => setSelected(s)}
                    >
                      {s.gauge}
                    </button>
                    <small className="muted table__sub">{s.date}</small>
                  </td>
                  <td data-label="ID" className="num muted">
                    {s.station_id}
                  </td>
                  <td data-label="Province">{s.basin}</td>
                  <td data-label="River" className="muted">
                    {s.river}
                  </td>
                  <td data-label="Level" className="num">
                    <strong>{s.water_level.toFixed(1)}%</strong>
                  </td>
                  <td data-label="24h rain" className="num">
                    {s.rain_fall.toFixed(1)} mm
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={s.status} short />
                  </td>
                  <td data-label="Open">
                    <button
                      type="button"
                      className="icon-btn icon-btn--sm"
                      onClick={() => setSelected(s)}
                      aria-label={`Open ${s.gauge}`}
                    >
                      <Icon name="arrow" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pager">
        <span className="faint num">
          {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(filtered.length, page * PAGE_SIZE)} of {filtered.length}
        </span>
        <div className="pager__buttons">
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <Icon name="chevron" size={14} className="is-flipped" /> Prev
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
            .map((n, idx, arr) => (
              <span key={n} className="pager__wrap">
                {idx > 0 && n - arr[idx - 1] > 1 ? (
                  <span className="faint">…</span>
                ) : null}
                <button
                  type="button"
                  className={`pager__page${n === page ? " is-active" : ""}`}
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              </span>
            ))}
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--sm"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <Icon name="chevron" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
