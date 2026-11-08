# Metsi — South Africa Water Monitoring & Flood Watch Platform

A real-time water level, rainfall and flood monitoring dashboard for South Africa, built with **Next.js 14**. Data comes from the **Department of Water and Sanitation (DWS)** and the DWS ArcGIS Feature Service, enriched with Open-Meteo rainfall.

---

<!-- FLOOD_DATA_SUMMARY:START -->
### 🌊 Latest Flood Data Update

> **DWS Reading Date:** `2026-11-02` | **Platform Ingestion Sync:** `2026-11-08 17:53 SAST`

| Metric | Details |
| :--- | :--- |
| **DWS Measurement Date** | **2026-11-02** (Official Weekly State of Dams) |
| **Platform Ingestion Sync** | **2026-11-08 17:53 SAST** (UTC+2) |
| **Total Stations Monitored** | **448** DWS stations across 9 provinces |
| **🔴 Major Flood Risk (≥ 110% FSC)** | **0** dams |
| **🟠 Minor Flood Warning (100% – 109.9%)** | **162** dams |
| **🟡 Flood Alert (80% – 99.9%)** | **238** dams |
| **🟢 Normal Level (< 80%)** | **48** dams |
| **Highest Dam Water Level** | **Boegoeberg Dam** (109.5% FSC — Northern Cape) |
| **Total Storage Capacity** | **58,803.0 MCM** |
| **Stations Recording 24h Rain** | **298** location(s) (Peak: **Heyshope Dam** (35.3 mm — Mpumalanga)) |
| **Live Data Feed** | [`gauges_2_view.json`](public/data/gauges_2_view.json) | [`gauges_2_view.csv`](public/data/gauges_2_view.csv) |

*Data sourced from South Africa Department of Water and Sanitation (DWS) & Open-Meteo API.*
<!-- FLOOD_DATA_SUMMARY:END -->

---

## Core capabilities

- **Authoritative data** — DWS Hydrology dam levels, joined to the DWS ArcGIS `DWS_Major_Dams_500k` layer for coordinates, station IDs and catchments.
- **Live rainfall** — 24-hour precipitation totals (mm) per station via Open-Meteo.
- **Interactive map** — Leaflet map of South Africa with status-coloured station markers, rainfall bubbles and station detail dialogs.
- **Priority flood alerts** — ranked by Major Flood (≥ 110% FSC), Minor Flood (100–109%), Alert (80–99%) and Normal (< 80%).
- **Searchable station inventory** — text search, province/basin and status filters, pagination and CSV export.
- **Five views** — Overview, Statistics, Water Level, Rainfall, Basins, plus a dedicated Map and Alerts view.

---

## Stack

| Layer          | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| App            | Next.js 14 (App Router), React 18, TypeScript              |
| Styling        | Hand-written CSS with design tokens (`src/app/*.css`)      |
| Map            | Leaflet + CARTO basemap                                    |
| Data ingestion | Python 3 (`scripts/update_flood_data.py`)                  |
| Automation     | GitHub Actions (`.github/workflows/update_flood_data.yml`) |

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Useful checks:

```bash
npm run typecheck  # tsc --noEmit
npm run lint
```

No Python runtime is needed for the dashboard — the committed dataset in `public/data/` is served as static files.

---

## Data pipeline & activity automation

1. `scripts/update_flood_data.py` scrapes DWS Hydrology, enriches with ArcGIS coordinates and Open-Meteo rainfall.
2. It writes `public/data/gauges_2_view.json` and `public/data/gauges_2_view.csv` (the single source of truth — served at `/data/gauges_2_view.json`).
3. Whenever live flood data is refreshed, the script automatically updates the **Latest Flood Data Update** summary table in `README.md` between `<!-- FLOOD_DATA_SUMMARY:START -->
### 🌊 Latest Flood Data Update

> **DWS Reading Date:** `2026-11-02` | **Platform Ingestion Sync:** `2026-11-08 17:53 SAST`

| Metric | Details |
| :--- | :--- |
| **DWS Measurement Date** | **2026-11-02** (Official Weekly State of Dams) |
| **Platform Ingestion Sync** | **2026-11-08 17:53 SAST** (UTC+2) |
| **Total Stations Monitored** | **448** DWS stations across 9 provinces |
| **🔴 Major Flood Risk (≥ 110% FSC)** | **0** dams |
| **🟠 Minor Flood Warning (100% – 109.9%)** | **162** dams |
| **🟡 Flood Alert (80% – 99.9%)** | **238** dams |
| **🟢 Normal Level (< 80%)** | **48** dams |
| **Highest Dam Water Level** | **Boegoeberg Dam** (109.5% FSC — Northern Cape) |
| **Total Storage Capacity** | **58,803.0 MCM** |
| **Stations Recording 24h Rain** | **298** location(s) (Peak: **Heyshope Dam** (35.3 mm — Mpumalanga)) |
| **Live Data Feed** | [`gauges_2_view.json`](public/data/gauges_2_view.json) | [`gauges_2_view.csv`](public/data/gauges_2_view.csv) |

*Data sourced from South Africa Department of Water and Sanitation (DWS) & Open-Meteo API.*
<!-- FLOOD_DATA_SUMMARY:END -->`.
4. The GitHub Action workflow (`.github/workflows/update_flood_data.yml`) runs on schedule every 5 minutes, committing updated dataset files and the README activity summary when data changes occur (and skipping commits when data remains identical).

Run the ingestion locally with:

```bash
pip install requests beautifulsoup4 urllib3
python scripts/update_flood_data.py
```

---

## Project layout

```
src/app/            App Router pages, layout, tokens and component CSS
src/components/     UI components and the dashboard views
src/lib/            Dataset loader, types and formatting helpers
public/data/        Committed gauge dataset (JSON + CSV)
public/logo.png     Favicon and header mark
scripts/            Python ingestion script
.github/workflows/  Scheduled data refresh
```

---

## Flood alert rules

- 🟢 **Normal**: water level < 80% of Full Storage Capacity (FSC)
- 🟡 **Alert**: 80% – 99.9% of FSC
- 🟠 **Minor Flood**: 100% – 109.9% of FSC (dam spilling)
- 🔴 **Major Flood**: ≥ 110% of FSC (spillway overflow / major flood risk)

---

## License & attribution

Data sourced from South Africa's **Department of Water and Sanitation** hydrological services (<https://www.dws.gov.za/Hydrology/>) and Open-Meteo. Map tiles © OpenStreetMap contributors © CARTO. Released under the MIT License.
