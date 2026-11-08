#!/usr/bin/env python3
"""
South African Water Monitoring Data Ingestion Script

Fetches live hydrological data directly from the Department of Water and Sanitation (DWS)
South Africa and DWS ArcGIS GIS Feature Services, enriched with rainfall data.

- Scrapes official weekly dam levels from DWS Hydrology (https://www.dws.gov.za/Hydrology/).
- Matches station coordinates & catchments from DWS ArcGIS Feature Server.
- Fetches real-time rainfall totals (mm) for station locations via Open-Meteo.
- Normalises readings into standard schema for the Water Monitoring Dashboard.
- Updates README.md automated flood monitoring activity summary.
- Writes both public/data/gauges_2_view.json and public/data/gauges_2_view.csv.
"""

from __future__ import annotations

import csv
import json
import os
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from requests.adapters import HTTPAdapter
from bs4 import BeautifulSoup
import urllib3
from urllib3.util import Retry

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
DWS_PROXY_TEMPLATE = os.environ.get("DWS_PROXY_TEMPLATE", "https://api.codetabs.com/v1/proxy?quest={url}")

# Timeouts & Headers
TIMEOUT = 15
REQUEST_DELAY = 1.0
BLOCKED_STATUS_CODES = {401, 403, 451}
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,"
        "image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Ch-Ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}

# Output paths & markers
REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "public" / "data"
JSON_OUTPUT_PATH = DATA_DIR / "gauges_2_view.json"
CSV_OUTPUT_PATH = DATA_DIR / "gauges_2_view.csv"
README_PATH = REPO_ROOT / "README.md"
SUMMARY_START_MARKER = "<!-- FLOOD_DATA_SUMMARY:START -->"
SUMMARY_END_MARKER = "<!-- FLOOD_DATA_SUMMARY:END -->"


# ==== HELPERS ================================================================

def create_dws_session() -> requests.Session:
    """Create a requests.Session configured with browser headers, retries, and warm-up cookies."""
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)

    # 403 means "blocked", not "busy": retrying it just burns quota and delays the fallback.
    retry = Retry(
        total=3,
        backoff_factor=1.0,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=frozenset({"GET", "HEAD"}),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    # Warm up session to acquire session cookies (e.g. ASP.NET_SessionId)
    try:
        session.get("https://www.dws.gov.za/Hydrology/", verify=False, timeout=TIMEOUT)
    except Exception as e:
        print(f"[warn] Session warmup request to DWS homepage failed: {e}")

    return session


def fetch_arcgis_dam_coordinates() -> Dict[str, Dict[str, Any]]:
    """Query DWS Major Dams layer from ArcGIS for precise coordinates and metadata."""
    coord_map: Dict[str, Dict[str, Any]] = {}
    headers = {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        "Accept": "application/json, */*",
    }
    attributes: List[Dict[str, Any]] = []

    try:
        params: Dict[str, Any] = {
            "where": "1=1",
            "outFields": "STATION,NAME,X_COORD,Y_COORD,PRIMARY_,SECONDARY,ALIAS",
            "returnGeometry": "false",
            "orderByFields": "OBJECTID",
            "resultOffset": 0,
            "resultRecordCount": 1000,
            "f": "json",
        }
        while True:
            r = requests.get(
                DWS_ARCGIS_MAJORDAMS_URL, params=params, headers=headers, verify=False, timeout=TIMEOUT
            )
            r.raise_for_status()
            batch = r.json().get("features") or []
            attributes.extend(f.get("attributes", {}) for f in batch)
            if len(batch) < params["resultRecordCount"]:
                break
            params["resultOffset"] += len(batch)
    except Exception as e:
        print(f"[warn] Failed to fetch ArcGIS dam coordinates: {e}")

    for attrs in attributes:
        name = (attrs.get("NAME") or "").strip().lower()
        alias = (attrs.get("ALIAS") or "").strip().lower()
        station = (attrs.get("STATION") or "").strip()
        x = attrs.get("X_COORD")
        y = attrs.get("Y_COORD")
        coord_found = bool(x and y and x != 0 and y != 0)

        if coord_found:
            info = {
                "lat": float(y),
                "lng": float(x),
                "station_code": station,
                "primary_catchment": attrs.get("PRIMARY_"),
                "secondary_catchment": attrs.get("SECONDARY"),
            }
        else:
            info = {
                "lat": None,
                "lng": None,
                "station_code": station,
                "primary_catchment": attrs.get("PRIMARY_"),
                "secondary_catchment": attrs.get("SECONDARY"),
            }

        for key in (name, alias):
            if not key or key == " ":
                continue
            coord_map[key] = info
            coord_map[key.replace(" dam", "")] = info
            coord_map[re.sub(r"[^\w\s]", "", key)] = info

    with_coords = sum(1 for v in coord_map.values() if v.get("lat") is not None)
    print(
        f"[info] Indexed {len(coord_map)} DWS station name variants "
        f"({with_coords} with coordinates) from ArcGIS"
    )
    return coord_map


def _direct_urls(code: str) -> List[str]:
    base = f"www.dws.gov.za/Hydrology/Weekly/ProvinceWeek.aspx?region={code}"
    return [f"https://{base}", f"http://{base}"]


def _proxy_urls(code: str) -> List[str]:
    """URLs that fetch the province page through a public CORS/relay proxy."""
    if not DWS_PROXY_TEMPLATE or DWS_PROXY_TEMPLATE.lower() == "none":
        return []
    target = f"https://www.dws.gov.za/Hydrology/Weekly/ProvinceWeek.aspx?region={code}"
    return [DWS_PROXY_TEMPLATE.format(url=target)]


def _get_with_status(
    sess: requests.Session, url: str
) -> tuple[Optional[str], Optional[int]]:
    """GET a URL; return (text, None) on success or (None, status_code/None) on failure."""
    try:
        r = sess.get(url, verify=False, timeout=TIMEOUT)
    except Exception as e:
        print(f"[warn] Error requesting {url}: {e}")
        return None, None

    if r.status_code == 200 and r.text.strip():
        return r.text, None
    print(f"[warn] {url} returned status code {r.status_code}")
    return None, r.status_code


def fetch_dws_weekly_dams(
    coord_map: Dict[str, Dict[str, Any]], session: Optional[requests.Session] = None
) -> tuple[List[Dict[str, Any]], int]:
    """Scrape DWS official Weekly State of Dams tables across all South African provinces.

    Returns (stations, number of stations whose coordinates were matched in ArcGIS).
    """
    sess = session or create_dws_session()
    stations: List[Dict[str, Any]] = []
    coord_matches = 0
    blocked_provinces: List[str] = []
    too_small: List[str] = []
    sess.headers.update({"Referer": "https://www.dws.gov.za/Hydrology/Weekly/Province.aspx"})

    for code, (prov_name, default_lat, default_lng) in PROVINCES.items():
        response_text = None
        direct_blocked = False

        # 1. Talk to DWS directly (works from residential IPs).
        for url in _direct_urls(code):
            response_text, status = _get_with_status(sess, url)
            if response_text:
                break
            if status in BLOCKED_STATUS_CODES:
                direct_blocked = True
                break

        # 2. Datacenter IPs (GitHub Actions, etc.) are refused with 403/451 -> relay via proxy.
        if not response_text and direct_blocked:
            for url in _proxy_urls(code):
                print(f"[info] Province {code}: direct access blocked, retrying via proxy")
                response_text, _ = _get_with_status(sess, url)
                if response_text:
                    break

        if not response_text:
            blocked_provinces.append(code)
            print(f"[warn] Failed to fetch DWS dams for province {code}")
            time.sleep(REQUEST_DELAY)
            continue

        rows_before = len(stations)
        try:
            soup = BeautifulSoup(response_text, "html.parser")

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

                        matched = bool(coords and coords.get("lat") is not None)
                        if matched:
                            coord_matches += 1
                        lat = coords["lat"] if matched else default_lat
                        lng = coords["lng"] if matched else default_lng
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
            print(f"[warn] Parsing DWS dam table failed for province {code}: {e}")

        parsed = len(stations) - rows_before
        if parsed:
            print(f"[info] Province {code} ({prov_name}): parsed {parsed} dam records")
        else:
            too_small.append(f"{code} (served page, 0 rows parsed)")
            print(f"[warn] Province {code}: page fetched but no dam rows could be parsed")

        time.sleep(REQUEST_DELAY)

    print(f"[info] Scraped {len(stations)} DWS monitoring stations across South Africa")

    if not stations:
        if blocked_provinces:
            print(
                "[warn] All province requests were refused (403/451). DWS blocks datacenter IP "
                "ranges such as GitHub Actions runners; set DWS_PROXY_TEMPLATE or run the "
                "script from a normal network to refresh live data."
            )
        if too_small:
            print("[warn] Pages served but unparsable: " + ", ".join(too_small))

    print(f"[info] {coord_matches}/{len(stations)} stations have ArcGIS coordinates")
    return stations, coord_matches


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


def generate_readme_summary(stations: List[Dict[str, Any]], utc_now_dt: datetime) -> str:
    """Generate markdown summary for the automated README flood monitoring section."""
    sast_offset = timezone(timedelta(hours=2))
    sast_dt = utc_now_dt.astimezone(sast_offset)
    formatted_time = sast_dt.strftime("%Y-%m-%d %H:%M SAST")

    total = len(stations)
    major_list = [s for s in stations if s.get("status") == "major"]
    minor_list = [s for s in stations if s.get("status") == "minor"]
    alert_list = [s for s in stations if s.get("status") == "alert"]
    normal_list = [s for s in stations if s.get("status") == "normal"]

    highest = max(stations, key=lambda s: s.get("water_level", 0.0)) if stations else None
    total_fsc = sum(s.get("fsc_mcm", 0.0) for s in stations)
    rainy_count = sum(1 for s in stations if s.get("rain_fall", 0.0) > 0)
    max_rain_station = max(stations, key=lambda s: s.get("rain_fall", 0.0)) if stations else None

    highest_str = (
        f"**{highest.get('gauge')}** ({highest.get('water_level')}%\u00a0FSC \u2014 {highest.get('province')})"
        if highest else "N/A"
    )
    max_rain_str = (
        f"**{max_rain_station.get('gauge')}** ({max_rain_station.get('rain_fall')}\u00a0mm \u2014 {max_rain_station.get('province')})"
        if (max_rain_station and max_rain_station.get("rain_fall", 0.0) > 0) else "None recorded"
    )

    summary = (
        f"{SUMMARY_START_MARKER}\n"
        f"### 🌊 Latest Flood Data Update\n\n"
        f"> **Data Status:** Successfully Updated | **Last Refreshed:** `{formatted_time}`\n\n"
        f"| Metric | Details |\n"
        f"| :--- | :--- |\n"
        f"| **Total Stations Monitored** | **{total}** DWS stations across 9 provinces |\n"
        f"| **🔴 Major Flood Risk (≥ 110% FSC)** | **{len(major_list)}** dams |\n"
        f"| **🟠 Minor Flood Warning (100% – 109.9%)** | **{len(minor_list)}** dams |\n"
        f"| **🟡 Flood Alert (80% – 99.9%)** | **{len(alert_list)}** dams |\n"
        f"| **🟢 Normal Level (< 80%)** | **{len(normal_list)}** dams |\n"
        f"| **Highest Dam Water Level** | {highest_str} |\n"
        f"| **Total Storage Capacity** | **{total_fsc:,.1f} MCM** |\n"
        f"| **Stations Recording 24h Rain** | **{rainy_count}** location(s) (Peak: {max_rain_str}) |\n"
        f"| **Live Data Feed** | [`gauges_2_view.json`](public/data/gauges_2_view.json) | [`gauges_2_view.csv`](public/data/gauges_2_view.csv) |\n\n"
        f"*Data sourced from South Africa Department of Water and Sanitation (DWS) & Open-Meteo API.*\n"
        f"{SUMMARY_END_MARKER}"
    )

    return summary


def update_readme_summary(stations: List[Dict[str, Any]], utc_now_dt: datetime) -> None:
    """Safely update the automated flood data activity summary block in README.md."""
    if not README_PATH.exists():
        print(f"[warn] {README_PATH} not found; skipping README summary update.")
        return

    content = README_PATH.read_text(encoding="utf-8")
    new_summary = generate_readme_summary(stations, utc_now_dt)

    if SUMMARY_START_MARKER in content and SUMMARY_END_MARKER in content:
        pattern = re.compile(
            re.escape(SUMMARY_START_MARKER) + r".*?" + re.escape(SUMMARY_END_MARKER),
            re.DOTALL,
        )
        updated_content = pattern.sub(new_summary, content)
    else:
        lines = content.split("\n")
        insert_idx = -1
        for i, line in enumerate(lines):
            if line.startswith("## Core capabilities"):
                insert_idx = i
                break
        if insert_idx != -1:
            updated_content = "\n".join(lines[:insert_idx]) + f"{new_summary}\n\n---\n\n" + "\n".join(lines[insert_idx:])
        else:
            updated_content = content + f"\n\n{new_summary}\n"

    if updated_content != content:
        README_PATH.write_text(updated_content, encoding="utf-8")
        print(f"[info] Updated flood monitoring summary in {README_PATH}")
    else:
        print(f"[info] {README_PATH} summary is already up to date.")


def write_outputs(
    stations: List[Dict[str, Any]],
    live_count: Optional[int] = None,
    status: str = "live",
    note: str = "",
    coord_matches: Optional[int] = None,
    utc_now_dt: Optional[datetime] = None,
) -> None:
    """Write normalized data payload to JSON and CSV files."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    utc_now_dt = utc_now_dt or datetime.now(timezone.utc)
    utc_now = utc_now_dt.isoformat()
    if live_count is None:
        live_count = len(stations)

    # Always update README activity summary with current station data
    update_readme_summary(stations, utc_now_dt)

    payload = {
        "last_updated_utc": utc_now,
        "source": "Department of Water and Sanitation (DWS) South Africa",
        "source_url": "https://www.dws.gov.za/Hydrology/",
        "record_count": len(stations),
        "records_from_live_scrape": live_count,
        "ingestion_status": status,
        "ingestion_note": note,
        "records_with_arcgis_coords": coord_matches if coord_matches is not None else 0,
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
    session = create_dws_session()
    stations, coord_matches = fetch_dws_weekly_dams(coord_map, session=session)
    live_count = len(stations)

    if not stations:
        if JSON_OUTPUT_PATH.exists():
            print(f"[warn] Live DWS scraping yielded 0 stations. Using cached fallback data from {JSON_OUTPUT_PATH}")
            try:
                cached_data = json.loads(JSON_OUTPUT_PATH.read_text(encoding="utf-8"))
                stations = cached_data.get("records", [])
            except Exception as e:
                print(f"[warn] Failed to read cached data: {e}")

        if not stations:
            raise RuntimeError("No South African water monitoring stations retrieved and no cached fallback available.")

        write_outputs(
            stations,
            live_count=0,
            status="cached_fallback",
            note="DWS source unreachable/blocked from the ingestion host; re-emitting last known data.",
        )
        print("[warn] Data ingestion completed WITHOUT live data (cached fallback).")
        return

    enrich_stations_with_rainfall(stations)
    write_outputs(stations, live_count=live_count, status="live", coord_matches=coord_matches)
    print("[info] Data ingestion successfully completed.")


if __name__ == "__main__":
    main()
