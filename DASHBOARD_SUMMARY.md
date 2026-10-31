# South Africa Water Monitoring & Flood Watch Platform — Project Summary

## Overview

A complete, production-ready, real-time hydrological and flood Watch dashboard powered by live data from South Africa's **Department of Water and Sanitation (DWS)** and official DWS ArcGIS GIS Feature Services, enriched with 24-hour rainfall measurements.

## Core Features Implemented

### 1. **Official DWS South Africa Data Source**
   - Scrapes live weekly dam levels and water storage metrics across all 9 South African provinces from DWS Hydrology (`https://www.dws.gov.za/Hydrology/`).
   - Integrates DWS Major Dams ArcGIS Feature Server (`DWS_Major_Dams_500k`) for precise geographic coordinates (latitude, longitude), station IDs, and primary/secondary river catchments.
   - Enriches each station with live 24-hour precipitation totals (mm) via Open-Meteo.

### 2. **Interactive South Africa Leaflet Map**
   - Centered on South Africa (`[-28.8, 24.8]`, zoom 6).
   - Custom status color markers:
     - 🟢 Normal ($< 80\%$)
     - 🟡 Alert ($80-99\%$)
     - 🟠 Minor Flood ($100-109\%$)
     - 🔴 Major Flood ($\ge 110\%$)
   - Interactive popups with gauge name, river, province, FSC, current level, 24h rainfall, and station detail modal trigger.

### 3. **Key Metrics & Statistics**
   - Highest Water Level (Peak % FSC & station name).
   - Highest 24h Rainfall (Peak mm & station name).
   - National Average Water Level (%).
   - Total Cumulative 24h Rainfall (mm).
   - Total Active Stations Count (440+ gauges).
   - Priority Flood Alerts Count.

### 4. **5 Chart.js Data Visualizations**
   - Top 15 Stations by Water Level (% FSC).
   - Water Level vs Thresholds Comparison Chart (Alert 80%, Minor 100%, Major 110%).
   - Top 15 Stations by 24h Rainfall (mm).
   - Station Distribution per Basin / Province (Doughnut).
   - National Status Alert Level Breakdown (Pie).

### 5. **Full Stations Table & CSV Export**
   - Text search by gauge name, river, station ID, or province.
   - Basin / Province filter dropdown.
   - Alert severity filter dropdown.
   - Pagination controls (15 rows per page).
   - One-click CSV Export button (`south_africa_water_monitoring.csv`).

### 6. **Data Reliability & Local Caching**
   - Auto-refresh every 5 minutes.
   - Manual refresh control.
   - Caching in `localStorage` with offline fallback mode.
   - Distinct measurement date vs fetch timestamp.
