# Metsi — South Africa Water Monitoring & Flood Watch Platform

A real-time water level, rainfall and flood monitoring dashboard for South Africa, built with **Next.js 14**. Data comes from the **Department of Water and Sanitation (DWS)** and the DWS ArcGIS Feature Service, enriched with Open-Meteo rainfall.

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

## Data pipeline

1. `scripts/update_flood_data.py` scrapes DWS Hydrology, enriches with ArcGIS coordinates and Open-Meteo rainfall.
2. It writes `public/data/gauges_2_view.json` and `public/data/gauges_2_view.csv` (the single source of truth — these are the files the app serves at `/data/gauges_2_view.json`).
3. The GitHub Action runs every five minutes and commits refreshed data back to `main` (skipping the commit when nothing changed).

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
