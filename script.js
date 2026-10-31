// ============================================================================
// South Africa Water Monitoring & Flood Watch Platform
// Data Source: Department of Water and Sanitation (DWS) South Africa
// ============================================================================

const DATA_URL = './data/gauges_2_view.json';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 15;

let allData = [];
let filteredData = [];
let currentPage = 1;
let leafletMap = null;
let mapMarkers = [];

let chartsInstance = {
    waterLevel: null,
    rainfall: null,
    basin: null,
    status: null,
    threshold: null
};

// ========================== INIT ========================== 
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchAndRenderData();
    setInterval(fetchAndRenderData, REFRESH_INTERVAL);
});

// ========================== EVENT LISTENERS ========================== 
function setupEventListeners() {
    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName, e.currentTarget);
        });
    });

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', (e) => {
        e.preventDefault();
        fetchAndRenderData(true);
    });

    // Search and Filter controls
    document.getElementById('searchInput').addEventListener('input', applyTableFilters);
    document.getElementById('basinFilter').addEventListener('change', applyTableFilters);
    document.getElementById('statusFilter').addEventListener('change', applyTableFilters);

    // Alert Checkbox filters
    document.getElementById('filterAlert').addEventListener('change', renderAlerts);
    document.getElementById('filterMinor').addEventListener('change', renderAlerts);
    document.getElementById('filterMajor').addEventListener('change', renderAlerts);

    // Export CSV
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCsv);
    }

    // Modal close
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('stationModal');
        if (e.target === modal) closeModal();
    });
}

// ========================== TAB SWITCHING ========================== 
function switchTab(tabName, clickedBtn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabName);
    if (targetTab) targetTab.classList.add('active');
    if (clickedBtn) clickedBtn.classList.add('active');

    // Trigger Chart or Leaflet Map Resizing
    setTimeout(() => {
        if (tabName === 'overview' || tabName === 'water-level' || tabName === 'rainfall' || tabName === 'basins') {
            Object.values(chartsInstance).forEach(chart => {
                if (chart) chart.resize();
            });
        }
        if (tabName === 'map' && leafletMap) {
            leafletMap.invalidateSize();
        }
    }, 150);
}

// ========================== DATA FETCHING & RELIABILITY ==========================
async function fetchAndRenderData(isManualRefresh = false) {
    const spinner = document.getElementById('loadingSpinner');
    if (isManualRefresh || allData.length === 0) {
        spinner.style.display = 'flex';
    }

    try {
        const response = await fetch(`${DATA_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        allData = data.records || [];

        // Save to cache
        try {
            localStorage.setItem('sa_water_monitoring_cache', JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) {
            console.warn('localStorage caching failed:', e);
        }

        updateHeaderStatus(data, false);
        renderAllViews();
        if (spinner) spinner.style.display = 'none';

    } catch (error) {
        console.error('Error fetching live data:', error);

        // Try fallback to local cache
        const cached = localStorage.getItem('sa_water_monitoring_cache');
        if (cached) {
            try {
                const cachePayload = JSON.parse(cached);
                allData = cachePayload.data.records || [];
                updateHeaderStatus(cachePayload.data, true);
                renderAllViews();
                showDataStatusBanner('Viewing cached dataset from last successful fetch. Network update offline.');
            } catch (e) {
                showError('Failed to fetch South African water data.');
            }
        } else {
            showError('Failed to fetch South African water data.');
        }
        if (spinner) spinner.style.display = 'none';
    }
}

function updateHeaderStatus(data, isCached = false) {
    const lastUpdatedElem = document.getElementById('lastUpdated');
    const measurementDateElem = document.getElementById('measurementDate');
    const dataSourceLabel = document.getElementById('dataSourceLabel');

    if (dataSourceLabel) {
        dataSourceLabel.textContent = data.source || 'DWS South Africa';
    }

    if (lastUpdatedElem) {
        const fetchTime = new Date(data.last_updated_utc || Date.now());
        lastUpdatedElem.textContent = fetchTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC'
        }) + ' UTC';
    }

    if (measurementDateElem && allData.length > 0) {
        measurementDateElem.textContent = allData[0].date || 'Latest DWS Reading';
    }

    const banner = document.getElementById('dataStatusBanner');
    if (banner) {
        if (isCached) {
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }
}

function showDataStatusBanner(message) {
    const banner = document.getElementById('dataStatusBanner');
    const bannerText = document.getElementById('dataStatusText');
    if (banner && bannerText) {
        bannerText.textContent = message;
        banner.style.display = 'flex';
    }
}

// ========================== RENDER ALL VIEWS ========================== 
function renderAllViews() {
    renderMetrics();
    renderEnhancedStats();
    renderRiskAssessment();
    renderCharts();
    renderThresholdComparison();
    renderBasinAndStatusCharts();
    renderTopAlerts();
    renderLeafletMap();
    renderAlerts();
    populateBasinFilter();
    applyTableFilters();
}

// ========================== STATUS CLASSIFICATION ==========================
function getStationStatus(station) {
    if (station.status) return station.status;
    const level = parseFloat(station.water_level) || 0;
    if (level >= 110.0) return 'major';
    if (level >= 100.0) return 'minor';
    if (level >= 80.0) return 'alert';
    return 'normal';
}

// ========================== METRICS ========================== 
function renderMetrics() {
    document.getElementById('totalStations').textContent = allData.length;

    let normalCount = 0, alertCount = 0, minorCount = 0, majorCount = 0;

    allData.forEach(station => {
        const status = getStationStatus(station);
        switch (status) {
            case 'normal': normalCount++; break;
            case 'alert': alertCount++; break;
            case 'minor': minorCount++; break;
            case 'major': majorCount++; break;
        }
    });

    document.getElementById('normalCount').textContent = normalCount;
    document.getElementById('alertCountMetric').textContent = alertCount;
    document.getElementById('minorCount').textContent = minorCount;
    document.getElementById('majorCount').textContent = majorCount;

    const totalAlerts = alertCount + minorCount + majorCount;
    document.getElementById('alertCount').textContent = totalAlerts;

    const total = allData.length || 1;
    document.getElementById('normalBar').style.width = `${((normalCount / total) * 100).toFixed(1)}%`;
    document.getElementById('alertBar').style.width = `${((alertCount / total) * 100).toFixed(1)}%`;
    document.getElementById('minorBar').style.width = `${((minorCount / total) * 100).toFixed(1)}%`;
    document.getElementById('majorBar').style.width = `${((majorCount / total) * 100).toFixed(1)}%`;
}

// ========================== ENHANCED STATS ========================== 
function renderEnhancedStats() {
    if (allData.length === 0) return;

    const validWaterLevels = allData.map(s => parseFloat(s.water_level)).filter(v => !isNaN(v));
    const validRainfalls = allData.map(s => parseFloat(s.rain_fall)).filter(v => !isNaN(v));

    const maxWater = validWaterLevels.length > 0 ? Math.max(...validWaterLevels) : 0;
    const maxRain = validRainfalls.length > 0 ? Math.max(...validRainfalls) : 0;
    const avgWater = validWaterLevels.length > 0 ? (validWaterLevels.reduce((a, b) => a + b, 0) / validWaterLevels.length) : 0;
    const totalRain = validRainfalls.reduce((a, b) => a + b, 0);

    const maxWaterStation = allData.find(s => parseFloat(s.water_level) === maxWater);
    const maxRainfallStation = allData.find(s => parseFloat(s.rain_fall) === maxRain);

    document.getElementById('maxWaterLevel').textContent = maxWater.toFixed(1) + ' %';
    document.getElementById('maxWaterStation').textContent = maxWaterStation ? `${maxWaterStation.gauge} (${maxWaterStation.basin})` : '--';

    document.getElementById('maxRainfall').textContent = maxRain.toFixed(1) + ' mm';
    document.getElementById('maxRainfallStation').textContent = maxRainfallStation ? `${maxRainfallStation.gauge} (${maxRainfallStation.basin})` : '--';

    document.getElementById('avgWaterLevel').textContent = avgWater.toFixed(1) + ' %';
    document.getElementById('totalRainfall').textContent = totalRain.toFixed(1) + ' mm';

    // Calculate percentages
    let alertCount = 0, minorCount = 0, majorCount = 0;
    let safetyMarginSum = 0;

    allData.forEach(station => {
        const status = getStationStatus(station);
        if (status === 'alert') alertCount++;
        if (status === 'minor') minorCount++;
        if (status === 'major') majorCount++;

        const alertThreshold = parseFloat(station.alertpull) || 80.0;
        const currentLevel = parseFloat(station.water_level) || 0;
        safetyMarginSum += Math.max(0, alertThreshold - currentLevel);
    });

    const alertPct = ((alertCount / allData.length) * 100).toFixed(1);
    const minorPct = ((minorCount / allData.length) * 100).toFixed(1);
    const majorPct = ((majorCount / allData.length) * 100).toFixed(1);
    const avgSafetyMargin = (safetyMarginSum / allData.length).toFixed(1);

    document.getElementById('alertPercentage').textContent = alertPct + '%';
    document.getElementById('alertProgressBar').style.width = alertPct + '%';

    document.getElementById('minorPercentage').textContent = minorPct + '%';
    document.getElementById('minorProgressBar').style.width = minorPct + '%';

    document.getElementById('majorPercentage').textContent = majorPct + '%';
    document.getElementById('majorProgressBar').style.width = majorPct + '%';

    document.getElementById('safetyMargin').textContent = avgSafetyMargin + ' %';
    document.getElementById('safetyProgressBar').style.width = Math.min(100, Math.max(0, avgSafetyMargin)) + '%';
}

// ========================== RISK ASSESSMENT ========================== 
function renderRiskAssessment() {
    if (allData.length === 0) return;

    let critical = 0, highRisk = 0, mediumRisk = 0, lowRisk = 0;

    allData.forEach(station => {
        const status = getStationStatus(station);
        if (status === 'major') critical++;
        else if (status === 'minor') highRisk++;
        else if (status === 'alert') mediumRisk++;
        else lowRisk++;
    });

    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('highRiskCount').textContent = highRisk;
    document.getElementById('mediumRiskCount').textContent = mediumRisk;
    document.getElementById('lowRiskCount').textContent = lowRisk;
}

// ========================== THRESHOLD COMPARISON CHART ==========================
function renderThresholdComparison() {
    if (allData.length === 0) return;

    const topStations = [...allData]
        .sort((a, b) => (parseFloat(b.water_level) || 0) - (parseFloat(a.water_level) || 0))
        .slice(0, 8);

    const labels = topStations.map(s => s.gauge);
    const waterLevels = topStations.map(s => parseFloat(s.water_level) || 0);
    const alertThresholds = topStations.map(s => parseFloat(s.alertpull) || 80);
    const minorThresholds = topStations.map(s => parseFloat(s.warningpull) || 100);
    const majorThresholds = topStations.map(s => parseFloat(s.dangerpull) || 110);

    if (chartsInstance.threshold) chartsInstance.threshold.destroy();

    const canvas = document.getElementById('thresholdChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    chartsInstance.threshold = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Water Level (% FSC)',
                    data: waterLevels,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                },
                {
                    label: 'Alert Threshold (80%)',
                    data: alertThresholds,
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                },
                {
                    label: 'Minor Flood Threshold (100%)',
                    data: minorThresholds,
                    backgroundColor: '#f97316',
                    borderRadius: 4
                },
                {
                    label: 'Major Flood Threshold (110%)',
                    data: majorThresholds,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 12 }, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + ' %';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Water Level Percentage (% FSC)' }
                }
            }
        }
    });
}

// ========================== CHARTS ========================== 
function renderCharts() {
    const topByWater = [...allData]
        .sort((a, b) => (parseFloat(b.water_level) || 0) - (parseFloat(a.water_level) || 0))
        .slice(0, 15);

    const topByRain = [...allData]
        .sort((a, b) => (parseFloat(b.rain_fall) || 0) - (parseFloat(a.rain_fall) || 0))
        .slice(0, 15);

    renderWaterLevelChart(topByWater);
    renderRainfallChart(topByRain);
}

function renderWaterLevelChart(data) {
    const canvas = document.getElementById('waterLevelChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (chartsInstance.waterLevel) chartsInstance.waterLevel.destroy();

    chartsInstance.waterLevel = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.gauge),
            datasets: [{
                label: 'Water Level (% FSC)',
                data: data.map(d => parseFloat(d.water_level) || 0),
                backgroundColor: data.map(d => {
                    const status = getStationStatus(d);
                    switch (status) {
                        case 'normal': return '#10b981';
                        case 'alert': return '#f59e0b';
                        case 'minor': return '#f97316';
                        case 'major': return '#ef4444';
                        default: return '#10b981';
                    }
                }),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const station = data[context.dataIndex];
                            return `${station.gauge} (${station.basin}): ${context.parsed.y.toFixed(1)}% FSC`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Water Level (% FSC)' }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

function renderRainfallChart(data) {
    const canvas = document.getElementById('rainfallChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (chartsInstance.rainfall) chartsInstance.rainfall.destroy();

    chartsInstance.rainfall = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.gauge),
            datasets: [{
                label: '24h Rainfall (mm)',
                data: data.map(d => parseFloat(d.rain_fall) || 0),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#06b6d4',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const station = data[context.dataIndex];
                            return `${station.gauge} (${station.basin}): ${context.parsed.y.toFixed(1)} mm`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '24h Rainfall (mm)' }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

// ========================== BASIN & STATUS CHARTS ==========================
function renderBasinAndStatusCharts() {
    renderBasinChart();
    renderStatusChart();
}

function renderBasinChart() {
    const canvas = document.getElementById('basinChart');
    if (!canvas) return;

    const basinCounts = {};
    allData.forEach(station => {
        const b = station.basin || 'Other';
        basinCounts[b] = (basinCounts[b] || 0) + 1;
    });

    const basins = Object.keys(basinCounts).sort();
    const counts = basins.map(b => basinCounts[b]);

    const ctx = canvas.getContext('2d');
    if (chartsInstance.basin) chartsInstance.basin.destroy();

    const colors = [
        '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'
    ];

    chartsInstance.basin = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: basins,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, basins.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12 } }
            }
        }
    });
}

function renderStatusChart() {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;

    let normalCount = 0, alertCount = 0, minorCount = 0, majorCount = 0;

    allData.forEach(station => {
        const status = getStationStatus(station);
        switch (status) {
            case 'normal': normalCount++; break;
            case 'alert': alertCount++; break;
            case 'minor': minorCount++; break;
            case 'major': majorCount++; break;
        }
    });

    const ctx = canvas.getContext('2d');
    if (chartsInstance.status) chartsInstance.status.destroy();

    chartsInstance.status = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Normal (<80%)', 'Alert (80-99%)', 'Minor Flood (100-109%)', 'Major Flood (>=110%)'],
            datasets: [{
                data: [normalCount, alertCount, minorCount, majorCount],
                backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12 } }
            }
        }
    });
}

// ========================== TOP ALERTS ==========================
function renderTopAlerts() {
    const alertStations = allData
        .filter(s => getStationStatus(s) !== 'normal')
        .sort((a, b) => {
            const statusOrder = { major: 3, minor: 2, alert: 1, normal: 0 };
            const diff = statusOrder[getStationStatus(b)] - statusOrder[getStationStatus(a)];
            if (diff !== 0) return diff;
            return (parseFloat(b.water_level) || 0) - (parseFloat(a.water_level) || 0);
        })
        .slice(0, 6);

    const container = document.getElementById('topAlerts');
    if (!container) return;

    if (alertStations.length === 0) {
        container.innerHTML = '<p class="loading"><i class="fas fa-check-circle" style="color: #10b981; font-size: 24px;"></i><br>All South African monitoring gauges currently within normal operating limits.</p>';
        return;
    }

    container.innerHTML = alertStations.map(station => {
        const status = getStationStatus(station);
        const level = parseFloat(station.water_level) || 0;
        const threshold = status === 'major' ? 110 : (status === 'minor' ? 100 : 80);
        const exceedance = (level - threshold).toFixed(1);

        return `
            <div class="alert-item ${status}" onclick="showStationModal('${station.gauge}')" style="cursor: pointer;">
                <div class="alert-item-header">
                    <span class="alert-item-name">${station.gauge}</span>
                    <span class="alert-badge ${status}">${status.toUpperCase()}</span>
                </div>
                <div class="alert-item-info"><i class="fas fa-location-dot"></i> ${station.basin} | River: ${station.river}</div>
                <div class="alert-item-stats">
                    <div class="stat-box">
                        <span class="stat-box-label">Water Level</span>
                        <span class="stat-box-value">${level.toFixed(1)} % FSC</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-box-label">Exceeds Threshold By</span>
                        <span class="stat-box-value">+${exceedance} %</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-box-label">24h Rainfall</span>
                        <span class="stat-box-value">${(parseFloat(station.rain_fall) || 0).toFixed(1)} mm</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================== LEAFLET MAP ==========================
function renderLeafletMap() {
    const mapElem = document.getElementById('mapContainer');
    if (!mapElem) return;

    if (!leafletMap) {
        // Initialize Leaflet map centered on South Africa
        leafletMap = L.map('mapContainer').setView([-28.8, 24.8], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | DWS South Africa',
            maxZoom: 18
        }).addTo(leafletMap);
    }

    // Clear old markers
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];

    const statusColors = {
        normal: '#10b981',
        alert: '#f59e0b',
        minor: '#f97316',
        major: '#ef4444'
    };

    allData.forEach(station => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const status = getStationStatus(station);
        const color = statusColors[status] || '#10b981';

        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        }).addTo(leafletMap);

        const level = (parseFloat(station.water_level) || 0).toFixed(1);
        const fsc = (parseFloat(station.fsc_mcm) || 0).toFixed(1);
        const rain = (parseFloat(station.rain_fall) || 0).toFixed(1);

        const popupContent = `
            <div style="min-width: 200px;">
                <div class="map-popup-title">${station.gauge}</div>
                <div class="map-popup-sub"><i class="fas fa-map-marker-alt"></i> ${station.basin} | ${station.river}</div>
                <div class="map-popup-stat"><span>Status:</span> <strong style="color: ${color}; text-transform: uppercase;">${status}</strong></div>
                <div class="map-popup-stat"><span>Water Level:</span> <strong>${level} % FSC</strong></div>
                <div class="map-popup-stat"><span>Full Capacity:</span> <strong>${fsc} MCM</strong></div>
                <div class="map-popup-stat"><span>24h Rainfall:</span> <strong>${rain} mm</strong></div>
                <div class="map-popup-stat"><span>Station ID:</span> <strong>${station.station_id || '--'}</strong></div>
                <button onclick="showStationModal('${station.gauge}')" style="margin-top: 10px; width: 100%; padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">View Station Details</button>
            </div>
        `;

        marker.bindPopup(popupContent);
        mapMarkers.push(marker);
    });
}

// ========================== ALERTS FULL TAB ==========================
function renderAlerts() {
    const showAlert = document.getElementById('filterAlert').checked;
    const showMinor = document.getElementById('filterMinor').checked;
    const showMajor = document.getElementById('filterMajor').checked;

    const alertStations = allData.filter(station => {
        const status = getStationStatus(station);
        if (status === 'normal') return false;
        if (status === 'alert' && !showAlert) return false;
        if (status === 'minor' && !showMinor) return false;
        if (status === 'major' && !showMajor) return false;
        return true;
    }).sort((a, b) => {
        const statusOrder = { major: 3, minor: 2, alert: 1, normal: 0 };
        const diff = statusOrder[getStationStatus(b)] - statusOrder[getStationStatus(a)];
        if (diff !== 0) return diff;
        return (parseFloat(b.water_level) || 0) - (parseFloat(a.water_level) || 0);
    });

    const container = document.getElementById('alertsList');
    if (!container) return;

    if (alertStations.length === 0) {
        container.innerHTML = '<p class="loading"><i class="fas fa-check-circle" style="color: #10b981; font-size: 32px;"></i><br>No matching active flood alerts found for selected severity filters.</p>';
        return;
    }

    container.innerHTML = alertStations.map(station => {
        const status = getStationStatus(station);
        const level = (parseFloat(station.water_level) || 0).toFixed(1);
        const threshold = status === 'major' ? 110 : (status === 'minor' ? 100 : 80);
        const exceedance = (level - threshold).toFixed(1);

        return `
            <div class="alert-item ${status}" onclick="showStationModal('${station.gauge}')" style="cursor: pointer;">
                <div class="alert-item-header">
                    <span class="alert-item-name">${station.gauge} (${station.station_id || 'DWS'})</span>
                    <span class="alert-badge ${status}">${status.toUpperCase()}</span>
                </div>
                <div class="alert-item-info">
                    <strong>Basin / Province:</strong> ${station.basin} | <strong>River:</strong> ${station.river}
                </div>
                <div class="alert-item-stats">
                    <div class="stat-box">
                        <span class="stat-box-label">Water Level</span>
                        <span class="stat-box-value">${level} % FSC</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-box-label">Capacity (MCM)</span>
                        <span class="stat-box-value">${(parseFloat(station.fsc_mcm) || 0).toFixed(1)}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-box-label">Margin above ${threshold}%</span>
                        <span class="stat-box-value">+${exceedance} %</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-box-label">24h Rainfall</span>
                        <span class="stat-box-value">${(parseFloat(station.rain_fall) || 0).toFixed(1)} mm</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================== STATIONS DATA TABLE ==========================
function populateBasinFilter() {
    const select = document.getElementById('basinFilter');
    if (!select) return;

    const basins = [...new Set(allData.map(s => s.basin))].filter(Boolean).sort();
    select.innerHTML = '<option value="">All Basins / Provinces</option>';
    basins.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        select.appendChild(opt);
    });
}

function applyTableFilters() {
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().strip ? document.getElementById('searchInput').value.toLowerCase().trim() : '';
    const basinVal = document.getElementById('basinFilter')?.value || '';
    const statusVal = document.getElementById('statusFilter')?.value || '';

    filteredData = allData.filter(station => {
        const status = getStationStatus(station);
        const nameMatch = (station.gauge || '').toLowerCase().includes(searchVal) ||
                          (station.river || '').toLowerCase().includes(searchVal) ||
                          (station.station_id || '').toLowerCase().includes(searchVal) ||
                          (station.basin || '').toLowerCase().includes(searchVal);

        const basinMatch = !basinVal || station.basin === basinVal;
        const statusMatch = !statusVal || status === statusVal;

        return nameMatch && basinMatch && statusMatch;
    });

    currentPage = 1;
    renderStationsTable();
}

function renderStationsTable() {
    const container = document.getElementById('stationsTable');
    if (!container) return;

    if (filteredData.length === 0) {
        container.innerHTML = '<p class="loading">No monitoring stations match your search and filter criteria.</p>';
        renderPagination(0);
        return;
    }

    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredData.slice(startIndex, startIndex + PAGE_SIZE);

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Station Name</th>
                    <th>Station ID</th>
                    <th>Basin / Province</th>
                    <th>River / Watercourse</th>
                    <th>Water Level (% FSC)</th>
                    <th>Full Capacity (MCM)</th>
                    <th>24h Rainfall (mm)</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${pageItems.map(station => {
                    const status = getStationStatus(station);
                    const level = (parseFloat(station.water_level) || 0).toFixed(1);
                    const fsc = (parseFloat(station.fsc_mcm) || 0).toFixed(1);
                    const rain = (parseFloat(station.rain_fall) || 0).toFixed(1);

                    return `
                        <tr>
                            <td><strong>${station.gauge}</strong></td>
                            <td><code>${station.station_id || '--'}</code></td>
                            <td>${station.basin}</td>
                            <td>${station.river}</td>
                            <td><strong>${level}%</strong></td>
                            <td>${fsc}</td>
                            <td>${rain} mm</td>
                            <td><span class="status-badge ${status}">${status}</span></td>
                            <td>
                                <button onclick="showStationModal('${station.gauge}')" style="padding: 4px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Details</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = `<span style="font-size: 13px; color: #6b7280;">Showing all ${filteredData.length} stations</span>`;
        return;
    }

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(filteredData.length, currentPage * PAGE_SIZE);

    let buttonsHtml = '';
    buttonsHtml += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i> Prev</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            buttonsHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            buttonsHtml += `<span style="padding: 0 4px; color: #9ca3af;">...</span>`;
        }
    }

    buttonsHtml += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = `
        <span style="font-size: 13px; color: #6b7280;">Showing ${start}-${end} of ${filteredData.length} stations</span>
        <div class="pagination-buttons">${buttonsHtml}</div>
    `;
}

function changePage(page) {
    currentPage = page;
    renderStationsTable();
}

// ========================== CSV EXPORT ==========================
function exportToCsv() {
    if (filteredData.length === 0) {
        alert('No station data available to export.');
        return;
    }

    const headers = ['Station Name', 'Station ID', 'Basin/Province', 'River', 'Water Level (% FSC)', 'Full Capacity (MCM)', '24h Rainfall (mm)', 'Latitude', 'Longitude', 'Status', 'Last Date', 'Data Source'];

    const rows = filteredData.map(s => [
        `"${(s.gauge || '').replace(/"/g, '""')}"`,
        `"${(s.station_id || '').replace(/"/g, '""')}"`,
        `"${(s.basin || '').replace(/"/g, '""')}"`,
        `"${(s.river || '').replace(/"/g, '""')}"`,
        (parseFloat(s.water_level) || 0).toFixed(1),
        (parseFloat(s.fsc_mcm) || 0).toFixed(1),
        (parseFloat(s.rain_fall) || 0).toFixed(1),
        s.latitude || '',
        s.longitude || '',
        `"${getStationStatus(s)}"`,
        `"${s.date || ''}"`,
        `"${(s.source || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'south_africa_water_monitoring.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================== MODAL ========================== 
function showStationModal(gaugeName) {
    const station = allData.find(s => s.gauge === gaugeName);
    if (!station) return;

    const status = getStationStatus(station);
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h2><i class="fas fa-water"></i> ${station.gauge}</h2>
        <div class="modal-item">
            <span class="modal-label">Station Identifier</span>
            <span class="modal-value"><code>${station.station_id || 'DWS'}</code></span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Basin / Province</span>
            <span class="modal-value">${station.basin}</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">River / Watercourse</span>
            <span class="modal-value">${station.river}</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Status</span>
            <span class="modal-value">
                <span class="status-badge ${status}">${status.toUpperCase()}</span>
            </span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Current Water Level</span>
            <span class="modal-value"><strong>${(parseFloat(station.water_level) || 0).toFixed(1)} % FSC</strong></span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Full Storage Capacity (FSC)</span>
            <span class="modal-value">${(parseFloat(station.fsc_mcm) || 0).toFixed(1)} Million m&sup3;</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Previous Week Reading</span>
            <span class="modal-value">${(parseFloat(station.last_week_lvl) || 0).toFixed(1)} %</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Previous Year Reading</span>
            <span class="modal-value">${(parseFloat(station.last_year_lvl) || 0).toFixed(1)} %</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">24-Hour Rainfall</span>
            <span class="modal-value">${(parseFloat(station.rain_fall) || 0).toFixed(1)} mm</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Geographic Coordinates</span>
            <span class="modal-value">${station.latitude ? `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}` : 'N/A'}</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Alert Threshold</span>
            <span class="modal-value">${station.alertpull || 80} %</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Minor Flood Threshold</span>
            <span class="modal-value">${station.warningpull || 100} %</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Major Flood Threshold</span>
            <span class="modal-value">${station.dangerpull || 110} %</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Measurement Date</span>
            <span class="modal-value">${station.date || 'Latest DWS Reading'}</span>
        </div>
        <div class="modal-item">
            <span class="modal-label">Data Source</span>
            <span class="modal-value">${station.source || 'Department of Water and Sanitation (DWS) South Africa'}</span>
        </div>
    `;

    const modal = document.getElementById('stationModal');
    if (modal) modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('stationModal');
    if (modal) modal.classList.remove('show');
}

// ========================== UTILITIES ========================== 
function showError(message) {
    const spinner = document.getElementById('loadingSpinner');
    if (!spinner) return;

    const spinnerContent = spinner.querySelector('.spinner-content');
    if (!spinnerContent) return;

    spinnerContent.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger-color); margin-bottom: 15px;"></i>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            margin-top: 15px;
            padding: 10px 20px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        ">Retry Connection</button>
    `;
    spinner.style.display = 'flex';
}
