# 🚀 Quick Start Guide - South Africa Water Monitoring Platform

## ⚡ Setup & Launch Guide

### 1. Launching the Local Dashboard Server

```bash
# Navigate to project root directory
cd Flood-Data-main

# Start Python server
python server.py

# Open in your browser:
# http://localhost:8000
```

### 2. Standalone Offline Mode

Simply open `index-standalone.html` directly in your browser. It automatically loads cached data or fallback data.

### 3. Updating Live South African Hydrological Data

To trigger live data collection directly from South Africa's **Department of Water and Sanitation (DWS)** and Open-Meteo:

```bash
python scripts/update_flood_data.py
```

---

## 🎯 Main Dashboard Tabs

| Tab | What It Displays |
|---|---|
| 📊 **Overview** | Key status metrics, peak & average statistics, and priority flood alerts |
| 🧮 **Statistics** | National capacity breakdown, safety margins, and risk assessment categories |
| 💧 **Water Level** | Top 15 stations by water level (% FSC) and threshold comparison chart |
| 🌧️ **Rainfall** | Top 15 stations by 24h rainfall totals (mm) |
| 🗺️ **Basin Distribution** | Station counts by province/basin and national alert level pie chart |
| 🚨 **Flood Alerts** | Filterable active flood alerts sorted by severity |
| 📍 **Monitoring Map** | Interactive South Africa Leaflet.js map with color-coded status markers |
| 📋 **All Stations** | Searchable table with basin & status filters, pagination, and CSV export |

---

## 🎨 Color Coding Legend

- 🟢 **Green** = Normal ($<80\%$ FSC)
- 🟡 **Amber** = Alert ($80\% - 99.9\%$ FSC)
- 🟠 **Orange** = Minor Flood ($100\% - 109.9\%$ FSC)
- 🔴 **Red** = Major Flood ($\ge 110\%$ FSC)

---

## 💾 Dataset Files

- `data/gauges_2_view.json`: Live normalized JSON payload with metadata.
- `data/gauges_2_view.csv`: Exportable CSV spreadsheet dataset.
- Source: Department of Water and Sanitation (DWS) South Africa (`https://www.dws.gov.za/Hydrology/`).
