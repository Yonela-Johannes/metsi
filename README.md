# South Africa Water Monitoring & Flood Watch Platform

A modern, interactive real-time water level, rainfall, and flood monitoring platform powered by live data from South Africa's **Department of Water and Sanitation (DWS)** and official DWS ArcGIS GIS Feature Services.

---

## 🌊 Overview & Core Capabilities

This platform aggregates, normalizes, and visualizes live hydrological data across **440+ official monitoring stations** in all 9 provinces of South Africa:
- Eastern Cape
- Free State
- Gauteng
- KwaZulu-Natal
- Limpopo
- Mpumalanga
- Northern Cape
- North West
- Western Cape

### Key Features
- **Authoritative South African Data** — Direct integration with South Africa's Department of Water and Sanitation (DWS) Hydrology services and DWS ArcGIS Feature Server (`DWS_Major_Dams_500k`).
- **Real-Time Rainfall Integration** — Live 24-hour precipitation totals (mm) per station location using Open-Meteo.
- **Interactive South Africa Map** — Built with Leaflet.js, displaying color-coded station markers across South Africa with interactive popups and station detail modals.
- **Priority Flood Alerts** — Ranked flood warning system prioritizing Major Flood ($\ge 110\%$), Minor Flood ($100-109\%$), and Alert ($80-99\%$) levels.
- **5 Dynamic Data Visualizations** — Chart.js charts for Water Level (% FSC), 24h Rainfall, Basin Distribution, Status Breakdown, and Threshold Comparison.
- **Searchable & Filterable Station Inventory** — Full table view with real-time text search, province/basin filters, status filters, pagination, and CSV export.
- **Data Reliability & Caching** — Automatic 5-minute background refresh, manual refresh controls, loading indicators, and local cache fallback when network connection is interrupted.

---

## 🛠️ Technical Stack & Data Architecture

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES6+), Chart.js 3.9.1, Leaflet.js 1.9.4, FontAwesome 6.4.0.
- **Data Ingestion**: Python 3 script (`scripts/update_flood_data.py`) using `requests`, `beautifulsoup4`, and `urllib3`.
- **Backend / Web Server**: Standard Python `server.py` (`http.server`).
- **Automated Ingestion**: GitHub Actions workflow (`.github/workflows/update_flood_data.yml`) running automated updates.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (for local server or data ingestion)
- Modern Web Browser (Chrome, Firefox, Safari, Edge)

### Running the Local Web Server

```bash
# Clone or navigate to project directory
cd Flood-Data-main

# Start the local server
python server.py

# Open in browser
# http://localhost:8000
```

### Running Data Ingestion Manually

To fetch the latest live readings from DWS South Africa and refresh the JSON/CSV datasets:

```bash
python scripts/update_flood_data.py
```

---

## 📊 Dashboard Views & Navigation

1. **Overview Tab**: Key status metric cards, national peak & average stats, and top priority alert gauges.
2. **Statistics Tab**: National capacity breakdown percentages, safety buffer margins, and risk assessment categories.
3. **Water Level Tab**: Top 15 stations by water level (% FSC) and 4-threshold bar comparison chart.
4. **Rainfall Tab**: Top 15 stations by 24-hour rainfall (mm).
5. **Basin Distribution Tab**: Station count breakdown per province / basin and national status doughnut charts.
6. **Flood Alerts Tab**: Filterable active flood alert list sorted by severity.
7. **Monitoring Map Tab**: Interactive Leaflet.js geographic map of South Africa with color-coded markers.
8. **All Stations Tab**: Full dataset table with searching, filtering, sorting, pagination, and CSV export.

---

## 🎨 Color Coding & Flood Alert Rules

- 🟢 **Normal**: Water level $< 80\%$ of Full Storage Capacity (FSC)
- 🟡 **Alert**: Water level $80\% - 99.9\%$ of FSC
- 🟠 **Minor Flood**: Water level $100\% - 109.9\%$ of FSC (dam spilling / minor overflow)
- 🔴 **Major Flood**: Water level $\ge 110\%$ of FSC (heavy spillway overflow / major flood risk)

---

## 📝 License & Data Attribution

Data sourced from South Africa's **Department of Water and Sanitation (DWS)** Hydrological Services (https://www.dws.gov.za/Hydrology/). Open-source platform under the MIT License.
