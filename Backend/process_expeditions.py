#!/usr/bin/env python3
"""
Polar Science Hub - Expeditions & Logistics Document Ingestion Pipeline (SIH 2026)
Person 4: Indian Antarctic Expeditions & Logistics

Task:
Recursively process all PDF/text expedition reports in polar-data/04_expeditions/
in a memory-safe, streamed, page-by-page manner, extracting:
1. Document metadata (Expedition #, title, year, season, vessels, ports, routes, highlights, environmental summary)
2. Grounded AI evidence text chunks (~300 words with exact document and page traceability)

Outputs:
- polar-data/cleaned_data/clean_expeditions.json
- polar-data/cleaned_data/clean_expedition_chunks.json
- polar-data/cleaned_data/expedition_processing_errors.log
"""

import os
import sys
import gc
import re
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

# Ensure UTF-8 output encoding across Windows shells
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import pypdf

# ----------------------------------------------------------------------
# Constants & Vocabulary
# ----------------------------------------------------------------------

ORDINALS = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
    'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
    'nineteenth': 19, 'twentieth': 20, 'twenty first': 21, 'twenty-first': 21,
    'twenty second': 22, 'twenty-second': 22, 'twenty third': 23, 'twenty-third': 23,
    'twenty fourth': 24, 'twenty-fourth': 24, 'twenty fifth': 25, 'twenty-fifth': 25,
    'twenty sixth': 26, 'twenty-sixth': 26, 'twenty seventh': 27, 'twenty-seventh': 27,
    'twenty eighth': 28, 'twenty-eighth': 28, 'twenty ninth': 29, 'twenty-ninth': 29,
    'thirtieth': 30, 'thirty first': 31, 'thirty-first': 31, 'thirty second': 32,
    'thirty third': 33, 'thirty fourth': 34, 'thirty fifth': 35,
    'fortieth': 40, 'forty first': 41, 'forty-first': 41, 'forty second': 42,
    'forty-second': 42, 'forty third': 43, 'forty fourth': 44, 'forty fifth': 45
}

KNOWN_VESSELS = [
    'MV Polar Circle', 'Polar Circle', 'MV Finnpolaris', 'Finnpolaris',
    'MV Thuleland', 'Thuleland', 'MV Polar Duke', 'Polar Duke',
    'MV Henrik Ibsen', 'Henrik Ibsen', 'MV Magne Viking', 'Magne Viking',
    'MV Stepan Krasheninnikov', 'Stepan Krasheninnikov',
    'MV Vasiliy Golovnin', 'Vasiliy Golovnin', 'MV Ivan Papanin', 'Ivan Papanin',
    'MV Boris Petrov', 'Boris Petrov', 'ORV Sagar Kanya', 'Sagar Kanya',
    'RV Sagar Nidhi', 'Sagar Nidhi', 'Magdalena Oldendorff', 'Icebird', 'Lady Any'
]

KNOWN_LOCATIONS = [
    'Goa', 'Mormugao', 'Cape Town', 'Port Louis', 'Mauritius', 'Durban',
    'Maitri', 'Dakshin Gangotri', 'Bharati', 'Himadri', 'Ny-Ålesund',
    'Schirmacher Oasis', 'Larsemann Hills', 'Prydz Bay', 'Queen Maud Land',
    'Dronning Maud Land', 'Antarctica', 'Svalbard'
]

def get_ordinal_suffix(n: int) -> str:
    if 11 <= (n % 100) <= 13:
        return 'th'
    return {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')


# ----------------------------------------------------------------------
# Path Discovery
# ----------------------------------------------------------------------

def get_project_root() -> Path:
    """Identify project root directory."""
    cwd = Path.cwd().resolve()
    if (cwd / "04_expeditions").exists():
        return cwd
    if (cwd / "polar-data" / "04_expeditions").exists():
        return cwd
    return cwd


def locate_expeditions_dir(base_dir: Path) -> Path:
    """Locate the expeditions directory."""
    candidates = [
        base_dir / "polar-data" / "04_expeditions",
        base_dir / "04_expeditions"
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    raise FileNotFoundError(f"Could not locate expeditions directory in {candidates}")


# ----------------------------------------------------------------------
# Text Cleaning & Normalization
# ----------------------------------------------------------------------

def clean_page_text(raw_text: str) -> str:
    """Normalize whitespace, remove non-printable characters, and trim."""
    if not raw_text:
        return ""
    # Remove null bytes and non-printable characters
    cleaned = raw_text.replace('\x00', ' ').replace('\ufeff', '')
    # Replace tabs and multiple spaces with a single space
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    # Collapse 3+ newlines into 2
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def is_valid_sentence(s: str) -> bool:
    """Filter out OCR garbage, table headers, and messy bibliographies."""
    s = s.strip()
    if len(s) < 35 or len(s) > 350:
        return False
    # Check ratio of letters to total characters
    letters = sum(1 for c in s if c.isalpha())
    if letters / len(s) < 0.60:
        return False
    # Avoid table of contents dots or page numbers
    if '. . .' in s or '...' in s or re.search(r'\.{4,}', s):
        return False
    # Avoid standalone references or figure captions
    lower = s.lower()
    if lower.startswith(('fig.', 'figure', 'table', 'references', 'contents', 'pp.')):
        return False
    return True


# ----------------------------------------------------------------------
# Metadata Extraction
# ----------------------------------------------------------------------

def extract_expedition_title_and_number(text_sample: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract expedition number (e.g., '41st ISEA', '15th IAE') and title
    (e.g., '41st Indian Antarctic Expedition').
    Returns (None, None) if not confidently matched.
    """
    # 1. Check numeric pattern: e.g., '25th Indian Antarctic Expedition', '15th Indian Arctic Expedition'
    num_match = re.search(
        r'(\d+)(?:st|nd|rd|th)\s+(Indian\s+(?:Scientific\s+)?(?:Antarctic|Arctic)?\s*Expedition|ISEA|IAE)',
        text_sample, re.I
    )
    if num_match:
        n = int(num_match.group(1))
        matched_phrase = num_match.group(2).lower()
        realm = 'Arctic' if 'arctic' in matched_phrase and 'antarctic' not in matched_phrase else 'Antarctic'
        acronym = 'IAE' if realm == 'Arctic' else 'ISEA'
        suffix = get_ordinal_suffix(n)
        exp_num = f"{n}{suffix} {acronym}"
        exp_title = f"{n}{suffix} Indian {realm} Expedition"
        return exp_num, exp_title

    # 2. Check word pattern: e.g., 'Twenty Fifth Indian Antarctic Expedition'
    word_match = re.search(
        r'(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|'
        r'Twelfth|Thirteenth|Fourteenth|Fifteenth|Sixteenth|Seventeenth|Eighteenth|'
        r'Nineteenth|Twentieth|Twenty[\s\-]+[A-Za-z]+|Thirtieth|Thirty[\s\-]+[A-Za-z]+|'
        r'Fortieth|Forty[\s\-]+[A-Za-z]+)\s+(Indian\s+(?:Scientific\s+)?(?:Antarctic|Arctic)?\s*Expedition)',
        text_sample, re.I
    )
    if word_match:
        word_str = word_match.group(1).lower().strip()
        n = ORDINALS.get(word_str)
        matched_phrase = word_match.group(2).lower()
        realm = 'Arctic' if 'arctic' in matched_phrase and 'antarctic' not in matched_phrase else 'Antarctic'
        acronym = 'IAE' if realm == 'Arctic' else 'ISEA'
        if n:
            suffix = get_ordinal_suffix(n)
            exp_num = f"{n}{suffix} {acronym}"
            exp_title = f"{word_match.group(1).title()} Indian {realm} Expedition"
            return exp_num, exp_title

    return None, None


def extract_year_and_season(text_sample: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract operational year and seasonal component."""
    year = None
    season = None

    # Specific report/expedition year patterns
    year_match = re.search(
        r'(?:Scientific Report,?\s*|Expedition.*?\(|Expedition\s+Report\s*|Wintering\s*\(|'
        r'Technical Publication No\.\s*\d+,\s*(?:pp\.?\s*[\d\-]+,\s*)?|Report\s+)(\d{4}[–\-\/]\d{2,4}|\d{4})',
        text_sample, re.I
    )
    if year_match:
        year = year_match.group(1).replace('–', '-').replace('/', '-')
    else:
        # Fallback to isolated polar expedition year range (1980-2026)
        fallback_match = re.search(r'\b(198\d|199\d|200\d|201\d|202\d)(?:[–\-\/](\d{2,4}))?\b', text_sample)
        if fallback_match:
            year = fallback_match.group(0).replace('–', '-').replace('/', '-')

    # Season determination
    if re.search(r'austral\s+summer', text_sample, re.I):
        season = 'Austral Summer'
    elif re.search(r'wintering|austral\s+winter', text_sample, re.I):
        season = 'Wintering'
    elif re.search(r'\bsummer\s+batch\b|\bsummer\s+team\b', text_sample, re.I):
        season = 'Summer'
    elif re.search(r'\bwinter\s+batch\b|\bwinter\s+team\b', text_sample, re.I):
        season = 'Winter'

    return year, season


def extract_vessels(full_text: str) -> List[str]:
    """Identify confirmed expedition vessels with zero hallucination."""
    vessels = []
    for v in KNOWN_VESSELS:
        # Match only when clearly mentioned as a word
        if re.search(r'\b' + re.escape(v) + r'\b', full_text, re.I):
            clean_v = v if (v.startswith('MV ') or v.startswith('ORV ') or v.startswith('RV ')) else f'MV {v}'
            if clean_v not in vessels:
                vessels.append(clean_v)
    return vessels


def extract_ports_and_route(full_text: str) -> Tuple[List[str], Optional[str]]:
    """Extract relevant ports/bases and identify explicit route string if stated."""
    ports = []
    for loc in KNOWN_LOCATIONS:
        if re.search(r'\b' + re.escape(loc) + r'\b', full_text, re.I):
            if loc not in ports:
                ports.append(loc)

    route = None
    # Check for explicit route statement
    route_match = re.search(
        r'\b(?:route|voyage|sailed\s+from)\s*[:=]?\s*([A-Za-z\s]+(?:[-–—→]|to)\s*[A-Za-z\s]+(?:[-–—→]|to)?\s*[A-Za-z\s]*)',
        full_text, re.I
    )
    if route_match:
        cand = route_match.group(1).strip()
        tokens = re.split(r'[-–—→]|to', cand, flags=re.I)
        matched_locs = [t.strip().title() for t in tokens if any(l.lower() in t.lower() for l in KNOWN_LOCATIONS)]
        if len(matched_locs) >= 2:
            route = " → ".join(matched_locs)

    return ports, route


def extract_highlights(sentences: List[str], max_count: int = 4) -> List[str]:
    """Extract high-signal operational highlights."""
    highlight_patterns = [
        r'\b(?:departed|departure|sailed from|arrival at|arrived in|landed at)\b',
        r'\b(?:cargo handling|unloading|offloading|fuel transfer|resupply|replenishment)\b',
        r'\b(?:station maintenance|construction|erection|installation of)\b',
        r'\b(?:helicopter operations|helirig|airlift|convoy|polar traverse)\b',
        r'\b(?:handing over|taking over|wintering team inaugurated|summer team)\b',
        r'\b(?:automatic weather station|drilling on polar|deep ice core)\b',
        r'\b(?:inaugurated|accomplishment|milestone achieved|established)\b'
    ]

    highlights = []
    for s in sentences:
        if is_valid_sentence(s):
            if any(re.search(pat, s, re.I) for pat in highlight_patterns):
                clean_s = s.strip()
                if clean_s not in highlights:
                    highlights.append(clean_s)
                    if len(highlights) >= max_count:
                        break
    return highlights


def extract_environmental_summary(sentences: List[str], max_count: int = 2) -> Optional[str]:
    """Extract substantive environmental/climatic observations."""
    env_patterns = [
        r'\b(?:blizzard|severe blizzard|storm|gale|wind speed reached|gusts? of)\b',
        r'\b(?:fast ice|pack ice|sea-ice|sea ice|ice shelf|iceberg|polynya)\b',
        r'\b(?:sub-zero|coldest temperature|lowest temperature|extreme cold|snowfall)\b',
        r'\b(?:weather conditions|severe weather|environmental challenge)\b'
    ]

    selected = []
    for s in sentences:
        if is_valid_sentence(s):
            if any(re.search(pat, s, re.I) for pat in env_patterns):
                clean_s = s.strip()
                if clean_s not in selected:
                    selected.append(clean_s)
                    if len(selected) >= max_count:
                        break
    return " ".join(selected) if selected else None


def determine_document_type(filename: str, sample_text: str) -> str:
    """Classify the document type."""
    fn_lower = filename.lower()
    txt_lower = sample_text.lower()
    if 'report' in fn_lower or 'scientific report' in txt_lower or 'expedition report' in txt_lower:
        return "Expedition Report"
    if 'atbd' in fn_lower or 'technical publication' in txt_lower:
        return "Technical Document"
    return "Scientific Paper"


# ----------------------------------------------------------------------
# Grounded AI Chunking Engine
# ----------------------------------------------------------------------

def split_into_chunks(
    text: str,
    doc_id: str,
    source_filename: str,
    page_num: int,
    target_words: int = 300,
    min_words: int = 30
) -> List[Dict[str, Any]]:
    """
    Split a page's text into clean chunks of approximately target_words
    without breaking sentence boundaries.
    """
    chunks = []
    # Split text into sentences using standard end-of-sentence punctuation
    raw_sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in raw_sentences if s.strip()]

    current_chunk_sentences = []
    current_word_count = 0
    chunk_index = 1

    for sent in sentences:
        words = sent.split()
        word_count = len(words)

        if current_word_count + word_count > target_words and current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences).strip()
            if len(chunk_text.split()) >= min_words:
                chunks.append({
                    "chunk_id": f"{doc_id}_p{page_num:02d}_c{chunk_index:02d}",
                    "document_id": doc_id,
                    "source_document": source_filename,
                    "page": page_num,
                    "text": chunk_text
                })
                chunk_index += 1
            current_chunk_sentences = [sent]
            current_word_count = word_count
        else:
            current_chunk_sentences.append(sent)
            current_word_count += word_count

    # Flush remaining chunk
    if current_chunk_sentences:
        chunk_text = " ".join(current_chunk_sentences).strip()
        if len(chunk_text.split()) >= min_words:
            chunks.append({
                "chunk_id": f"{doc_id}_p{page_num:02d}_c{chunk_index:02d}",
                "document_id": doc_id,
                "source_document": source_filename,
                "page": page_num,
                "text": chunk_text
            })

    return chunks


# ----------------------------------------------------------------------
# Main Ingestion Engine
# ----------------------------------------------------------------------

def process_all_expeditions():
    base_dir = get_project_root()
    exp_dir = locate_expeditions_dir(base_dir)

    output_dirs = [
        base_dir / "polar-data" / "cleaned_data",
        base_dir / "cleaned_data"
    ]
    for d in output_dirs:
        d.mkdir(parents=True, exist_ok=True)

    error_log_path = output_dirs[0] / "expedition_processing_errors.log"
    error_log_entries = []

    print("=" * 70)
    print(" Polar Science Hub - Expeditions & Logistics Ingestion Pipeline")
    print("=" * 70)
    print(f"Base Directory:        {base_dir}")
    print(f"Expeditions Directory: {exp_dir}")

    # Gather all supported files
    all_candidate_files = sorted(exp_dir.rglob('*'))
    supported_files = [
        f for f in all_candidate_files
        if f.is_file() and f.suffix.lower() in ['.pdf', '.txt']
    ]

    total_files_scanned = len(supported_files)
    print(f"Discovered {total_files_scanned} candidate expedition documents.\n")

    structured_records: List[Dict[str, Any]] = []
    all_chunks: List[Dict[str, Any]] = []

    successful_files = 0
    failed_files = 0
    total_pages_processed = 0

    seen_hashes = set()
    doc_counter = 1

    for file_idx, filepath in enumerate(supported_files, 1):
        filename = filepath.name
        rel_path = f"polar-data/04_expeditions/{filename}"
        doc_id = f"exp_{doc_counter:03d}"

        # SHA-256 for duplicate detection (streamed for memory safety)
        try:
            hasher = hashlib.sha256()
            with open(filepath, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
            file_hash = hasher.hexdigest()
            if file_hash in seen_hashes:
                print(f"[{file_idx}/{total_files_scanned}] SKIP Duplicate: {filename}")
                continue
            seen_hashes.add(file_hash)
        except Exception as e:
            msg = f"Failed to compute hash for {filename}: {e}"
            error_log_entries.append(msg)

        # PDF processing
        if filepath.suffix.lower() == '.pdf':
            try:
                reader = pypdf.PdfReader(str(filepath))
                num_pages = len(reader.pages)
                total_pages_processed += num_pages

                doc_sentences: List[str] = []
                sample_text_header = ""
                full_vessel_search_text = ""
                has_any_text = False
                file_chunk_count = 0

                # Process page by page for memory safety
                for p_idx in range(num_pages):
                    try:
                        page = reader.pages[p_idx]
                        raw_t = page.extract_text() or ""
                        clean_t = clean_page_text(raw_t)

                        if clean_t:
                            has_any_text = True
                            page_num = p_idx + 1

                            # Build chunks for AI retrieval
                            page_chunks = split_into_chunks(clean_t, doc_id, filename, page_num)
                            all_chunks.extend(page_chunks)
                            file_chunk_count += len(page_chunks)

                            # Accumulate sample text for header/metadata from first 15 pages
                            if p_idx < 15:
                                sample_text_header += clean_t + "\n"

                            # Accumulate text for vessel search
                            if p_idx < 30:
                                full_vessel_search_text += clean_t + "\n"

                            # Collect sentences for highlights and environmental summary
                            if p_idx < 25:
                                page_sentences = re.split(r'(?<=[.!?])\s+', clean_t)
                                doc_sentences.extend(page_sentences)

                    except Exception as page_err:
                        err_msg = f"Error extracting page {p_idx+1} in {filename}: {page_err}"
                        error_log_entries.append(err_msg)

                # Clean up reader explicitly
                del reader
                gc.collect()

                # Extract metadata
                exp_num, exp_title = extract_expedition_title_and_number(sample_text_header)
                op_year, season = extract_year_and_season(sample_text_header)
                vessels = extract_vessels(full_vessel_search_text)
                ports, route = extract_ports_and_route(sample_text_header)
                highlights = extract_highlights(doc_sentences)
                env_summary = extract_environmental_summary(doc_sentences)
                doc_type = determine_document_type(filename, sample_text_header)

                extraction_status = "success" if has_any_text else "no_text_layer"

                record = {
                    "document_id": doc_id,
                    "source_document": filename,
                    "source_path": rel_path,
                    "expedition_number": exp_num,
                    "expedition_title": exp_title,
                    "operational_year": op_year,
                    "season": season,
                    "vessel": vessels,
                    "ports": ports,
                    "route": route,
                    "operational_highlights": highlights,
                    "environmental_summary": env_summary,
                    "document_type": doc_type,
                    "page_count": num_pages,
                    "source": "NCPOR / Official Source",
                    "extraction_status": extraction_status
                }

                structured_records.append(record)
                successful_files += 1
                doc_counter += 1

                print(f"[{file_idx:02d}/{total_files_scanned:02d}] {filename[:38]:38} | "
                      f"Pgs: {num_pages:3d} | Chunks: {file_chunk_count:3d} | "
                      f"Exp: {str(exp_num or '-'):10} | Status: {extraction_status}")

            except Exception as file_err:
                failed_files += 1
                err_msg = f"Unrecoverable error processing {filename}: {file_err}"
                error_log_entries.append(err_msg)
                print(f"[{file_idx:02d}/{total_files_scanned:02d}] {filename[:38]:38} | FAILED: {file_err}")

        # Plain-text files
        elif filepath.suffix.lower() == '.txt':
            try:
                content = filepath.read_text(encoding='utf-8', errors='ignore')
                clean_t = clean_page_text(content)
                total_pages_processed += 1

                exp_num, exp_title = extract_expedition_title_and_number(clean_t[:3000])
                op_year, season = extract_year_and_season(clean_t[:3000])
                vessels = extract_vessels(clean_t)
                ports, route = extract_ports_and_route(clean_t)

                sentences = re.split(r'(?<=[.!?])\s+', clean_t)
                highlights = extract_highlights(sentences)
                env_summary = extract_environmental_summary(sentences)

                page_chunks = split_into_chunks(clean_t, doc_id, filename, 1)
                all_chunks.extend(page_chunks)

                record = {
                    "document_id": doc_id,
                    "source_document": filename,
                    "source_path": rel_path,
                    "expedition_number": exp_num,
                    "expedition_title": exp_title,
                    "operational_year": op_year,
                    "season": season,
                    "vessel": vessels,
                    "ports": ports,
                    "route": route,
                    "operational_highlights": highlights,
                    "environmental_summary": env_summary,
                    "document_type": "Text Document",
                    "page_count": 1,
                    "source": "NCPOR / Official Source",
                    "extraction_status": "success"
                }

                structured_records.append(record)
                successful_files += 1
                doc_counter += 1
                print(f"[{file_idx:02d}/{total_files_scanned:02d}] {filename[:38]:38} | TXT | Chunks: {len(page_chunks):3d}")

            except Exception as txt_err:
                failed_files += 1
                err_msg = f"Error processing TXT file {filename}: {txt_err}"
                error_log_entries.append(err_msg)

    # ------------------------------------------------------------------
    # Save Structured Outputs
    # ------------------------------------------------------------------
    for target_dir in output_dirs:
        exp_path = target_dir / "clean_expeditions.json"
        with open(exp_path, "w", encoding="utf-8") as f:
            json.dump(structured_records, f, indent=2, ensure_ascii=False)

        chunks_path = target_dir / "clean_expedition_chunks.json"
        with open(chunks_path, "w", encoding="utf-8") as f:
            json.dump(all_chunks, f, indent=2, ensure_ascii=False)

    # Write error log
    with open(error_log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(error_log_entries) if error_log_entries else "No processing errors encountered.\n")

    # ------------------------------------------------------------------
    # Required Final Summary & Schema Inspection
    # ------------------------------------------------------------------
    print("\n" + "=" * 50)
    print("EXPEDITION DATA PROCESSING COMPLETE")
    print("=" * 50)
    print(f"Total files scanned: {total_files_scanned}")
    print(f"Successful files: {successful_files}")
    print(f"Failed files: {failed_files}")
    print(f"Total pages processed: {total_pages_processed}")
    print(f"Total structured records: {len(structured_records)}")
    print(f"Total evidence chunks: {len(all_chunks)}")
    print("\nOutput:")
    print("polar-data/cleaned_data/clean_expeditions.json")
    print("polar-data/cleaned_data/clean_expedition_chunks.json")
    if error_log_entries:
        print(f"polar-data/cleaned_data/expedition_processing_errors.log ({len(error_log_entries)} warning/error entries)")

    print("\n" + "=" * 50)
    print("SCHEMA INSPECTION")
    print("=" * 50)
    print("\n--- FIRST 2 OBJECTS FROM clean_expeditions.json ---")
    print(json.dumps(structured_records[:2], indent=2, ensure_ascii=False))

    print("\n--- FIRST 2 OBJECTS FROM clean_expedition_chunks.json ---")
    print(json.dumps(all_chunks[:2], indent=2, ensure_ascii=False))

    return {
        "total_scanned": total_files_scanned,
        "successful": successful_files,
        "failed": failed_files,
        "pages": total_pages_processed,
        "records": len(structured_records),
        "chunks": len(all_chunks)
    }


if __name__ == "__main__":
    process_all_expeditions()
