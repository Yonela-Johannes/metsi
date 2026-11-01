"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/lib/dashboard";
import { STATUS_META } from "@/lib/types";
import type { FloodStatus } from "@/lib/types";
import { Icon } from "../Icon";
import { StatusBadge } from "../visuals";

const PAGE_SIZE = 15;
type SortKey = "gauge" | "water_level" | "rain_fall" | "basin";
type Sort = { key: SortKey; dir: 1 | -1 };

const SORT_LABELS: Record<SortKey, string> = {
  gauge: "station name",
  water_level: "water level",
  rain_fall: "24-hour rainfall",
  basin: "province",
};

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function StationsView() {
  const { records, setSelected } = useDashboard();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "water_level", dir: -1 });
  const [page, setPage] = useState(1);

  const provinces = useMemo(
    () => [...new Set(records.map((r) => r.basin).filter(Boolean))].sort(),
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
            r.province.toLowerCase().includes(q) ||
            r.station_id.toLowerCase().includes(q)) &&
          (!province || r.basin === province) &&
          (!status || r.status === status),
      )
      .sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (typeof av === "number" && typeof bv === "number")
          return (av - bv) * sort.dir;
        return String(av).localeCompare(String(bv)) * sort.dir;
      });
  }, [records, query, province, status, sort]);

  useEffect(() => setPage(1), [query, province, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(query.trim() || province || status);

  function clearFilters() {
    setQuery("");
    setProvince("");
    setStatus("");
  }

  function exportCsv() {
    const headers = [
      "Station",
      "ID",
      "Province",
      "River",
      "Water level (%)",
      "Capacity (MCM)",
      "Week change",
      "24h rain (mm)",
      "Status",
      "Date",
    ];
    const csv = [
      headers.map(csvCell).join(","),
      ...filtered.map((r) =>
        [
          r.gauge,
          r.station_id,
          r.basin,
          r.river,
          r.water_level.toFixed(1),
          r.fsc_mcm,
          (r.water_level - r.last_week_lvl).toFixed(1),
          r.rain_fall.toFixed(1),
          STATUS_META[r.status].label,
          r.date,
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "south_africa_water_monitoring.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // revoking synchronously can cancel the download in some browsers
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 1 ? -1 : 1 }
        : { key, dir: key === "gauge" || key === "basin" ? 1 : -1 },
    );
  }

  const sortableHead = (key: SortKey, label: string, numeric = false) => {
    const active = sort.key === key;
    return (
      <th
        key={key}
        scope="col"
        className={numeric ? "num" : undefined}
        aria-sort={
          active ? (sort.dir === 1 ? "ascending" : "descending") : "none"
        }
      >
        <button
          type="button"
          className={`table__sort${active ? " is-active" : ""}`}
          onClick={() => toggleSort(key)}
        >
          {label}
          <Icon
            name="chevron-down"
            size={12}
            className={
              active ? (sort.dir === 1 ? "is-flipped" : undefined) : "is-idle"
            }
          />
        </button>
      </th>
    );
  };

  return (
    <div className="view">
      <div className="view__head">
        <div>
          <span className="eyebrow">
            <Icon name="table" size={13} /> All stations
          </span>
          <h2>Station inventory</h2>
          <p className="muted">
            {filtered.length === records.length
              ? `${records.length} gauges`
              : `${filtered.length} of ${records.length} gauges`}{" "}
            · sorted by {SORT_LABELS[sort.key]} (
            {sort.dir === 1 ? "ascending" : "descending"})
          </p>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn--secondary ui-btn--sm"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          title="Download the filtered rows as CSV"
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
        <label className="sr" htmlFor="station-province">
          Filter by province
        </label>
        <select
          id="station-province"
          className="ui-select"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">All provinces</option>
          {provinces.map((b) => (
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
        {hasFilters ? (
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm table-tools__clear"
            onClick={clearFilters}
          >
            <Icon name="close" size={13} /> Clear filters
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="ui-card empty empty--stack">
          <Icon name="search" size={24} />
          <p>
            No gauges match this search and filter combination.
            {hasFilters ? " Try removing a filter." : null}
          </p>
          {hasFilters ? (
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--sm"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="ui-card table-card">
          <table className="table">
            <caption className="sr">Water monitoring stations</caption>
            <thead>
              <tr>
                {sortableHead("gauge", "Station")}
                <th scope="col">ID</th>
                {sortableHead("basin", "Province")}
                <th scope="col">River</th>
                {sortableHead("water_level", "Level", true)}
                {sortableHead("rain_fall", "24h rain", true)}
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr">Open station</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={`${s.station_id}-${s.gauge}`}>
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
                  <td data-label="Open" className="table__action">
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

      {filtered.length > 0 ? (
        <div className="pager">
          <span className="faint num">
            {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(filtered.length, safePage * PAGE_SIZE)} of{" "}
            {filtered.length}
          </span>
          <div className="pager__buttons">
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--sm"
              disabled={safePage === 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
            >
              <Icon name="chevron" size={14} className="is-flipped" /> Prev
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pages || Math.abs(n - safePage) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="pager__wrap">
                  {idx > 0 && n - arr[idx - 1] > 1 ? (
                    <span className="faint">…</span>
                  ) : null}
                  <button
                    type="button"
                    className={`pager__page${n === safePage ? " is-active" : ""}`}
                    aria-current={n === safePage ? "page" : undefined}
                    aria-label={`Page ${n}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--sm"
              disabled={safePage === pages}
              onClick={() => setPage(Math.min(pages, safePage + 1))}
            >
              Next <Icon name="chevron" size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
