#!/usr/bin/env python3
"""Build dist/: index Markdown in content/ to JSON and copy pages, styles and public assets.

content/ko/ is the base language. Folder names inside it are free-form: the kind of each
file (spot, stay, medical, info center, region intro, Q&A) is read from words in its folder
path, and region/theme/course filters come from the YAML values, not from folders.
content/en/ and content/ja/ hold translations matched to ko files by file name.

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
DATA_DIR = DIST_DIR / "data"

BASE_LANGUAGE = "ko"
TRANSLATIONS = ["en", "ja"]
COLLECTIONS = ["travel", "stay", "infoCenters", "medical"]

# A file's kind comes from its folder path; anything that matches no rule is a spot.
# A rule matches a folder named exactly like the English name (content/ko/<region>/stay/...),
# or any folder whose name contains the Korean word, so batches that arrive with Korean
# folder names still build before they are renamed.
FOLDER_RULES = [
    ("intro", "소개", "regionIntro"),
    ("faq", "Q&A", "faq"),
    ("stay", "숙박", "stay"),
    ("medical", "의료", "medical"),
    ("info-center", "안내소", "infoCenters"),
]
DEFAULT_KIND = "travel"
FAQ_FILE = re.compile(r"Q\s*(?:&|n|and)\s*A", re.I)
REGION_WORDS = {"kangwon": "강원", "gyeongsang": "경상", "jeolla": "전라", "chungcheong": "충청"}

# Spelling variants written by different people, mapped to the values the site filters on.
SITE_THEMES = ["쇼핑", "엔터테인먼트", "역사", "음식", "자연관광"]
THEME_ALIASES = {"자연": "자연관광", "자연경관": "자연관광"}
COURSE_ALIASES = {"K-컬처": "K-컬쳐"}

# Fields a translation file may replace. Filters, photos, map and contact stay from the ko file.
TRANSLATED_FIELDS = [
    "name", "info", "address", "holiday", "admission", "parking",
    "transit", "hours", "filmingLocations", "organizer", "festivalPeriod", "description",
]
FAQ_ITEM = re.compile(r"^\s*Q\.\s*(.+?)\s*\n\s*A\.\s*(.+?)\s*(?=^\s*Q\.|\Z)", re.M | re.S)
# (source folder, destination folder): every file is copied as-is, keeping sub-folders.
STATIC_COPIES = [
    (SRC_DIR / "pages", DIST_DIR),
    (SRC_DIR / "styles", DIST_DIR / "css"),
    (PUBLIC_DIR, DIST_DIR),
]
IGNORED_FILES = {".DS_Store"}

IMAGE_URL = re.compile(r"https?://[^\s<>\"']+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s<>\"']*)?", re.I)
IFRAME = re.compile(r"<iframe\b.*?</iframe>", re.I | re.S)
HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
# "항목: 값" line. It must start at the line start (not indented, not "-" or "※"), and its colon
# must be followed by a space or the line end, so values such as "- 하절기 09:00~18:00",
# "  ※ 휴게시간 12:10~13:00" or "- 서울: 경부고속도로…" stay part of the field above.
YAML_KEY = re.compile(r"^([^\s#\-※][^:]*):(?:[ \t]+(.*?))?\s*$")
YAML_ITEM = re.compile(r"^\s*-\s*(.*?)\s*$")


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
    current: str | None = None

    def add_line(text: str) -> None:
        # A list item or wrapped line belongs to the field above; several lines become a list.
        if current is None:
            return
        value = fields[current]
        if isinstance(value, list):
            value.append(text)
        elif value:
            fields[current] = [value, text]
        else:
            fields[current] = [text]

    for line in parts[1].splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = YAML_KEY.match(line)
        if match:
            current = match.group(1).strip()
            fields[current] = unquote(match.group(2) or "")
            continue
        item = YAML_ITEM.match(line)
        add_line(unquote(item.group(1) if item else line.strip()))

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


def nfc(text: str) -> str:
    # macOS stores Korean file names decomposed; compare and output them composed.
    return unicodedata.normalize("NFC", text)


def file_key(path: Path) -> str:
    return nfc(path.stem).split("_", 1)[-1]


def folder_names(path: Path, root: Path) -> list[str]:
    return [nfc(part) for part in path.relative_to(root).parts[:-1]]


def classify(path: Path, root: Path) -> str:
    # Q&A files are recognised by name (QnA_경상도.md, Q&A_경상도.md) wherever they are placed.
    if FAQ_FILE.search(nfc(path.stem)):
        return "faq"
    folders = folder_names(path, root)
    for folder, word, kind in FOLDER_RULES:
        if folder in folders or any(word in name for name in folders):
            return kind
    return DEFAULT_KIND


def region_of(*texts: str) -> str:
    joined = " ".join(texts)
    return next((key for key, word in REGION_WORDS.items() if word in joined), "")


def aliased(items: list[str], aliases: dict[str, str]) -> list[str]:
    return list(dict.fromkeys(aliases.get(item, item) for item in items))


def read_markdown(path: Path) -> tuple[dict[str, Any], str]:
    fields, body = parse_frontmatter(path.read_text(encoding="utf-8-sig"))
    # <!-- --> notes are hidden in Obsidian, so keep them off the site as well.
    return fields, HTML_COMMENT.sub("", body)


def parse_document(path: Path, collection: str, root: Path) -> dict[str, Any]:
    fields, body = read_markdown(path)
    iframe_match = IFRAME.search(body)
    map_embed = iframe_match.group(0) if iframe_match else ""
    body = IFRAME.sub("", body)

    photos = [url.rstrip(".,)") for url in IMAGE_URL.findall(body)]
    body = IMAGE_URL.sub("", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()

    address_value = field_value(fields.get("주소", ""))
    address = " ".join(address_value) if isinstance(address_value, list) else address_value
    area = values(fields.get("대지역", []))
    key = file_key(path)
    title = field_value(fields.get("title", ""))
    return {
        "id": key,
        "name": title if isinstance(title, str) and title else key,
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
        "themes": aliased(values(fields.get("메인 테마", [])), THEME_ALIASES),
        "subthemes": values(fields.get("서브 테마", [])),
        "courses": aliased(values(fields.get("코스", [])), COURSE_ALIASES),
        "tags": values(fields.get("태그", [])),
        "filmingLocations": field_value(fields.get("촬영장소", fields.get("촬영 장소", ""))),
        "organizer": field_value(fields.get("주최-주관", fields.get("주최·주관", ""))),
        "festivalPeriod": field_value(fields.get("축제 기간", fields.get("축제기간", ""))),
        "description": body,
        "photos": photos,
        "mapEmbed": map_embed,
        "source": nfc(path.relative_to(root).as_posix()),
    }


def parse_intro(path: Path, root: Path) -> dict[str, Any]:
    doc = parse_document(path, "regionIntro", root)
    # Region folder (content/ko/kangwon/intro/) first, then the 대지역 value or file name.
    region = next((key for key in REGION_WORDS if key in folder_names(path, root)), "")
    return {
        "region": region or region_of(" ".join(doc["areas"]), doc["id"]),
        "name": doc["name"],
        "info": doc["info"],
        # Some intros put the map image in the body instead of cover:.
        "cover": doc["cover"] or (doc["photos"][0] if doc["photos"] else ""),
        "description": doc["description"],
        "source": doc["source"],
    }


def parse_faq(path: Path) -> list[dict[str, str]]:
    _, body = read_markdown(path)
    region = region_of(file_key(path))
    return [
        {"question": question.strip(), "answer": re.sub(r"\n{3,}", "\n\n", answer).strip(), "region": region}
        for question, answer in FAQ_ITEM.findall(body)
    ]


def read_language(lang: str, report: list[str]) -> dict[str, Any]:
    """Parse every Markdown file of one language into {kind: {file key: record}}."""
    root = CONTENT_DIR / lang
    parsed: dict[str, Any] = {kind: {} for kind in [*COLLECTIONS, "regionIntro"]}
    parsed["faq"] = []
    for path in sorted(root.rglob("*.md"), key=lambda item: nfc(item.as_posix())):
        kind = classify(path, root)
        if kind == "faq":
            parsed["faq"].extend(parse_faq(path))
            continue
        record = parse_intro(path, root) if kind == "regionIntro" else parse_document(path, kind, root)
        key = file_key(path)
        previous = parsed[kind].get(key)
        if previous is None:
            parsed[kind][key] = record
            continue
        # The same place filed in two folders (e.g. local spot and K-culture): keep one, merge lists.
        if lang == BASE_LANGUAGE:
            report.append(f"(자동 처리됨) 같은 장소가 두 폴더에 있어 하나로 합침: {key}")
        if kind != "regionIntro":
            for field in ("courses", "tags", "themes"):
                previous[field] = list(dict.fromkeys(previous[field] + record[field]))
        # Fill fields that only the second copy has (e.g. 촬영장소), whichever copy sorts first.
        for field, value in record.items():
            if value and not previous.get(field):
                previous[field] = value
    return parsed


def translate(base: dict[str, Any], translated: dict[str, Any], lang: str, report: list[str]) -> dict[str, Any]:
    """Overlay one language onto the ko records; anything missing falls back to Korean."""
    result: dict[str, Any] = {}
    missing_titles = 0
    for kind in [*COLLECTIONS, "regionIntro"]:
        result[kind] = {}
        for key, record in base[kind].items():
            merged = dict(record)
            other = translated[kind].get(key)
            if other:
                for field in TRANSLATED_FIELDS:
                    if field in other and other[field] and (field != "name" or other["name"] != key):
                        merged[field] = other[field]
                if kind != "regionIntro" and other["name"] == key:
                    missing_titles += 1
            if kind != "regionIntro":
                # Shown under the translated address so visitors can show it to drivers or type it into Korean map apps.
                merged["addressKo"] = record["address"]
            result[kind][key] = merged
        for key, other in translated[kind].items():
            if key not in base[kind]:
                report.append(f"[{lang}] 짝이 되는 한국어 파일이 없어 건너뜀: {other['source']}")
    if missing_titles:
        report.append(f"[{lang}] title이 없어 한국어 이름으로 표시되는 파일: {missing_titles}개")
    result["faq"] = translated["faq"] or base["faq"]
    return result


def to_index(parsed: dict[str, Any]) -> dict[str, Any]:
    index: dict[str, Any] = {kind: list(parsed[kind].values()) for kind in COLLECTIONS}
    index["regionIntros"] = {intro["region"]: intro for intro in parsed["regionIntro"].values() if intro["region"]}
    index["faq"] = parsed["faq"]
    return index


def check(parsed: dict[str, Any], report: list[str]) -> None:
    for kind in COLLECTIONS:
        for record in parsed[kind].values():
            if not record["province"]:
                report.append(f"지역을 알 수 없어 어느 지역 메뉴에도 안 나옴 (대지역 확인): {record['source']}")
            odd = [theme for theme in record["themes"] if theme not in SITE_THEMES]
            if kind == "travel" and odd:
                report.append(f"메인 테마가 테마 아카이브 메뉴에 없는 값 {odd}: {record['source']}")
    for intro in parsed["regionIntro"].values():
        if not intro["region"]:
            report.append(f"어느 도의 소개글인지 알 수 없음: {intro['source']}")


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


def output_path(lang: str) -> Path:
    name = "travel-index.json" if lang == BASE_LANGUAGE else f"travel-index.{lang}.json"
    return DATA_DIR / name


def main() -> None:
    required = [CONTENT_DIR / BASE_LANGUAGE, *(source for source, _ in STATIC_COPIES)]
    missing = [str(directory.relative_to(ROOT)) for directory in required if not directory.is_dir()]
    if missing:
        raise SystemExit(f"Source folder(s) not found: {', '.join(missing)}")

    report: list[str] = []
    base = read_language(BASE_LANGUAGE, report)
    check(base, report)
    indexes = {BASE_LANGUAGE: to_index(base)}
    for lang in TRANSLATIONS:
        translated = read_language(lang, report) if (CONTENT_DIR / lang).is_dir() else None
        indexes[lang] = to_index(translate(base, translated, lang, report)) if translated else indexes[BASE_LANGUAGE]

    clean_dist()
    copied = copy_static()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for lang, index in indexes.items():
        output_path(lang).write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    counts = ", ".join(f"{kind}: {len(indexes[BASE_LANGUAGE][kind])}" for kind in [*COLLECTIONS, "regionIntros", "faq"])
    print(f"Indexed content/{BASE_LANGUAGE} ({counts}) -> {output_path(BASE_LANGUAGE).relative_to(ROOT)}")
    for lang in TRANSLATIONS:
        print(f"Translated -> {output_path(lang).relative_to(ROOT)}")
    print(f"Copied {copied} static files -> {DIST_DIR.relative_to(ROOT)}/")
    if report:
        print(f"\n확인이 필요한 항목 {len(report)}개:")
        for line in report:
            print(f"  - {line}")


if __name__ == "__main__":
    main()
