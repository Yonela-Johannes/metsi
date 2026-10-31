# South Africa Water Monitoring & Flood Watch Platform — Features Summary

## Key Features Implemented

### 1. **Authoritative Live Data Source Integration**
   - Direct integration with South Africa's **Department of Water and Sanitation (DWS)** Hydrology Services.
   - Scraping live state of dams and water levels across all 9 provinces: Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, and Western Cape.
   - GIS enrichment using DWS ArcGIS Feature Server (`DWS_Major_Dams_500k`) for station IDs, river catchments, and geographic coordinates.
   - 24-hour rainfall precipitation totals (mm) for station locations via Open-Meteo.

### 2. **South African Geographic Monitoring Map**
   - Leaflet.js interactive map centered on South Africa (`[-28.8, 24.8]`).
   - Color-coded status markers:
     - 🟢 Normal ($<80\%$)
     - 🟡 Alert ($80-99\%$)
     - 🟠 Minor Flood ($100-109\%$)
     - 🔴 Major Flood ($\ge 110\%$)
   - Custom map popups with gauge name, river, basin, water level (% FSC), full storage capacity (MCM), 24h rainfall (mm), station ID, and detailed view modal launcher.

### 3. **Live Dashboard Statistics Cards & Risk Matrix**
   - **Highest Water Level**: Peak % FSC, gauge name, and basin.
   - **Highest Rainfall**: Peak 24h rainfall (mm), gauge name, and basin.
   - **Average Water Level**: Average % FSC across all active DWS gauges.
   - **Total 24h Rainfall**: Cumulative 24h precipitation sum across stations.
   - **Total Monitoring Stations Count**: Live count of active gauges (440+ stations).
   - **Active Flood Alerts**: Priority active warnings count.
   - **Risk Category Matrix**: Critical, High, Medium, and Low risk classification.

### 4. **5 Interactive Chart Visualizations (Chart.js)**
   - **Water Level Chart**: Bar chart of top 15 gauges by % FSC with status color bars.
   - **Threshold Comparison Chart**: Top 8 gauges compared against Alert (80%), Minor Flood (100%), and Major Flood (110%) thresholds.
   - **Rainfall Chart**: Line chart of top 15 gauges by 24h rainfall (mm).
   - **Basin Distribution Chart**: Doughnut chart of station counts by province/basin.
   - **Alert Level Status Chart**: Pie chart of national alert level status breakdown.

### 5. **Searchable, Filterable & Exportable Table**
   - Real-time text search by station name, station ID, river, or province.
   - Filter dropdown by basin / province.
   - Filter dropdown by alert severity (Normal, Alert, Minor, Major).
   - Dynamic pagination controls (15 rows per page with Page Previous/Next controls).
   - One-click CSV Export button (`south_africa_water_monitoring.csv`).

### 6. **Data Reliability & Local Caching**
   - Automatic 5-minute background refresh loop.
   - Manual "Refresh Live Data" button.
   - Caches responses in `localStorage` (`sa_water_monitoring_cache`).
   - Graceful offline fallback with stale dataset banner if network connection fails.
   - Displays measurement date separately from fetch timestamp.
