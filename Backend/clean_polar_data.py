#!/usr/bin/env python3
"""
Polar Science Hub - Automated Data Engineering Pipeline (SIH 2026)
Task: Clean and standardize raw polar scientific datasets (NOAA WOA18 ocean climatology
      and Dome Fuji paleoclimate ice cores) into production-ready JSON files for MongoDB import.

Constraints & Features:
1. Memory Safety: Chunked streaming (chunksize=25000) avoids loading multi-GB ocean files into memory.
   Early break optimization halts parsing once latitude exceeds -60.0 deg S.
2. Ocean Filtering: Strictly filters Antarctic / Southern Ocean (Latitude <= -60.0 deg S).
   Unpivots 3D depth measurements, strips/standardizes column headers, purges fill/null values.
   Extracts a clean sample of 2,000 data points.
3. Ice Core Filtering: Parses metadata headers, normalizes depth, age (years BP), isotope ratios,
   and temperature reconstructions. Drops nulls and selects top 1,000 historical records.
4. Output: Saves to 'polar-data/cleaned_data/' and 'cleaned_data/' in JSON array format.
5. Verification: Displays summary statistics, schema columns, file sizes, and first 2 JSON samples.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path


def get_project_root() -> Path:
    """Detect and return the project root directory."""
    cwd = Path.cwd().resolve()
    # Check if we are inside polar-data or if polar-data is a child or current dir
    if (cwd / "02_scientific").exists():
        return cwd
    if (cwd / "polar-data" / "02_scientific").exists():
        return (cwd / "polar-data").resolve()
    return cwd


def locate_ocean_files(base_dir: Path):
    """Locate NOAA WOA18 temperature and salinity CSV files."""
    possible_ocean_dirs = [
        base_dir / "02_scientific" / "ocean",
        base_dir / "polar-data" / "02_scientific" / "ocean"
    ]
    ocean_dir = None
    for d in possible_ocean_dirs:
        if d.exists() and d.is_dir():
            ocean_dir = d
            break

    if ocean_dir is None:
        raise FileNotFoundError(f"Could not locate ocean directory in {possible_ocean_dirs}")

    t_file = ocean_dir / "woa18_decav_t00an01.csv"
    s_file = ocean_dir / "woa18_decav_s00an01.csv"

    # Fallback to any matching CSV if standard annual names are not present
    if not t_file.exists():
        candidates = list(ocean_dir.glob("*_t*.csv"))
        if candidates:
            t_file = candidates[0]
    if not s_file.exists():
        candidates = list(ocean_dir.glob("*_s*.csv"))
        if candidates:
            s_file = candidates[0]

    return t_file, s_file


def locate_ice_core_file(base_dir: Path):
    """Locate Antarctic paleoclimate ice core data file."""
    possible_cryo_dirs = [
        base_dir / "02_scientific" / "cryosphere",
        base_dir / "polar-data" / "02_scientific" / "cryosphere"
    ]
    cryo_dir = None
    for d in possible_cryo_dirs:
        if d.exists() and d.is_dir():
            cryo_dir = d
            break

    if cryo_dir is None:
        raise FileNotFoundError(f"Could not locate cryosphere directory in {possible_cryo_dirs}")

    # Preferred high-resolution paleoclimate records
    preferred_files = [
        "domefuji2018iso-temp.txt",
        "domefuji2018iso-temp-noaa.txt",
        "df2012isotope-temperature.txt",
        "antarctica_ice_core_paleo.txt",
        "edc2011dep.txt",
        "vostok2017age.txt"
    ]

    for fname in preferred_files:
        candidate = cryo_dir / fname
        if candidate.exists():
            return candidate

    # Fallback to any txt in cryosphere
    txt_candidates = list(cryo_dir.glob("*.txt"))
    if txt_candidates:
        return txt_candidates[0]

    raise FileNotFoundError("No ice core paleoclimate data file found in cryosphere directory.")


def parse_woa18_header(filepath: Path):
    """
    Parse NOAA WOA18 header lines.
    Line 1: Climatological description
    Line 2: '#COMMA SEPARATED LATITUDE, LONGITUDE, AND VALUES AT DEPTHS (M):0,5,10,...'
    Returns column names and list of depth columns.
    """
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        _ = f.readline()
        line2 = f.readline().strip()

    if "VALUES AT DEPTHS (M):" in line2:
        _, depths_part = line2.split("VALUES AT DEPTHS (M):", 1)
        depth_levels = [d.strip() for d in depths_part.split(",") if d.strip()]
        depth_cols = [f"depth_{d}" for d in depth_levels]
        col_names = ["latitude", "longitude"] + depth_cols
        return col_names, depth_cols
    else:
        # Generic CSV fallback: read first row with pandas
        preview = pd.read_csv(filepath, nrows=1)
        cleaned_cols = [c.strip().lower() for c in preview.columns]
        return cleaned_cols, [c for c in cleaned_cols if c not in ("latitude", "longitude")]


def clean_ocean_data(base_dir: Path, target_samples: int = 2000) -> pd.DataFrame:
    """
    Memory-safely parse NOAA WOA18 ocean files, filter Southern Ocean,
    drop nulls/fill values, and extract clean sample records.
    """
    t_path, s_path = locate_ocean_files(base_dir)
    print(f"\n[Ocean Pipeline] Temperature Source: {t_path.name}")
    print(f"[Ocean Pipeline] Salinity Source:    {s_path.name}")

    t_cols, t_depth_cols = parse_woa18_header(t_path)
    s_cols, s_depth_cols = parse_woa18_header(s_path)

    # Chunked read for temperature (Lat <= -60.0)
    chunksize = 25000
    t_chunks = []
    print(f"[Ocean Pipeline] Reading temperature data with chunksize={chunksize}...")
    for chunk in pd.read_csv(t_path, skiprows=2, names=t_cols, chunksize=chunksize, low_memory=False):
        # Filter rows strictly for the Antarctic / Southern Ocean region: Latitude <= -60.0
        subset = chunk[chunk["latitude"] <= -60.0]
        if not subset.empty:
            t_chunks.append(subset)
        # Early break optimization: dataset is sorted south-to-north
        if (chunk["latitude"] > -60.0).any():
            break

    df_t = pd.concat(t_chunks, ignore_index=True)
    print(f"[Ocean Pipeline] Found {len(df_t):,} Southern Ocean grid locations in temperature dataset.")

    # Chunked read for salinity (Lat <= -60.0)
    s_chunks = []
    print(f"[Ocean Pipeline] Reading salinity data with chunksize={chunksize}...")
    for chunk in pd.read_csv(s_path, skiprows=2, names=s_cols, chunksize=chunksize, low_memory=False):
        subset = chunk[chunk["latitude"] <= -60.0]
        if not subset.empty:
            s_chunks.append(subset)
        if (chunk["latitude"] > -60.0).any():
            break

    df_s = pd.concat(s_chunks, ignore_index=True)
    print(f"[Ocean Pipeline] Found {len(df_s):,} Southern Ocean grid locations in salinity dataset.")

    # Unpivot / melt depth levels into 3D observations
    melted_t = df_t.melt(
        id_vars=["latitude", "longitude"],
        value_vars=t_depth_cols,
        var_name="depth_col",
        value_name="temperature"
    )
    melted_t["depth"] = melted_t["depth_col"].apply(lambda x: float(x.replace("depth_", "")))
    melted_t = melted_t.drop(columns=["depth_col"])

    melted_s = df_s.melt(
        id_vars=["latitude", "longitude"],
        value_vars=s_depth_cols,
        var_name="depth_col",
        value_name="salinity"
    )
    melted_s["depth"] = melted_s["depth_col"].apply(lambda x: float(x.replace("depth_", "")))
    melted_s = melted_s.drop(columns=["depth_col"])

    # Merge temperature and salinity on 3D spatial coordinates
    merged = pd.merge(melted_t, melted_s, on=["latitude", "longitude", "depth"], how="inner")

    # Drop NaNs, nulls, and fill values (e.g., -999.0, -99.99)
    merged = merged.dropna(subset=["latitude", "longitude", "depth", "temperature", "salinity"])
    # Southern ocean physical validity: temp > -50.0 C (typically -2 to +4 C), salinity > 0 (typically 33 to 35.5 PSU)
    clean_ocean = merged[(merged["temperature"] > -50.0) & (merged["salinity"] > 0.0)].copy()

    # Standardize column names (strip spaces, lowercase)
    clean_ocean.columns = [c.strip().lower() for c in clean_ocean.columns]

    # Add normalized parameter and value fields for generic MongoDB queries
    clean_ocean["parameter"] = "temperature_and_salinity"
    clean_ocean["value"] = clean_ocean["temperature"]
    clean_ocean["temp_unit"] = "degrees_celsius"
    clean_ocean["salinity_unit"] = "psu"

    # Stratified sampling across depth levels to ensure full vertical profile (0m to 2000m+)
    num_depths = clean_ocean["depth"].nunique()
    per_depth = max(1, target_samples // num_depths + 1)
    stratified = clean_ocean.groupby("depth", group_keys=False).apply(lambda g: g.head(per_depth))
    final_sample = stratified.sort_values(by=["depth", "latitude", "longitude"]).head(target_samples).copy()

    # Reorder columns logically
    ordered_cols = [
        "latitude", "longitude", "depth", "temperature", "salinity",
        "parameter", "value", "temp_unit", "salinity_unit"
    ]
    final_sample = final_sample[ordered_cols]

    print(f"[Ocean Pipeline] Cleaned sample created with {len(final_sample):,} data points.")
    return final_sample


def clean_ice_core_data(base_dir: Path, target_records: int = 1000) -> pd.DataFrame:
    """
    Parse Antarctic ice core paleoclimate files, skip metadata/comments,
    normalize headers (depth, age, isotope proxies, temperature proxy),
    drop nulls, and extract the top 1,000 historical records.
    """
    ice_path = locate_ice_core_file(base_dir)
    print(f"\n[Ice Core Pipeline] Source File: {ice_path.name}")

    # Parse file lines skipping documentation comments starting with '#'
    data_lines = []
    with open(ice_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue
            data_lines.append(line_str)

    if not data_lines:
        raise ValueError(f"No valid data lines found in {ice_path}")

    # First non-comment line is the table header
    header_tokens = data_lines[0].split("\t")
    if len(header_tokens) == 1:
        # Try whitespace splitting if not tab-delimited
        header_tokens = data_lines[0].split()

    raw_rows = []
    expected_len = len(header_tokens)
    for l in data_lines[1:]:
        tokens = l.split("\t") if "\t" in l else l.split()
        if len(tokens) == expected_len:
            raw_rows.append(tokens)

    df_raw = pd.DataFrame(raw_rows, columns=header_tokens)

    # Convert all columns to numeric, setting non-numeric tokens to NaN
    for col in df_raw.columns:
        df_raw[col] = pd.to_numeric(df_raw[col], errors="coerce")

    # Drop nulls / NaNs
    df_clean = df_raw.dropna().copy()
    print(f"[Ice Core Pipeline] Parsed {len(df_clean):,} clean records after dropping nulls.")

    # Normalize column names:
    # Depth, Age/Year BP, Isotope/Deuterium/Temperature proxy
    rename_mapping = {
        "Depth_top_m": "depth_m",
        "Depth_bottom_m": "depth_bottom_m",
        "Age": "age_year_bp",
        "del_18O": "isotope_del_18o",
        "del_D": "deuterium_del_d",
        "dxs": "deuterium_excess",
        "dln": "deuterium_log_excess",
        "T_site": "temperature_proxy_site_c",
        "T_source": "temperature_proxy_source_c"
    }
    df_clean = df_clean.rename(columns=rename_mapping)

    # Standardize column headers: strip spaces, lowercase
    df_clean.columns = [c.strip().lower() for c in df_clean.columns]

    # Provide standardized generic aliases for MongoDB schema flexibility
    if "depth_m" in df_clean.columns and "depth" not in df_clean.columns:
        df_clean["depth"] = df_clean["depth_m"]
    if "age_year_bp" in df_clean.columns and "age" not in df_clean.columns:
        df_clean["age"] = df_clean["age_year_bp"]
    if "deuterium_del_d" in df_clean.columns and "deuterium" not in df_clean.columns:
        df_clean["deuterium"] = df_clean["deuterium_del_d"]
    if "isotope_del_18o" in df_clean.columns and "isotope" not in df_clean.columns:
        df_clean["isotope"] = df_clean["isotope_del_18o"]
    if "temperature_proxy_site_c" in df_clean.columns and "temperature_proxy" not in df_clean.columns:
        df_clean["temperature_proxy"] = df_clean["temperature_proxy_site_c"]

    # Retain full historical dataset (720k years, 7,470 records)
    if target_records is not None and target_records > 0 and len(df_clean) > target_records:
        top_records = df_clean.head(target_records).copy()
    else:
        top_records = df_clean.copy()
    print(f"[Ice Core Pipeline] Retained {len(top_records):,} historical paleoclimate records spanning {top_records['age_year_bp'].min():.0f} to {top_records['age_year_bp'].max():,.0f} yr BP.")
    return top_records


def save_json(df: pd.DataFrame, target_paths: list):
    """Save DataFrame as a JSON array of records to multiple destination paths."""
    records = df.to_dict(orient="records")
    for path in target_paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
        size_bytes = os.path.getsize(path)
        print(f"Saved: {path} ({size_bytes:,} bytes, {size_bytes / 1024:.2f} KB)")


def main():
    print("=" * 75)
    print(" Polar Science Hub - Automated Data Engineering Pipeline (SIH 2026)")
    print("=" * 75)

    base_dir = get_project_root()
    print(f"Working Base Directory: {base_dir}")

    # Output destination directories
    output_dirs = [
        base_dir / "polar-data" / "cleaned_data",
        base_dir / "cleaned_data"
    ]

    # 1. Clean Ocean Data
    ocean_df = clean_ocean_data(base_dir, target_samples=2000)
    ocean_targets = [d / "clean_southern_ocean.json" for d in output_dirs]
    save_json(ocean_df, ocean_targets)

    # 2. Clean Ice Core Data (Full 720k-year paleoclimate record)
    ice_df = clean_ice_core_data(base_dir, target_records=None)
    ice_targets = [d / "clean_ice_core.json" for d in output_dirs]
    save_json(ice_df, ice_targets)

    # 3. Execution & Verification Report
    print("\n" + "=" * 75)
    print(" EXECUTION & VERIFICATION REPORT")
    print("=" * 75)

    # Summary Statistics for Ocean Data
    ocean_primary = ocean_targets[0]
    ocean_size_kb = os.path.getsize(ocean_primary) / 1024
    print(f"\n1. SOUTHERN OCEAN DATASET:")
    print(f"   - File Path:      {ocean_primary}")
    print(f"   - Record Count:   {len(ocean_df):,} records")
    print(f"   - File Size:      {ocean_size_kb:.2f} KB ({os.path.getsize(ocean_primary):,} bytes)")
    print(f"   - Columns Present: {list(ocean_df.columns)}")
    print(f"   - Sample Records (First 2 JSON records):")
    ocean_sample = ocean_df.head(2).to_dict(orient="records")
    print(json.dumps(ocean_sample, indent=4))

    # Summary Statistics for Ice Core Data
    ice_primary = ice_targets[0]
    ice_size_kb = os.path.getsize(ice_primary) / 1024
    print(f"\n2. PALEOCLIMATE ICE CORE DATASET:")
    print(f"   - File Path:      {ice_primary}")
    print(f"   - Record Count:   {len(ice_df):,} records")
    print(f"   - File Size:      {ice_size_kb:.2f} KB ({os.path.getsize(ice_primary):,} bytes)")
    print(f"   - Columns Present: {list(ice_df.columns)}")
    print(f"   - Sample Records (First 2 JSON records):")
    ice_sample = ice_df.head(2).to_dict(orient="records")
    print(json.dumps(ice_sample, indent=4))

    print("\n" + "=" * 75)
    print(" Pipeline execution completed successfully!")
    print("=" * 75)


if __name__ == "__main__":
    main()
