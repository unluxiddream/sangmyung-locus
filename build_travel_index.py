#!/usr/bin/env python3
"""Build dist/: index Markdown in content/ to JSON and copy pages, styles and public assets.

dist/js/ is written by TypeScript (tsc), so this script never touches it.
"""

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
CONTENT_DIR = ROOT / "content"
SRC_DIR = ROOT / "src"
PUBLIC_DIR = ROOT / "public"
DIST_DIR = ROOT / "dist"
TS_OUTPUT_DIR = DIST_DIR / "js"
OUTPUT = DIST_DIR / "data" / "travel-index.json"
COLLECTION_DIRS = {
    "travel": CONTENT_DIR / "travel",
    "stay": CONTENT_DIR / "stay",
    "infoCenters": CONTENT_DIR / "info-center",
    "medical": CONTENT_DIR / "medical",
}
# (source folder, destination folder): every file is copied as-is, keeping sub-folders.
STATIC_COPIES = [
    (SRC_DIR / "pages", DIST_DIR),
    (SRC_DIR / "styles", DIST_DIR / "css"),
    (PUBLIC_DIR, DIST_DIR),
]
IGNORED_FILES = {".DS_Store"}

IMAGE_URL = re.compile(r"https?://[^\s<>\"']+\.(?:png|jpe?g|gif|webp)(?:\?[^\s<>\"']*)?", re.I)
IFRAME = re.compile(r"<iframe\b.*?</iframe>", re.I | re.S)


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_frontmatter(source: str) -> tuple[dict[str, Any], str]:
    parts = source.split("---", 2)
    if len(parts) < 3 or parts[0].strip():
        return {}, source.strip()

    fields: dict[str, Any] = {}
    current_list: str | None = None
    for line in parts[1].splitlines():
        match = re.match(r"^([^:#][^:]*):(?:\s*(.*))?$", line)
        if match:
            key, raw_value = match.group(1).strip(), (match.group(2) or "").strip()
            if raw_value:
                fields[key] = unquote(raw_value)
                current_list = None
            else:
                fields[key] = ""
                current_list = key
            continue
        item = re.match(r"^\s*-\s*(.*?)\s*$", line)
        if item and current_list:
            if not isinstance(fields[current_list], list):
                fields[current_list] = []
            fields[current_list].append(unquote(item.group(1)))
        elif line.strip():
            current_list = None

    return fields, parts[2].strip()


def values(value: Any) -> list[str]:
    if isinstance(value, list):
        return [
            str(item).strip()
            for item in value
            if str(item).strip() and str(item).strip().lower() not in {"null", "~"}
        ]
    if isinstance(value, str) and value.strip():
        text = value.strip()
        if text.lower() in {"null", "~", "[]"}:
            return []
        return [item.strip() for item in text.split(",") if item.strip()]
    return []


def field_value(value: Any) -> str | list[str]:
    if isinstance(value, list):
        return values(value)
    if value is None or str(value).strip().lower() in {"", "null", "~", "[]"}:
        return ""
    return str(value).strip()


def normalize_province(region_values: list[str], address: str) -> str:
    combined = " ".join(region_values)
    address = address.strip()
    province = re.match(r"^(강원|충북|충남|전북|전남|경북|경남|경기|제주)", address)
    if province:
        names = {
            "강원": "강원도",
            "충북": "충청북도",
            "충남": "충청남도",
            "전북": "전라북도",
            "전남": "전라남도",
            "경북": "경상북도",
            "경남": "경상남도",
            "경기": "경기도",
            "제주": "제주도",
        }
        return names[province.group(1)]
    if address.startswith("광주"):
        return "전라남도" if "전라도" in combined else "광주광역시"
    if address.startswith(("대전", "세종")):
        return "충청남도" if "충청도" in combined else address[:2]
    if address.startswith(("부산", "대구", "울산")):
        return "경상남도" if address.startswith(("부산", "울산")) else "경상북도"
    for name in ("강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"):
        if name in combined:
            return name
    return combined[0] if combined else ""


def parse_document(path: Path, collection: str) -> dict[str, Any]:
    source = path.read_text(encoding="utf-8-sig")
    fields, body = parse_frontmatter(source)
    iframe_match = IFRAME.search(body)
    map_embed = iframe_match.group(0) if iframe_match else ""
    body = IFRAME.sub("", body)

    photos = [url.rstrip(".,)") for url in IMAGE_URL.findall(body)]
    body = IMAGE_URL.sub("", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()

    address_value = field_value(fields.get("주소", ""))
    address = " ".join(address_value) if isinstance(address_value, list) else address_value
    area = values(fields.get("대지역", []))
    name = unicodedata.normalize("NFC", path.stem).split("_", 1)[-1]
    return {
        "id": name,
        "name": name,
        "collection": collection,
        "aliases": values(fields.get("aliases", [])),
        "cover": field_value(fields.get("cover", "")),
        "info": field_value(fields.get("info", "")),
        "address": address_value,
        "contact": field_value(fields.get("문의", "")),
        "holiday": field_value(fields.get("휴일", "")),
        "admission": field_value(fields.get("입장료", "")),
        "parking": field_value(fields.get("주차", "")),
        "transit": field_value(fields.get("대중교통", "")),
        "website": field_value(fields.get("홈페이지", "")),
        "hours": field_value(fields.get("영업시간", fields.get("영업 시간", ""))),
        "areas": area,
        "province": normalize_province(area, address),
        "themes": values(fields.get("메인 테마", [])),
        "subthemes": values(fields.get("서브 테마", [])),
        "courses": values(fields.get("코스", [])),
        "tags": values(fields.get("태그", [])),
        "filmingLocations": field_value(fields.get("촬영장소", fields.get("촬영 장소", ""))),
        "description": body,
        "photos": photos,
        "mapEmbed": map_embed,
        "source": path.relative_to(CONTENT_DIR).as_posix(),
    }


def clean_dist() -> None:
    """Remove everything this script generated last time, keeping tsc output in dist/js/."""
    if not DIST_DIR.is_dir():
        return
    for entry in DIST_DIR.iterdir():
        if entry == TS_OUTPUT_DIR:
            continue
        if entry.is_dir():
            shutil.rmtree(entry)
        else:
            entry.unlink()


def copy_static() -> int:
    copied = 0
    for source_dir, target_dir in STATIC_COPIES:
        for path in sorted(source_dir.rglob("*")):
            if not path.is_file() or path.name in IGNORED_FILES:
                continue
            target = target_dir / path.relative_to(source_dir)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            copied += 1
    return copied


def main() -> None:
    required = [*COLLECTION_DIRS.values(), *(source for source, _ in STATIC_COPIES)]
    missing = [str(directory.relative_to(ROOT)) for directory in required if not directory.is_dir()]
    if missing:
        raise SystemExit(f"Source folder(s) not found: {', '.join(missing)}")

    index = {
        collection: [
            parse_document(path, collection)
            for path in sorted(directory.rglob("*.md"))
        ]
        for collection, directory in COLLECTION_DIRS.items()
    }

    clean_dist()
    copied = copy_static()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    counts = ", ".join(f"{name}: {len(items)}" for name, items in index.items())
    print(f"Indexed Markdown files ({counts}) -> {OUTPUT.relative_to(ROOT)}")
    print(f"Copied {copied} static files -> {DIST_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
