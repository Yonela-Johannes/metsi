#!/usr/bin/env python3
"""
South African Water Monitoring Data Ingestion Script

Fetches live hydrological data directly from the Department of Water and Sanitation (DWS)
South Africa and DWS ArcGIS GIS Feature Services, enriched with rainfall data.

- Scrapes official weekly dam levels from DWS Hydrology (https://www.dws.gov.za/Hydrology/).
- Matches station coordinates & catchments from DWS ArcGIS Feature Server.
- Fetches real-time rainfall totals (mm) for station locations via Open-Meteo.
- Normalises readings into standard schema for the Water Monitoring Dashboard.
- Writes both data/gauges_2_view.json and data/gauges_2_view.csv.
"""

from __future__ import annotations

import csv
import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup
import urllib3

urllib3.disable_warnings()

# ==== CONFIG =================================================================

DWS_ARCGIS_MAJORDAMS_URL = (
    "https://services3.arcgis.com/QdLJLZBqzVAhCil8/arcgis/rest/services/"
    "DWS_Major_Dams_500k/FeatureServer/0/query"
)

PROVINCES = {
    "EC": ("Eastern Cape", -32.2968, 26.4194),
    "FS": ("Free State", -28.4541, 26.7968),
    "G": ("Gauteng", -26.2708, 28.1123),
    "KN": ("KwaZulu-Natal", -28.5306, 30.8958),
    "LP": ("Limpopo", -23.4013, 29.4179),
    "M": ("Mpumalanga", -25.5653, 30.5279),
    "NC": ("Northern Cape", -29.0467, 21.8569),
    "NW": ("North West", -25.856, 25.6421),
    "WC": ("Western Cape", -33.2278, 21.8569),
}

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Timeouts & Headers
TIMEOUT = 15
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}

# Output paths
REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
JSON_OUTPUT_PATH = DATA_DIR / "gauges_2_view.json"
CSV_OUTPUT_PATH = DATA_DIR / "gauges_2_view.csv"


# ==== HELPERS ================================================================

def fetch_arcgis_dam_coordinates() -> Dict[str, Dict[str, Any]]:
    """Query DWS Major Dams layer from ArcGIS for precise coordinates and metadata."""
    coord_map: Dict[str, Dict[str, Any]] = {}
    params = {
        "where": "1=1",
        "outFields": "STATION,NAME,X_COORD,Y_COORD,PRIMARY_,SECONDARY,ALIAS",
        "returnGeometry": "false",
        "f": "json",
    }
    try:
        r = requests.get(DWS_ARCGIS_MAJORDAMS_URL, params=params, headers=DEFAULT_HEADERS, verify=False, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
        for f in data.get("features", []):
            attrs = f.get("attributes", {})
            name = (attrs.get("NAME") or "").strip().lower()
            alias = (attrs.get("ALIAS") or "").strip().lower()
            station = (attrs.get("STATION") or "").strip()
            x = attrs.get("X_COORD")
            y = attrs.get("Y_COORD")
            if x and y and x != 0 and y != 0:
                info = {
                    "lat": float(y),
                    "lng": float(x),
                    "station_code": station,
                    "primary_catchment": attrs.get("PRIMARY_"),
                    "secondary_catchment": attrs.get("SECONDARY"),
                }
                if name and name != " ":
                    coord_map[name] = info
                    coord_map[name.replace(" dam", "")] = info
                    coord_map[re.sub(r"[^\w\s]", "", name)] = info
                if alias and alias != " ":
                    coord_map[alias] = info
                    coord_map[alias.replace(" dam", "")] = info
    except Exception as e:
        print(f"[warn] Failed to fetch ArcGIS dam coordinates: {e}")
    print(f"[info] Indexed {len(coord_map)} DWS station coordinates from ArcGIS")
    return coord_map


def fetch_dws_weekly_dams(coord_map: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Scrape DWS official Weekly State of Dams tables across all South African provinces."""
    stations: List[Dict[str, Any]] = []

    for code, (prov_name, default_lat, default_lng) in PROVINCES.items():
        url = f"https://www.dws.gov.za/Hydrology/Weekly/ProvinceWeek.aspx?region={code}"
        try:
            r = requests.get(url, headers=DEFAULT_HEADERS, verify=False, timeout=TIMEOUT)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "html.parser")

            date_str = None
            h_text = soup.get_text()
            for line in h_text.split("\n"):
                if "State of Dams on" in line:
                    date_str = line.split("State of Dams on")[-1].strip()
                    break

            tables = soup.find_all("table")
            for t in tables:
                for row in t.find_all("tr"):
                    cols = [c.text.strip() for c in row.find_all("td")]
                    if len(cols) >= 6:
                        cell_0 = cols[0]
                        if cell_0 in ["Dam", "", "Total"] or "State of Dams" in cell_0 or "Provincial" in cell_0 or cell_0.startswith("FSC") or cell_0.startswith("#"):
                            continue

                        dam_name = cell_0.replace("#", "").strip()
                        river_name = cols[1].strip() if len(cols) > 1 else ""
                        fsc_str = cols[4].replace("#", "").strip() if len(cols) > 4 else "0"
                        this_week_str = cols[5].replace("#", "").strip() if len(cols) > 5 else "0"
                        last_week_str = cols[6].replace("#", "").strip() if len(cols) > 6 else "0"
                        last_year_str = cols[7].replace("#", "").strip() if len(cols) > 7 else "0"

                        try:
                            water_lvl_pct = float(this_week_str)
                        except ValueError:
                            continue

                        try:
                            fsc_val = float(fsc_str)
                        except ValueError:
                            fsc_val = 0.0

                        try:
                            last_week_lvl = float(last_week_str)
                        except ValueError:
                            last_week_lvl = water_lvl_pct

                        try:
                            last_year_lvl = float(last_year_str)
                        except ValueError:
                            last_year_lvl = water_lvl_pct

                        # Match coordinates
                        clean_name = dam_name.lower().replace(" dam", "").strip()
                        clean_regex_name = re.sub(r"[^\w\s]", "", clean_name)
                        coords = coord_map.get(clean_name) or coord_map.get(dam_name.lower()) or coord_map.get(clean_regex_name)

                        lat = coords["lat"] if coords else default_lat
                        lng = coords["lng"] if coords else default_lng
                        stn_id = coords["station_code"] if coords and coords.get("station_code") else f"{code}-{len(stations)+1:03d}"

                        # Calculate threshold statuses
                        # Normal: <80%, Alert: 80-99.9%, Minor Flood: 100-109.9%, Major Flood: >=110%
                        status = "normal"
                        if water_lvl_pct >= 110.0:
                            status = "major"
                        elif water_lvl_pct >= 100.0:
                            status = "minor"
                        elif water_lvl_pct >= 80.0:
                            status = "alert"

                        stations.append({
                            "gauge": dam_name,
                            "station_id": stn_id,
                            "river": river_name or "N/A",
                            "basin": prov_name,
                            "province": prov_name,
                            "water_level": water_lvl_pct,
                            "fsc_mcm": fsc_val,
                            "last_week_lvl": last_week_lvl,
                            "last_year_lvl": last_year_lvl,
                            "alertpull": 80.0,
                            "warningpull": 100.0,
                            "dangerpull": 110.0,
                            "latitude": lat,
                            "longitude": lng,
                            "date": date_str or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                            "status": status,
                            "source": "Department of Water and Sanitation (DWS) South Africa",
                            "rain_fall": 0.0,
                        })

        except Exception as e:
            print(f"[warn] Failed to fetch DWS dams for province {code}: {e}")

    print(f"[info] Scraped {len(stations)} DWS monitoring stations across South Africa")
    return stations


def enrich_stations_with_rainfall(stations: List[Dict[str, Any]]) -> None:
    """Fetch 24h rainfall (mm) for station locations using Open-Meteo API with rate limit handling."""
    if not stations:
        return

    print("[info] Fetching live rainfall data from Open-Meteo API...")
    # Group unique locations to minimize requests
    unique_coords: Dict[tuple, float] = {}
    for s in stations:
        key = (round(s["latitude"], 2), round(s["longitude"], 2))
        unique_coords[key] = 0.0

    coord_list = list(unique_coords.keys())
    batch_size = 20
    for i in range(0, len(coord_list), batch_size):
        batch = coord_list[i : i + batch_size]
        lats = [c[0] for c in batch]
        lngs = [c[1] for c in batch]

        try:
            params = {
                "latitude": lats,
                "longitude": lngs,
                "daily": "precipitation_sum",
                "forecast_days": 1,
                "timezone": "Africa/Johannesburg",
            }
            resp = requests.get(OPEN_METEO_URL, params=params, timeout=TIMEOUT)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    for idx, loc in enumerate(data):
                        rain_list = loc.get("daily", {}).get("precipitation_sum", [])
                        rain_val = float(rain_list[0]) if rain_list and rain_list[0] is not None else 0.0
                        unique_coords[batch[idx]] = round(rain_val, 1)
                elif isinstance(data, dict):
                    rain_list = data.get("daily", {}).get("precipitation_sum", [])
                    rain_val = float(rain_list[0]) if rain_list and rain_list[0] is not None else 0.0
                    unique_coords[batch[0]] = round(rain_val, 1)
            time.sleep(0.2)
        except Exception as e:
            print(f"[warn] Rainfall batch request failed: {e}")

    # Map back to stations
    for s in stations:
        key = (round(s["latitude"], 2), round(s["longitude"], 2))
        s["rain_fall"] = unique_coords.get(key, 0.0)


def write_outputs(stations: List[Dict[str, Any]]) -> None:
    """Write normalized data payload to JSON and CSV files."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    utc_now = datetime.now(timezone.utc).isoformat()

    payload = {
        "last_updated_utc": utc_now,
        "source": "Department of Water and Sanitation (DWS) South Africa",
        "source_url": "https://www.dws.gov.za/Hydrology/",
        "record_count": len(stations),
        "records": stations,
    }

    # Write JSON
    tmp_json = JSON_OUTPUT_PATH.with_suffix(".json.tmp")
    with tmp_json.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    tmp_json.replace(JSON_OUTPUT_PATH)
    print(f"[info] Saved {JSON_OUTPUT_PATH} ({len(stations)} records)")

    # Write CSV
    if stations:
        fieldnames = sorted({k for s in stations for k in s.keys()})
        tmp_csv = CSV_OUTPUT_PATH.with_suffix(".csv.tmp")
        with tmp_csv.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(stations)
        tmp_csv.replace(CSV_OUTPUT_PATH)
        print(f"[info] Saved {CSV_OUTPUT_PATH} ({len(stations)} records)")


def main() -> None:
    print("[info] Starting South African Water Monitoring Data Ingestion...")
    coord_map = fetch_arcgis_dam_coordinates()
    stations = fetch_dws_weekly_dams(coord_map)

    if not stations:
        raise RuntimeError("No South African water monitoring stations retrieved.")

    enrich_stations_with_rainfall(stations)
    write_outputs(stations)
    print("[info] Data ingestion successfully completed.")


if __name__ == "__main__":
    main()
