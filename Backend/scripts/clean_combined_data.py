#!/usr/bin/env python3
"""
scripts/clean_combined_data.py
Polar Science Hub - SIH 2026 Auto-Classification & Data Engineering Pipeline

Objectives:
1. Scan 'combined_raw/' and ignore/purge all non-data files (*.py, *.sh, *.pyc, *.md, *.log, *.tmp).
2. Auto-classify valid data files into:
   - Person 1: Antarctic Research Stations
   - Person 3: Cryosphere / Satellite Sea Ice Time-Series
3. Sanitize & Normalize:
   - Person 1: Latitude <= -50.0, slugify station_id, normalize status, flag Indian stations.
   - Person 3: ISO YYYY-MM-DD, drop sentinels (-999, -9999), clean extents & anomalies, downsample for 60 FPS Recharts.
4. Export clean JSONs:
   - 'cleaned_data/clean_stations.json'
   - 'cleaned_data/clean_sea_ice_satellite.json'
5. Output detailed QA validation metrics.
"""

import os
import re
import sys
import json
import glob
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure UTF-8 stdout on Windows
sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
COMBINED_RAW_DIR = WORKSPACE_ROOT / "combined_raw"
CLEANED_DATA_DIR = WORKSPACE_ROOT / "cleaned_data"

# Non-data extensions to strictly ignore / purge
IGNORED_EXTENSIONS = {'.py', '.pyc', '.sh', '.md', '.log', '.tmp', '.sql', '.html'}
# Tabular data extensions
DATA_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json', '.txt', '.dat'}

# Schema detection keywords
STATION_KEYWORDS = {'station', 'operator', 'elevation', 'country', 'base', 'facility', 'coordinates', 'station_name'}
STATION_COORD_KEYWORDS = {'latitude', 'longitude', 'latitude_decimal', 'longitude_decimal', 'lat', 'lon', 'lng'}
SATELLITE_KEYWORDS = {'extent', 'sea_ice', 'ice_extent', 'area', 'anomaly', 'concentration', 'hemisphere', 'sensor'}


def dms_to_decimal(val) -> float:
    """Converts degrees/minutes/seconds string or numeric to decimal degrees float."""
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().replace('"', '').replace("'", ' ').replace('°', ' ')
    parts = re.findall(r'[-+]?\d*\.?\d+', s)
    if not parts:
        return None
    deg = float(parts[0])
    mins = float(parts[1]) if len(parts) > 1 else 0.0
    secs = float(parts[2]) if len(parts) > 2 else 0.0
    decimal = deg + (mins / 60.0) + (secs / 3600.0)
    # Check hemisphere suffix
    if 'S' in s.upper() or 'W' in s.upper():
        decimal = -abs(decimal)
    return round(decimal, 4)


def slugify(text: str) -> str:
    """Create a URL-safe lowercase slug."""
    text = str(text).strip().lower()
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'[^a-z0-9-]', '', text)
    return text.strip('-')


def purge_accidental_scripts(directory: Path) -> int:
    """
    Purges accidental helper python (.py) and shell scripts placed in combined_raw/ root
    to maintain strict directory hygiene for data pipelines.
    """
    purged_count = 0
    # Search for .py scripts directly inside combined_raw/
    for item in directory.iterdir():
        if item.is_file() and item.suffix.lower() in {'.py', '.pyc', '.sh'}:
            try:
                item.unlink()
                purged_count += 1
            except Exception as e:
                print(f"[WARN] Could not purge {item.name}: {e}")
    return purged_count


def classify_file(filepath: Path) -> str:
    """
    Classifies a data file as 'STATIONS', 'SATELLITE_SEA_ICE', or 'OTHER'
    based on schema column signatures and filename.
    """
    fname = filepath.name.lower()
    ext = filepath.suffix.lower()

    if ext in {'.csv', '.txt', '.dat'}:
        try:
            # Read first 5 rows with sniffed separator
            df = pd.read_csv(filepath, nrows=5, sep=None, engine='python', on_bad_lines='skip')
            cols = {c.strip().lower() for c in df.columns}
        except Exception:
            return 'OTHER'
    elif ext in {'.xlsx', '.xls'}:
        try:
            df = pd.read_excel(filepath, nrows=5)
            cols = {str(c).strip().lower() for c in df.columns}
        except Exception:
            return 'OTHER'
    elif ext == '.json':
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                cols = {k.strip().lower() for k in data[0].keys()}
            else:
                return 'OTHER'
        except Exception:
            return 'OTHER'
    else:
        return 'OTHER'

    # Check for Station Signature
    has_station_kw = len(cols.intersection(STATION_KEYWORDS)) > 0 or 'station' in fname
    has_coord_kw = len(cols.intersection(STATION_COORD_KEYWORDS)) > 0 or any('lat' in c for c in cols)
    if has_station_kw and has_coord_kw:
        return 'STATIONS'

    # Check for Sea Ice / Satellite Signature
    has_satellite_kw = len(cols.intersection(SATELLITE_KEYWORDS)) > 0 or 'sea_ice' in fname or 'seaice' in fname or 'extent' in fname
    if has_satellite_kw:
        return 'SATELLITE_SEA_ICE'

    return 'OTHER'


def canonical_station_key(name: str, lat: float, lon: float) -> str:
    """Extracts a normalized station key for deduplication."""
    clean_name = re.sub(r'\b(station|base|research|camp)\b', '', name.lower()).strip()
    clean_name = re.sub(r'[^a-z0-9]', '', clean_name)
    # Coordinate key rounded to 1 decimal (~11 km)
    coord_key = f"{round(lat, 1)}_{round(lon, 1)}" if lat is not None and lon is not None else ""
    return f"{clean_name}_{coord_key}" if clean_name else coord_key


def process_person_1_stations(files: list) -> list:
    """
    Sanitizes, deduplicates, and normalizes Antarctic research stations.
    Filter: Latitude <= -50.0 deg S.
    """
    stations_dict = {}

    for file_path in files:
        print(f"   [PERSON 1] Parsing station dataset: {file_path.name}")
        ext = file_path.suffix.lower()
        try:
            if ext in {'.csv', '.txt', '.dat'}:
                df = pd.read_csv(file_path)
            elif ext in {'.xlsx', '.xls'}:
                df = pd.read_excel(file_path)
            else:
                continue
        except Exception as e:
            print(f"   [WARN] Could not load {file_path.name}: {e}")
            continue

        # Standardize column names
        col_map = {c: c.strip().lower() for c in df.columns}
        df.rename(columns=col_map, inplace=True)

        for _, row in df.iterrows():
            raw_name = str(row.get('station_name') or row.get('name') or row.get('station') or '').strip()
            if not raw_name or raw_name.lower() in {'nan', 'none', ''}:
                continue

            # Latitude resolution
            raw_lat = row.get('latitude_decimal') if 'latitude_decimal' in df.columns else row.get('latitude')
            if raw_lat is None or pd.isna(raw_lat):
                raw_lat = row.get('lat')
            lat = dms_to_decimal(raw_lat)

            # Strict Antarctic Filter: Latitude <= -50.0
            if lat is None or lat > -50.0:
                continue

            # Longitude resolution
            raw_lon = row.get('longitude_decimal') if 'longitude_decimal' in df.columns else row.get('longitude')
            if raw_lon is None or pd.isna(raw_lon):
                raw_lon = row.get('lon') or row.get('lng')
            lon = dms_to_decimal(raw_lon)

            # Canonical deduplication key
            ckey = canonical_station_key(raw_name, lat, lon)

            # Operator & Country
            country = str(row.get('country') or '').strip()
            is_indian = any(k in raw_name.lower() for k in ['maitri', 'bharati', 'dakshin gangotri', 'india bay']) or country.lower() == 'india'
            if not country or country.lower() in {'nan', 'international'}:
                country = 'India' if is_indian else 'International'

            operator = str(row.get('operator') or '').strip()
            if not operator or operator.lower() == 'nan':
                operator = 'NCPOR / Ministry of Earth Sciences' if is_indian else 'National Antarctic Program'

            # Elevation
            raw_elev = row.get('elevation_m') or row.get('elevation') or row.get('elev')
            try:
                elevation_m = round(float(raw_elev), 1) if pd.notna(raw_elev) and raw_elev != '' else None
            except Exception:
                elevation_m = None

            # Established Year
            raw_yr = row.get('establishment_year') or row.get('established_year') or row.get('year')
            try:
                established_year = int(float(raw_yr)) if pd.notna(raw_yr) and raw_yr != '' else None
            except Exception:
                established_year = None

            # Status Normalization
            raw_status = str(row.get('status') or 'Active - Year Round').strip()
            if any(k in raw_status.lower() for k in ['decommissioned', 'historical', 'closed', 'submerged']):
                status = "Historical"
            elif any(k in raw_status.lower() for k in ['summer', 'seasonal', 'support']):
                status = "Summer Only"
            else:
                status = "Active - Year Round"

            # Station ID slug
            raw_id = str(row.get('station_id') or row.get('id') or '').strip()
            slug = slugify(raw_id) if raw_id and raw_id.lower() != 'nan' and not raw_id.isdigit() else slugify(raw_name)

            record = {
                "station_id": slug,
                "name": raw_name,
                "country": country,
                "operator": operator,
                "latitude": round(lat, 4),
                "longitude": round(lon, 4) if lon is not None else 0.0,
                "elevation_m": elevation_m,
                "status": status,
                "established_year": established_year,
                "is_indian_station": bool(is_indian),
                "location": str(row.get('location') or 'Antarctica').strip()
            }

            # If already seen, merge and keep the one with longer details
            if ckey in stations_dict:
                existing = stations_dict[ckey]
                # Keep the more informative name/operator/location
                if len(record['location']) > len(existing['location']):
                    existing['location'] = record['location']
                if len(record['operator']) > len(existing['operator']):
                    existing['operator'] = record['operator']
                if existing['elevation_m'] is None and record['elevation_m'] is not None:
                    existing['elevation_m'] = record['elevation_m']
                if existing['established_year'] is None and record['established_year'] is not None:
                    existing['established_year'] = record['established_year']
                if not existing['station_id'].startswith(('ind-', 'usa-', 'gbr-', 'rus-', 'aus-', 'deu-', 'fra-', 'jpn-', 'chn-', 'nor-', 'arg-')) and slug.startswith(('ind-', 'usa-', 'gbr-', 'rus-', 'aus-', 'deu-', 'fra-', 'jpn-', 'chn-', 'nor-', 'arg-')):
                    existing['station_id'] = slug
                if record['is_indian_station']:
                    existing['is_indian_station'] = True
                    existing['country'] = 'India'
            else:
                stations_dict[ckey] = record

    stations_list = list(stations_dict.values())
    # Sort Indian stations first, then alphabetically by name
    stations_list.sort(key=lambda s: (not s['is_indian_station'], s['name']))
    return stations_list


def process_person_3_satellite(files: list) -> list:
    """
    Sanitizes, standardizes dates, cleans sentinels, and downsamples satellite
    sea ice time series to guarantee 60 FPS Recharts rendering.
    """
    all_rows = []

    for file_path in files:
        print(f"   [PERSON 3] Parsing sea ice satellite dataset: {file_path.name}")
        ext = file_path.suffix.lower()
        try:
            if ext in {'.csv', '.txt', '.dat'}:
                df = pd.read_csv(file_path)
            elif ext in {'.xlsx', '.xls'}:
                df = pd.read_excel(file_path)
            else:
                continue
        except Exception as e:
            print(f"   [WARN] Could not load {file_path.name}: {e}")
            continue

        col_map = {c: c.strip().lower() for c in df.columns}
        df.rename(columns=col_map, inplace=True)

        for _, row in df.iterrows():
            # Sentinel checking for year / extent
            raw_ext = row.get('extent_sq_km') or row.get('extent') or row.get('sea_ice_extent')
            if raw_ext is None or pd.isna(raw_ext) or float(raw_ext) in {-999, -9999, -99.0}:
                continue

            try:
                extent_val = float(raw_ext)
            except Exception:
                continue

            # Year / Month / Day parsing
            try:
                if 'year' in df.columns and 'month' in df.columns and 'day' in df.columns:
                    y = int(row['year'])
                    m = int(row['month'])
                    d = int(row['day'])
                    date_str = f"{y:04d}-{m:02d}-{d:02d}"
                elif 'date' in df.columns:
                    dt = pd.to_datetime(row['date'])
                    y, m, d = dt.year, dt.month, dt.day
                    date_str = dt.strftime('%Y-%m-%d')
                else:
                    continue
            except Exception:
                continue

            # Check if extent is in millions of sq km (typical NSIDC ranges from 2.0 to 20.0 million sq km)
            # or in absolute sq km. We preserve both for clear analytical presentation.
            if extent_val < 50.0:  # Measured in millions of sq km (e.g. 9.680)
                extent_million_sq_km = round(extent_val, 4)
                extent_sq_km = round(extent_val * 1_000_000, 1)
            else:
                extent_sq_km = round(extent_val, 1)
                extent_million_sq_km = round(extent_val / 1_000_000, 4)

            # Sea Ice Area estimation/extraction
            raw_area = row.get('area_sq_km') or row.get('area')
            if raw_area is not None and pd.notna(raw_area) and float(raw_area) not in {-999, -9999}:
                area_val = float(raw_area)
                area_sq_km = round(area_val * 1_000_000, 1) if area_val < 50.0 else round(area_val, 1)
            else:
                area_sq_km = round(extent_sq_km * 0.82, 1)

            sensor = str(row.get('source_sensor') or row.get('sensor') or 'SSMIS-F18 / CDR v4.0').strip()

            all_rows.append({
                "date": date_str,
                "year": y,
                "month": m,
                "day": d,
                "sea_ice_extent_million_sq_km": extent_million_sq_km,
                "sea_ice_extent_sq_km": extent_sq_km,
                "sea_ice_area_sq_km": area_sq_km,
                "source_sensor": sensor
            })

    if not all_rows:
        return []

    # Sort chronologically by date
    all_rows.sort(key=lambda r: r['date'])

    # Compute climatological daily mean baseline (day of year mean) to calculate accurate anomalies
    doy_means = {}
    for r in all_rows:
        key = (r['month'], r['day'])
        doy_means.setdefault(key, []).append(r['sea_ice_extent_million_sq_km'])

    doy_avg = {k: np.mean(v) for k, v in doy_means.items()}

    for r in all_rows:
        key = (r['month'], r['day'])
        baseline = doy_avg.get(key, r['sea_ice_extent_million_sq_km'])
        anomaly = r['sea_ice_extent_million_sq_km'] - baseline
        r['anomaly_sq_km'] = round(anomaly * 1_000_000, 1)
        r['anomaly_million_sq_km'] = round(anomaly, 4)

    # 60 FPS DOWNSAMPLING: If row count exceeds 2,500, downsample to ~1,800 points
    # ensuring frontend Recharts line chart renders instantaneously with zero jank
    total_count = len(all_rows)
    if total_count > 2500:
        step = int(np.ceil(total_count / 1800))
        print(f"   [OPTIMIZATION] Dataset has {total_count} points. Downsampling by step={step} for 60 FPS Recharts rendering.")
        # Ensure first point, last point, and all-time min/max are strictly preserved
        min_idx = min(range(total_count), key=lambda i: all_rows[i]['sea_ice_extent_million_sq_km'])
        max_idx = max(range(total_count), key=lambda i: all_rows[i]['sea_ice_extent_million_sq_km'])
        critical_indices = {0, total_count - 1, min_idx, max_idx}

        downsampled = [all_rows[i] for i in range(0, total_count, step)]
        # Add critical indices if missed
        downsampled_dates = {r['date'] for r in downsampled}
        for idx in critical_indices:
            if all_rows[idx]['date'] not in downsampled_dates:
                downsampled.append(all_rows[idx])

        downsampled.sort(key=lambda r: r['date'])
        return downsampled

    return all_rows


def main():
    print("===========================================================================")
    print("SIH 2026: Polar Science Hub - Combined Data Classification & Cleaning Engine")
    print("===========================================================================")
    print(f"[PATH] Workspace Root:     {WORKSPACE_ROOT}")
    print(f"[PATH] Combined Raw Dir:   {COMBINED_RAW_DIR}")
    print(f"[PATH] Cleaned Output Dir: {CLEANED_DATA_DIR}")

    CLEANED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Purge accidental .py / .sh scripts from combined_raw/
    purged_py_count = purge_accidental_scripts(COMBINED_RAW_DIR)
    print(f"[HYGIENE] Purged {purged_py_count} unneeded helper scripts from combined_raw/ root.")

    # Step 2: Scan for valid data files
    data_files = []
    ignored_files = []

    for root, _, files in os.walk(COMBINED_RAW_DIR):
        for f in files:
            p = Path(root) / f
            ext = p.suffix.lower()
            if ext in IGNORED_EXTENSIONS:
                ignored_files.append(p)
            elif ext in DATA_EXTENSIONS:
                data_files.append(p)

    print(f"[SCAN] Found {len(data_files)} valid tabular data files.")
    print(f"[SCAN] Filtered out {len(ignored_files)} non-data files (*.py, *.sh, *.md, *.sql).")

    # Step 3: Schema Signature Detection
    person_1_files = []
    person_3_files = []
    other_files = []

    for df_path in data_files:
        cls = classify_file(df_path)
        if cls == 'STATIONS':
            person_1_files.append(df_path)
        elif cls == 'SATELLITE_SEA_ICE':
            person_3_files.append(df_path)
        else:
            other_files.append(df_path)

    print("\n--- CLASSIFICATION BREAKDOWN ---")
    print(f"   Person 1 (Antarctic Stations):  {len(person_1_files)} files -> {[f.name for f in person_1_files]}")
    print(f"   Person 3 (Satellite Sea Ice):   {len(person_3_files)} files -> {[f.name for f in person_3_files]}")
    print(f"   Other Unclassified Datasets:    {len(other_files)} files -> {[f.name for f in other_files[:5]]}")

    # Step 4: Process Person 1 (Stations)
    print("\n[PROCESSING] Person 1: Antarctic Research Stations...")
    clean_stations = process_person_1_stations(person_1_files)
    stations_output_path = CLEANED_DATA_DIR / "clean_stations.json"
    with open(stations_output_path, 'w', encoding='utf-8') as f:
        json.dump(clean_stations, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Saved {len(clean_stations)} clean Antarctic stations to: {stations_output_path.name}")

    # Step 5: Process Person 3 (Satellite Sea Ice)
    print("\n[PROCESSING] Person 3: Satellite Sea Ice Time-Series...")
    clean_satellite = process_person_3_satellite(person_3_files)
    satellite_output_path = CLEANED_DATA_DIR / "clean_sea_ice_satellite.json"
    with open(satellite_output_path, 'w', encoding='utf-8') as f:
        json.dump(clean_satellite, f, indent=2, ensure_ascii=False)
    print(f"[SUCCESS] Saved {len(clean_satellite)} clean satellite sea ice observations to: {satellite_output_path.name}")

    # Step 6: QA Validation Summary
    print("\n===========================================================================")
    print("VALIDATION SUMMARY (SIH 2026 CRITERIA)")
    print("===========================================================================")
    print(f"1. Accidental .py Scripts Purged:     {purged_py_count}")
    print(f"2. Valid Data Files Processed:         {len(person_1_files) + len(person_3_files)}")
    print(f"3. Person 1 Clean Stations:            {len(clean_stations)}")
    print(f"   - Indian Stations Included:         {sum(1 for s in clean_stations if s['is_indian_station'])}")
    print(f"   - Unique Countries Represented:     {len(set(s['country'] for s in clean_stations))}")
    print(f"   - Maximum Latitude (Must be <=-50): {max(s['latitude'] for s in clean_stations):.4f} deg S")
    print(f"4. Person 3 Clean Satellite Points:    {len(clean_satellite)}")
    if clean_satellite:
        min_ext = min(clean_satellite, key=lambda r: r['sea_ice_extent_million_sq_km'])
        max_ext = max(clean_satellite, key=lambda r: r['sea_ice_extent_million_sq_km'])
        print(f"   - Date Range:                       {clean_satellite[0]['date']} to {clean_satellite[-1]['date']}")
        print(f"   - All-Time Min Extent:              {min_ext['sea_ice_extent_million_sq_km']} M sq km ({min_ext['date']})")
        print(f"   - All-Time Max Extent:              {max_ext['sea_ice_extent_million_sq_km']} M sq km ({max_ext['date']})")
        print(f"   - 60 FPS Target Compliance:         {'PASSED (<= 2,500 points)' if len(clean_satellite) <= 2500 else 'FAILED'}")
    print("===========================================================================\n")


if __name__ == '__main__':
    main()
