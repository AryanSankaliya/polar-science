# 🧊 Polar Science Hub - SIH 2026 Central Repository

Welcome to the centralized repository for the **Polar Science Hub (SIH 2026)**. This repository hosts verified, sanitized multi-domain polar datasets and backend ingestion pipelines.

## 📂 Clean Datasets Available in `/cleaned_data/`
- `clean_southern_ocean.json` - NOAA WOA18 Decadal CTD profiles (0–2000m depth, in-situ temp & salinity).
- `clean_ice_core.json` - Dome Fuji 720,000-year paleoclimate $\delta^{18}\text{O}$ and temperature anomaly series.
- `clean_stations.json` - Antarctic Research Stations with geographic boundaries ($\le -50^\circ\text{S}$), operational status, and Indian stations (Bharati, Maitri, Dakshin Gangotri).
- `clean_sea_ice_satellite.json` - Decadal satellite cryosphere extent and area time-series sampled for 60 FPS charts.
- `clean_expeditions.json` - Indian Antarctic Expedition logistics metadata (vessels, routes, seasons).
- `clean_expedition_chunks.json` - 1,800+ grounded RAG text chunks with exact document and page citations for Zero-Hallucination AI.
- `clean_outreach.json` - Standardized polar science trivia, citizen science, and educational articles.
- `clean_media_gallery.json` - Categorized polar visual media index.

## 👥 Team Collaboration & Branching Strategy
To prevent any merge conflicts:
- `main` is protected: Do not commit or push directly to `main`.
- **Frontend Developers:** Branch out using `git checkout -b feature/frontend`.
- **Backend / Microservice Developers:** Branch out using `git checkout -b feature/backend-api`.
- Create a Pull Request (PR) on GitHub when your feature is complete.
