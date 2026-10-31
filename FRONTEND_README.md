# South Africa Water Monitoring & Flood Watch Platform — Frontend Documentation

A modern, responsive web application for real-time hydrological monitoring and flood Watch across South Africa, powered by the **Department of Water and Sanitation (DWS)**.

## 📋 Key Frontend Features

### 1. **Interactive South Africa Leaflet Map**
   - Centered on South Africa (`[-28.8, 24.8]`).
   - CircleMarkers color-coded by alert status:
     - 🟢 Normal ($< 80\%$ FSC)
     - 🟡 Alert ($80\% - 99.9\%$ FSC)
     - 🟠 Minor Flood ($100\% - 109.9\%$ FSC)
     - 🔴 Major Flood ($\ge 110\%$ FSC)
   - Clickable station popups & detailed station modal windows.

### 2. **5 Chart.js Data Visualizations**
   - **Water Level Chart**: Top 15 stations by % FSC with status color bars.
   - **Water Level vs Thresholds**: Horizontal bar chart comparing current levels against 80%, 100%, and 110% thresholds.
   - **24h Rainfall Chart**: Line chart of top 15 rainfall gauges (mm).
   - **Basin Distribution Chart**: Doughnut chart of station coverage by province / basin.
   - **National Alert Breakdown Chart**: Pie chart of status classifications.

### 3. **Searchable & Filterable Data Table**
   - Text search input for gauge name, river, station ID, or basin.
   - Basin / Province select filter.
   - Alert status select filter.
   - Pagination controls (15 rows per page).
   - One-click CSV Export button (`south_africa_water_monitoring.csv`).

### 4. **Data Reliability & Local Caching**
   - Auto-refresh every 5 minutes.
   - Manual refresh control.
   - Local Caching in `localStorage` (`sa_water_monitoring_cache`).
   - Offline fallback banner when network connections are interrupted.

---

## 🚀 Running the Application

### Option 1: Local Server (Recommended)

```bash
# Start server
python server.py

# Open in browser:
# http://localhost:8000
```

### Option 2: Standalone File

Open `index-standalone.html` directly in your browser.
