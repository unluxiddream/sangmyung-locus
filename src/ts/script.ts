// 원본은 src/ts/ 폴더의 .ts 파일임. dist/js/의 script.js, korea-map.js는 `npm run build`로 자동 생성되므로 직접 고치지 말 것.

"use strict";

type Link = [label: string, href: string];
type AxisKey = "OI" | "FB" | "ER" | "SC";

interface RegionGroup {
  label: string;
  prefixes: string[];
}

interface Axis {
  letters: [string, string];
  names: [string, string];
}

interface Question {
  axis: AxisKey;
  question: string;
  answers: [letter: string, answer: string][];
}

interface NavGroup {
  number: string;
  label: string;
  href: string;
  links: Link[];
  sections: { label: string; links: Link[] }[];
}

const COLLECTIONS: CollectionKey[] = ["travel", "stay", "infoCenters", "medical"];

const REGION_GROUPS: Record<RegionKey, RegionGroup> = {
  kangwon: { label: "강원도", prefixes: ["강원"] },
  gyeongsang: { label: "경상도", prefixes: ["경상", "부산", "대구", "울산"] },
  jeolla: { label: "전라도", prefixes: ["전라", "광주"] },
  chungcheong: { label: "충청도", prefixes: ["충청", "대전", "세종"] },
};

const REGION_LINKS: [label: string, region: RegionKey][] = [
  ["강원도", "kangwon"],
  ["경상도", "gyeongsang"],
  ["전라도", "jeolla"],
  ["충청도", "chungcheong"],
];
const CURATION_REGION_TITLES: Record<RegionKey, string> = {
  kangwon: "J의 강원도",
  gyeongsang: "H의 경상도",
  chungcheong: "A의 충청도",
  jeolla: "I의 전라도",
};
const THEMES = ["쇼핑", "엔터테인먼트", "역사", "음식", "자연관광"];
const THEME_CLASSES: Record<string, string> = {
  쇼핑: "shopping",
  엔터테인먼트: "entertainment",
  역사: "history",
  음식: "food",
  자연관광: "nature",
};
const AXES: Record<AxisKey, Axis> = {
  OI: { letters: ["O", "I"], names: ["실외형", "실내형"] },
  FB: { letters: ["F", "B"], names: ["플렉스형", "가성비형"] },
  ER: { letters: ["E", "R"], names: ["실속·알찬형", "여유형"] },
  SC: { letters: ["S", "C"], names: ["고독형", "교류형"] },
};

const QUESTIONS: Question[] = [
  {
    axis: "OI",
    question: "여행지에서 더 마음이 끌리는 풍경은?",
    answers: [
      ["O", "바람과 햇살을 느끼는 해안길·숲길 산책"],
      ["I", "전시와 이야기에 집중하는 실내 공간"],
    ],
  },
  {
    axis: "OI",
    question: "비 예보가 있는 날, 나의 여행은?",
    answers: [
      ["O", "우산을 챙겨도 계획한 야외 코스를 즐긴다"],
      ["I", "박물관이나 실내 체험 코스로 바꾼다"],
    ],
  },
  {
    axis: "FB",
    question: "여행 예산을 쓸 때 더 중요하게 보는 것은?",
    answers: [
      ["F", "특별한 숙소와 기억에 남을 경험에 투자"],
      ["B", "무료 명소와 알뜰한 로컬 맛집을 찾아보기"],
    ],
  },
  {
    axis: "FB",
    question: "여행 중 마음에 드는 것을 발견하면?",
    answers: [
      ["F", "오늘을 위한 기념품이나 체험을 망설임 없이"],
      ["B", "가격과 후기를 살펴보고 만족스러운 선택을"],
    ],
  },
  {
    axis: "ER",
    question: "여행 일정을 짤 때 나다운 방식은?",
    answers: [
      ["E", "동선과 시간을 꼼꼼히 짜서 알차게"],
      ["R", "꼭 가고 싶은 곳만 정하고 나머지는 느긋하게"],
    ],
  },
  {
    axis: "ER",
    question: "예상보다 일찍 다음 장소에 도착했다면?",
    answers: [
      ["E", "근처 명소를 더 찾아 일정에 넣는다"],
      ["R", "좋은 카페나 벤치에서 충분히 쉬어 간다"],
    ],
  },
  {
    axis: "SC",
    question: "여행에서 가장 편안한 순간은?",
    answers: [
      ["S", "혼자 걷고 생각을 정리하는 조용한 시간"],
      ["C", "함께 온 사람과 추억을 나누는 시간"],
    ],
  },
  {
    axis: "SC",
    question: "낯선 동네에 도착하면 나는?",
    answers: [
      ["S", "내 페이스대로 골목을 탐색한다"],
      ["C", "현지인에게 말을 걸어 숨은 곳을 추천받는다"],
    ],
  },
];

const TYPE_TITLES: Record<"O" | "F" | "E" | "S", [string, string]> = {
  O: ["바람을 따라 걷는", "안으로 깊이 들어가는"],
  F: ["경험에 아낌없는", "알뜰한 발견을 즐기는"],
  E: ["알차게 채워 가는", "느긋하게 머무는"],
  S: ["혼자만의 리듬을 찾는", "함께 나누며 즐기는"],
};

function isRegionKey(value: string | null | undefined): value is RegionKey {
  return Boolean(value && Object.prototype.hasOwnProperty.call(REGION_GROUPS, value));
}

function isCollectionKey(value: string): value is CollectionKey {
  return (COLLECTIONS as string[]).includes(value);
}

function escapeHTML(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => (<Record<string, string>>{
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function safeURL(value: unknown): string {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function imageCandidates(place: Place): string[] {
  return [...new Set([place.cover, ...place.photos].map(safeURL).filter(Boolean))];
}

function renderImage(place: Place, alt = ""): string {
  const [cover, ...fallbacks] = imageCandidates(place);
  if (!cover) return "";
  return `<img src="${escapeHTML(cover)}" alt="${escapeHTML(alt)}" data-fallbacks="${escapeHTML(JSON.stringify(fallbacks))}" loading="lazy">`;
}

function setupImages(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>("img[data-fallbacks]").forEach((image) => {
    let fallbacks: string[];
    try {
      fallbacks = JSON.parse(image.dataset.fallbacks || "[]");
    } catch (error) {
      console.error("이미지 대체 경로를 읽지 못했습니다.", error);
      fallbacks = [];
    }

    image.addEventListener("error", () => {
      const next = fallbacks.shift();
      if (next) {
        image.src = next;
        return;
      }
      const visual = image.closest(".has-image");
      image.remove();
      visual?.classList.remove("has-image");
    });
  });
  root.querySelectorAll(".gallery img").forEach((image) => {
    image.addEventListener("error", () => image.remove());
  });
  root.querySelectorAll(".home-slide img").forEach((image) => {
    image.addEventListener("error", () => image.remove());
  });
}

function linkForPlace(place: Place): string {
  const collection = place.collection && place.collection !== "travel"
    ? `&collection=${encodeURIComponent(place.collection)}`
    : "";
  const source = place.source ? `&source=${encodeURIComponent(place.source)}` : "";
  return `place.html?id=${encodeURIComponent(place.id)}${collection}${source}`;
}

function getThemeClass(place: Place): string {
  const theme = place.themes.find((item) => THEME_CLASSES[item]);
  return theme ? `theme-${THEME_CLASSES[theme]}` : "theme-nature";
}

function renderCard(place: Place, index = 0): string {
  const aliases = place.aliases.length
    ? `<span class="card-alias">${escapeHTML(place.aliases.join(" · "))}</span>`
    : "";
  const tags = place.tags.slice(0, 4)
    .map((tag) => `<span class="tag">${escapeHTML(tag.replace(/^#/, ""))}</span>`)
    .join("");
  const picture = renderImage(place);
  return `<article class="place-card">
    <a class="card-link" href="${linkForPlace(place)}" aria-label="${escapeHTML(place.name)} 상세 보기">
      <div class="card-visual ${getThemeClass(place)}${picture ? " has-image" : ""}">${picture}<span class="visual-caption">LOCAL · ${String(index + 1).padStart(2, "0")}</span></div>
      <div class="card-body">
        <span class="card-region">${escapeHTML(place.province || place.areas[0] || "로컬 스팟")}</span>
        <div class="card-title-row"><h3 class="card-title">${escapeHTML(place.name)}</h3>${aliases}</div>
        <p class="card-info">${escapeHTML(place.info || "지역의 매력과 방문 정보를 확인해 보세요.")}</p>
        <div class="tag-list">${tags}</div>
        <div class="card-foot"><span>${escapeHTML(place.themes.slice(0, 2).join(" · ") || "LOCAL SPOT")}</span><span>자세히 보기 ↗</span></div>
      </div>
    </a>
  </article>`;
}

function renderCards(places: Place[]): string {
  if (!places.length) {
    return `<div class="empty-state"><strong>아직 이곳에 소개할 여행지가 없어요.</strong>새로운 장소가 추가되면 이곳에서 만나보실 수 있어요.</div>`;
  }
  return `<div class="card-grid">${places.map(renderCard).join("")}</div>`;
}

function renderHeader(kicker: string, title: string, description = ""): string {
  return `<div class="page-heading"><span class="eyebrow">${escapeHTML(kicker)}</span><h1>${escapeHTML(title)}</h1>${description ? `<p>${escapeHTML(description)}</p>` : ""}</div>`;
}

function renderFooter(): string {
  return `<footer class="site-footer"><span><strong>LOCUS</strong> · Local places, thoughtfully found.</span><span>여행지 정보는 방문 전 공식 홈페이지에서 확인해 주세요.</span></footer>`;
}

function navGroups(): NavGroup[] {
  const themes = THEMES.map((theme): Link => [theme, `archive.html?theme=${encodeURIComponent(theme)}`]);
  const regions = REGION_LINKS.map(([label, region]): Link => [label, `local.html?region=${region}`]);
  return [
    {
      number: "01",
      label: "여행 큐레이션",
      href: "curation.html?pick=editor",
      links: [
        ["에디터's Pick", "curation.html?pick=editor"],
        ["K-컬쳐 Pick", "curation.html?pick=kculture"],
        ["랜덤 여행지 Pick", "random.html"],
        ["여행 MBTI", "mbti.html"],
      ],
      sections: [
        { label: "", links: [
          ["에디터's Pick", "curation.html?pick=editor"],
          ["K-컬쳐 Pick", "curation.html?pick=kculture"],
        ] },
        { label: "더 알아보기", links: [["랜덤 여행지 Pick", "random.html"], ["여행 MBTI", "mbti.html"]] },
      ],
    },
    {
      number: "02",
      label: "테마 아카이브",
      href: "archive.html?theme=자연관광",
      links: themes,
      sections: [{ label: "", links: themes }],
    },
    {
      number: "03",
      label: "로컬 스팟",
      href: "local.html?region=kangwon",
      links: regions,
      sections: [{ label: "", links: regions }],
    },
    {
      number: "04",
      label: "여행 가이드",
      href: "about.html",
      links: [
        ["About", "about.html"],
        ["숙박", "stay.html"],
        ["여행자 지원", "support.html"],
        ["관광안내소", "info-center.html"],
        ["의료시설", "medical.html"],
        ["Q&A", "qna.html"],
      ],
      sections: [
        { label: "About", links: [["About", "about.html"]] },
        { label: "여행 지원", links: [
          ["숙박", "stay.html"],
          ["여행자 지원", "support.html"],
          ["관광안내소", "info-center.html"],
          ["의료시설", "medical.html"],
          ["Q&A", "qna.html"],
        ] },
      ],
    },
  ];
}

function renderTopNav(): void {
  const nav = document.querySelector(".topnav");
  if (!nav) return;
  const groups = navGroups();
  nav.innerHTML = groups.map((group) => {
    const label = group.label === "테마 아카이브"
      ? `<span class="archive-nav-label"><span>테마</span><span>아카이브</span></span>`
      : escapeHTML(group.label);
    const sections = group.sections.map((section) => `<div class="submenu-section">${section.label ? `<strong>${escapeHTML(section.label)}</strong>` : ""}${section.links.map(([itemLabel, link]) => `<a href="${link}">${escapeHTML(itemLabel)}</a>`).join("")}</div>`).join("");
    return `<div class="nav-group"><a href="${group.href}">${label}</a><div class="submenu">${sections}</div></div>`;
  }).join("");
}

const LANGUAGES: [code: string, label: string, ready: boolean][] = [
  ["KOR", "한국어", true],
  ["ENG", "English", false],
  ["JPN", "日本語", false],
  ["CHN", "中文", false],
];

function renderLanguageSwitch(): void {
  const topbar = document.querySelector(".topbar");
  if (!topbar || topbar.querySelector(".lang-switch")) return;
  const options = LANGUAGES.map(([code, label, ready]) => ready
    ? `<button type="button" class="lang-option active" aria-current="true">${label}<span>${code}</span></button>`
    : `<button type="button" class="lang-option" disabled>${label}<span>준비 중</span></button>`).join("");
  topbar.insertAdjacentHTML("beforeend", `<details class="lang-switch">
    <summary aria-label="언어 변경"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z"/></svg><b>KOR</b><i aria-hidden="true">⌄</i></summary>
    <div class="lang-menu">${options}</div>
  </details>`);
  const languageSwitch = topbar.querySelector<HTMLDetailsElement>(".lang-switch");
  if (!languageSwitch) return;
  document.addEventListener("click", (event) => {
    if (!languageSwitch.contains(event.target as Node | null)) languageSwitch.open = false;
  });
}

function randomPlaceURL(places: Place[]): string {
  if (!places.length) return "random.html";
  return linkForPlace(places[Math.floor(Math.random() * places.length)]);
}

function setRandomDestinationLink(destinationURL: string): void {
  const link = document.querySelector<HTMLAnchorElement>(".top-search");
  if (!link) return;
  link.href = destinationURL;
  link.setAttribute("aria-label", "랜덤 여행지로 이동");
  link.innerHTML = `랜덤 여행지로 이동! <span>↗</span>`;
}

function renderSidebar(): void {
  const rail = document.querySelector<HTMLElement>(".right-rail");
  if (!rail) return;
  const groups = navGroups();
  rail.innerHTML = `<a class="rail-logo" href="index.html" aria-label="LOCUS 홈">L</a><span class="rail-label">EXPLORE</span>
    ${groups.map((group) => `<details class="rail-group"><summary><i>${group.number}</i><span>${group.label}</span></summary><div class="rail-submenu">${group.links.map(([label, href]) => `<a href="${href}">${escapeHTML(label)}</a>`).join("")}</div></details>`).join("")}`;
  const existingToggle = document.querySelector<HTMLButtonElement>(".rail-toggle");
  const toggle = existingToggle ?? document.createElement("button");
  if (!existingToggle) {
    toggle.className = "rail-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "빠른 메뉴 접기");
    toggle.setAttribute("aria-expanded", "true");
    rail.after(toggle);
    toggle.addEventListener("click", () => {
      const collapsed = rail.classList.toggle("is-collapsed");
      document.body.classList.toggle("rail-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? "빠른 메뉴 펼치기" : "빠른 메뉴 접기");
      toggle.textContent = collapsed ? "‹" : "›";
    });
    toggle.textContent = "›";
  }
  rail.querySelectorAll<HTMLDetailsElement>(".rail-group").forEach((group) => {
    group.querySelector("summary")?.addEventListener("click", () => {
      if (!group.open) {
        rail.querySelectorAll<HTMLDetailsElement>(".rail-group").forEach((other) => {
          if (other !== group) other.open = false;
        });
      }
    });
  });
  if (!rail.dataset.breakpointListener) {
    window.matchMedia("(max-width: 1100px)").addEventListener("change", (event) => {
      if (event.matches && !rail.classList.contains("is-collapsed")) toggle.click();
    });
    rail.dataset.breakpointListener = "true";
  }
  if (window.matchMedia("(max-width: 1100px)").matches && !rail.dataset.initialized) {
    rail.classList.add("is-collapsed");
    document.body.classList.add("rail-collapsed");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "빠른 메뉴 펼치기");
    toggle.textContent = "‹";
  }
  rail.dataset.initialized = "true";
}

function placeMatchesGroup(place: Place, key: RegionKey): boolean {
  return REGION_GROUPS[key].prefixes.some((prefix) => place.province.startsWith(prefix));
}

const HOME_SLIDES: [src: string, alt: string][] = [
  ["https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80", "숲과 호수가 어우러진 풍경"],
  ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=80", "산과 호수가 보이는 풍경"],
  ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80", "햇살이 비치는 산 능선"],
  ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80", "새벽빛이 내려앉은 계곡"],
  ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80", "산 사이로 이어지는 길"],
];
const HOME_THEMES: [label: string, theme: string][] = [
  ["쇼핑", "쇼핑"],
  ["역사", "역사"],
  ["엔터테인먼트", "엔터테인먼트"],
  ["음식", "음식"],
  ["자연", "자연관광"],
];
const TEAM_MEMBERS: [role: string, name: string][] = [
  ["Role", "Name"],
  ["Role", "Name"],
  ["Role", "Name"],
  ["Role", "Name"],
];
const ICONS = {
  compass: `<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>`,
  map: `<path d="M3 6.5l5.5-2 7 2 5.5-2v13l-5.5 2-7-2-5.5 2z"/><path d="M8.5 4.5v13M15.5 6.5v13"/>`,
  bed: `<path d="M3 19V7M3 15h18v4M21 15v-3a2 2 0 0 0-2-2H10v5"/><circle cx="6.5" cy="11.5" r="1.8"/>`,
  pin: `<path d="M12 21s-6.5-6.2-6.5-11.3a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.7" r="2.4"/>`,
  cross: `<path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"/>`,
  chat: `<path d="M3.5 4.5h12v8.5h-6.5l-3.5 3v-3h-2z"/><path d="M15.5 8.5h5v8.5h-2v3l-3.5-3h-4.5v-4"/>`,
};
type IconName = keyof typeof ICONS;
const HOME_SERVICES: [title: string, text: string, href: string, icon: IconName][] = [
  ["숙박 시설", "지역별 숙소 찾기", "stay.html?region=kangwon", "bed"],
  ["관광 안내소", "여행 정보 확인하기", "info-center.html", "pin"],
  ["의료 시설", "병원 & 보건소 찾기", "medical.html?region=kangwon", "cross"],
  ["Q&A", "궁금한 점 해결하기", "qna.html", "chat"],
];

function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

function firstWithImage(places: Place[]): Place | null {
  return places.find((place) => imageCandidates(place).length) || null;
}

function renderPhotoTile(place: Place | null, label: string, href: string, className: string, sub = ""): string {
  const picture = place ? renderImage(place) : "";
  return `<a class="photo-tile ${className}${picture ? " has-image" : ""}" href="${href}">${picture}<span class="tile-label">${escapeHTML(label)}${sub ? `<small>${escapeHTML(sub)}</small>` : ""}</span></a>`;
}

function renderHomeTitle(title: string, extra = ""): string {
  return `<div class="home-title-row"><h2 class="home-title">${escapeHTML(title)}</h2>${extra}</div>`;
}

function renderSlider(): string {
  const slides = HOME_SLIDES.map(([src, alt], index) => `<div class="home-slide${index === 0 ? " active" : ""}" aria-hidden="${index !== 0}"><img src="${src}" alt="${escapeHTML(alt)}"></div>`).join("");
  const dots = HOME_SLIDES.map((_, index) => `<button type="button" class="slider-dot${index === 0 ? " active" : ""}" data-slide="${index}" aria-label="${index + 1}번째 사진 보기"></button>`).join("");
  return `<section class="home-slider home-bleed" aria-roledescription="carousel" aria-label="LOCUS 추천 풍경">${slides}<div class="slider-dots">${dots}</div></section>`;
}

function renderBanner(art: IconName, title: string, text: string, buttonLabel: string, href: string): string {
  return `<div class="home-banner"><span class="home-banner-art">${icon(art)}</span><div class="home-banner-copy"><h3>${escapeHTML(title)}</h3><p>${text}</p></div><a class="home-banner-button" href="${href}">${escapeHTML(buttonLabel)}</a></div>`;
}

function renderKoreaMap(places: Place[]): string {
  if (typeof KOREA_MAP === "undefined") return "";
  const paths = (regions: KoreaMapRegion[]) => regions.map((item) => `<path d="${item.d}"/>`).join("");
  const regionLinks = (Object.entries(REGION_GROUPS) as [RegionKey, RegionGroup][]).map(([key, group]) => {
    const count = places.filter((place) => placeMatchesGroup(place, key)).length;
    return `<a class="map-region" href="local.html?region=${key}" aria-label="${group.label} 로컬 스팟 ${count}곳 보기"><title>${group.label} · ${count}곳</title>${paths(KOREA_MAP.regions.filter((item) => item.region === key))}</a>`;
  }).join("");
  const labels = KOREA_MAP.labels.map((item) => `<text x="${item.x}" y="${item.y}"${item.region ? "" : ` class="is-muted"`}>${escapeHTML(item.name)}</text>`).join("");
  return `<svg class="korea-map" viewBox="0 0 ${KOREA_MAP.width} ${KOREA_MAP.height}" role="group" aria-label="대한민국 지도">
    <g class="map-disabled"><title>경기도 · 준비 중</title>${paths(KOREA_MAP.regions.filter((item) => !item.region))}</g>
    ${regionLinks}
    <g class="map-labels" aria-hidden="true">${labels}</g>
  </svg>`;
}

function renderHomeFooter(): string {
  const members = TEAM_MEMBERS.map(([role, name]) => `<div><strong>${escapeHTML(role)}</strong><span>${escapeHTML(name)}</span></div>`).join("");
  return `<footer class="home-footer home-bleed">
    <div class="home-footer-inner">
      <a class="home-footer-brand" href="index.html"><img src="image/LOCUS_logo_dark_700.png" alt="LOCUS 홈"></a>
      <div class="home-footer-team">${members}</div>
      <p class="home-footer-about">LOCAL TRAVEL PLATFORM<br>Discover Local, Experience More.<br>KOREA LOCAL CONTENT PROJECT · 2026</p>
    </div>
    <p class="home-footer-copy">Copyright © 2026 LOCUS. All rights reserved.</p>
  </footer>`;
}

function renderHome(places: Place[]): string {
  const themeTiles = HOME_THEMES.map(([label, theme]) => renderPhotoTile(
    firstWithImage(places.filter((place) => place.themes.includes(theme))),
    label,
    `archive.html?theme=${encodeURIComponent(theme)}`,
    "theme-tile",
  )).join("");
  const editorTiles = REGION_LINKS.map(([label, region]) => renderPhotoTile(
    firstWithImage(places.filter((place) => placeMatchesGroup(place, region))),
    `${CURATION_REGION_TITLES[region].charAt(0)}'s Pick`,
    `curation.html?pick=editor&region=${region}`,
    "editor-tile",
    label,
  )).join("");
  const culturePlaces = places.filter((place) => place.courses.includes("K-컬쳐"));
  const cultureTiles = culturePlaces.map((place) => renderPhotoTile(place, place.name, linkForPlace(place), "culture-tile", place.province)).join("");
  const stripButtons = `<div class="strip-buttons"><button type="button" data-scroll="-1" aria-label="이전 카드">←</button><button type="button" data-scroll="1" aria-label="다음 카드">→</button></div>`;
  const services = HOME_SERVICES.map(([title, text, href, name]) => `<a class="service-link" href="${href}"><span class="service-icon">${icon(name)}</span><strong>${escapeHTML(title)}</strong><span>${escapeHTML(text)}</span></a>`).join("");
  return `${renderSlider()}
  <section class="home-section">
    ${renderHomeTitle("에디터's Pick")}
    <div class="editor-panel">
      <nav class="editor-tiles" aria-label="에디터별 추천">${editorTiles}</nav>
      <div class="editor-panel-copy"><h3>네 명의 에디터, 네 개의 지역</h3><p>각 지역을 맡은 에디터가 직접 고른 여행지를 모았어요.<br>마음이 가는 에디터의 지역부터 둘러보세요.</p></div>
    </div>
    <div class="home-banners">
      ${renderBanner("compass", "나는 어떤 여행자일까?", "여행 MBTI로 나에게 맞는 곳 찾기<br>8개의 질문으로 나의 여행 취향을 알아보고, 잘 어울리는 로컬 스팟을 추천받아 보세요.", "테스트 시작", "mbti.html")}
      ${renderBanner("map", "지금, LOCUS와 함께 떠나보세요!", "아직 모르는 지역의 매력<br>그 시작을 LOCUS와 함께 하세요.", "랜덤 여행지 추천 →", "random.html")}
    </div>
  </section>
  <section class="home-section">
    ${renderHomeTitle("K-컬처 Pick", culturePlaces.length ? stripButtons : "")}
    ${culturePlaces.length ? `<div class="culture-strip" tabindex="0" aria-label="가로로 스크롤할 수 있는 K-컬처 여행지 목록">${cultureTiles}</div>` : renderCards([])}
  </section>
  <section class="home-section">
    ${renderHomeTitle("테마 아카이브")}
    <nav class="theme-tiles" aria-label="테마 선택">${themeTiles}</nav>
  </section>
  <section class="home-section">
    ${renderHomeTitle("로컬 스팟", `<p class="home-title-note">지도에서 지역을 눌러 로컬 스팟을 둘러보세요.</p>`)}
    <div class="map-wrap">${renderKoreaMap(places)}</div>
  </section>
  <nav class="service-links" aria-label="여행 지원">${services}</nav>
  ${renderHomeFooter()}`;
}

function setupSlider(root: ParentNode): void {
  const slider = root.querySelector<HTMLElement>(".home-slider");
  if (!slider) return;
  const slides = [...slider.querySelectorAll<HTMLElement>(".home-slide")];
  const dots = [...slider.querySelectorAll<HTMLButtonElement>(".slider-dot")];
  let current = 0;
  let timer: number | undefined;
  const show = (next: number) => {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === current);
      slide.setAttribute("aria-hidden", String(index !== current));
    });
    dots.forEach((dot, index) => dot.classList.toggle("active", index === current));
  };
  const play = () => {
    clearInterval(timer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = window.setInterval(() => show(current + 1), 5000);
  };
  dots.forEach((dot) => dot.addEventListener("click", () => {
    show(Number(dot.dataset.slide));
    play();
  }));
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", play);
  play();
}

function setupHome(root: ParentNode): void {
  setupSlider(root);
  const strip = root.querySelector<HTMLElement>(".culture-strip");
  root.querySelectorAll<HTMLElement>("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      strip?.scrollBy({ left: Number(button.dataset.scroll) * strip.clientWidth * 0.8, behavior: "smooth" });
    });
  });
}

function renderLocal(places: Place[]): string {
  const requestedRegion = new URLSearchParams(location.search).get("region");
  const key: RegionKey = isRegionKey(requestedRegion) ? requestedRegion : "jeolla";
  const group = REGION_GROUPS[key];
  const found = places.filter((place) => placeMatchesGroup(place, key));
  const provinces = key === "kangwon"
    ? [group.label]
    : key === "jeolla"
      ? ["전라북도", "전라남도"]
      : key === "gyeongsang"
        ? ["경상북도", "경상남도"]
        : ["충청북도", "충청남도"];
  const sections = provinces.map((province) => {
    const entries = found.filter((place) => place.province === province);
    return `<section class="region-section"><div class="region-section-head"><h2>${escapeHTML(province)}</h2><span class="count">${entries.length} places</span></div>${renderCards(entries)}</section>`;
  }).join("");
  return `${renderHeader("LOCAL SPOTS", `${group.label}의 여행지`, "장소를 선택하면 상세 소개와 방문 정보를 확인할 수 있어요.")}
    <nav class="region-tabs" aria-label="지역 선택">${REGION_LINKS.map(([label, slug]) => `<a class="pill${slug === key ? " active" : ""}" href="local.html?region=${slug}">${label}</a>`).join("")}</nav>
    ${sections}${renderFooter()}`;
}

function renderCuration(places: Place[]): string {
  const params = new URLSearchParams(location.search);
  const pick = params.get("pick") || "editor";
  const isCulture = pick === "kculture";
  const title = isCulture ? "K-컬쳐 Pick" : "에디터's Pick";
  const courses = [...new Set(places.flatMap((place) => place.courses))]
    .filter((course) => course && course !== "K-컬쳐" && course !== "(미정)")
    .sort((a, b) => a.localeCompare(b, "ko"));
  const course = isCulture ? "K-컬쳐" : params.get("course") || courses[0] || "(미정)";
  const requestedRegion = params.get("region");
  const region: RegionKey = isRegionKey(requestedRegion) ? requestedRegion : "kangwon";
  const group = REGION_GROUPS[region];
  const selectedCoursePlaces = course === "(미정)"
    ? places.filter((place) => place.courses.length === 0)
    : places.filter((place) => place.courses.includes(course));
  const curated = selectedCoursePlaces.filter((place) => placeMatchesGroup(place, region));
  const courseTabs = !isCulture && courses.length
    ? `<nav class="theme-pills" aria-label="코스 선택">${courses.map((item) => `<a class="pill${item === course ? " active" : ""}" href="curation.html?pick=editor&amp;course=${encodeURIComponent(item)}&amp;region=${encodeURIComponent(region)}">${escapeHTML(item === "(미정)" ? "에디터's Pick" : item)}</a>`).join("")}</nav>`
    : "";
  const regions = REGION_LINKS.map(([label, slug]) => {
    const href = isCulture
      ? `curation.html?pick=kculture&region=${slug}`
      : `curation.html?pick=editor&course=${encodeURIComponent(course)}&region=${slug}`;
    return `<a class="pill${slug === region ? " active" : ""}" href="${href}">${label}</a>`;
  }).join("");
  return `${renderHeader("TRAVEL CURATION", isCulture ? title : CURATION_REGION_TITLES[region], isCulture ? "코스에 K-컬쳐가 포함된 여행지를 먼저 고른 뒤, 지역별로 살펴보세요." : "코스를 고른 다음, 원하는 지역의 여행지를 둘러보세요.")}
    ${courseTabs}
    <nav class="region-tabs" aria-label="지역 선택">${regions}</nav>
    <div class="editor-pick"><div class="editor-note"><h2>${isCulture ? "지금, K-컬쳐를 만나는 방법" : "에디터의 큐레이션 노트"}</h2><p>${isCulture ? "전통과 오늘의 감각이 나란히 살아 있는 장소들을 둘러보세요. 역사와 예술, 로컬 문화의 결을 따라 여행을 골라볼 수 있어요." : "등록된 여행지 중 지역의 매력을 잘 보여주는 곳을 소개합니다. 새 장소가 추가되면 추천도 함께 업데이트됩니다."}</p></div>
    <div class="editor-note"><h2>다른 큐레이션</h2><p><a class="text-link" href="curation.html?pick=${isCulture ? "editor" : "kculture"}">${isCulture ? "에디터's Pick" : "K-컬쳐 Pick"} ↗</a><br><br><a class="text-link" href="random.html">랜덤 여행지 Pick ↗</a> &nbsp; <a class="text-link" href="mbti.html">여행 MBTI ↗</a></p></div></div>
    <section class="region-section"><div class="region-section-head"><h2>${escapeHTML(isCulture ? `${group.label}의 K-컬쳐` : `${course === "(미정)" ? "에디터's Pick" : course}의 ${group.label}`)}</h2><span class="count">${curated.length} places</span></div>${renderCards(curated)}</section>${renderFooter()}`;
}

function renderArchive(places: Place[]): string {
  const params = new URLSearchParams(location.search);
  const theme = params.get("theme") || "자연관광";
  const filtered = places.filter((place) => place.themes.includes(theme));
  return `${renderHeader("THEME ARCHIVE", `${theme}을 따라 만나는 여행`, "관심 있는 테마를 골라 지역별 여행지를 살펴보세요.")}
    <nav class="theme-pills" aria-label="테마 선택">${THEMES.map((name) => `<a class="pill${name === theme ? " active" : ""}" href="archive.html?theme=${encodeURIComponent(name)}">${name}</a>`).join("")}</nav>
    <section class="archive-strip-section" aria-label="${escapeHTML(theme)} 여행지">
      <div class="section-head"><div><span class="section-kicker">${filtered.length} PLACES</span><h2>${escapeHTML(theme)} 여행지</h2></div><span class="section-note">옆으로 밀어 더 둘러보세요&nbsp; →</span></div>
      ${filtered.length
        ? `<div class="archive-strip" tabindex="0" aria-label="가로로 스크롤할 수 있는 여행지 목록">${filtered.map(renderCard).join("")}</div>`
        : renderCards([])}
    </section>${renderFooter()}`;
}

function renderRandom(places: Place[]): string {
  return `${renderHeader("RANDOM DESTINATION", "랜덤 여행지 Pick", "지역을 선택하면 다음 여행지를 추천해 드려요.")}
    <section class="random-panel"><h2>어디에서 뽑아볼까요?</h2><p>선택한 지역의 여행지 중에서 골라드려요.</p>
      <div class="selector-row" id="random-regions">${REGION_LINKS.map(([label, slug], index) => `<button class="pill${index === 2 ? " active" : ""}" type="button" data-region="${slug}">${label}</button>`).join("")}</div>
      <div class="random-actions"><button class="button" id="draw-button" type="button">제비 뽑기 <span>↗</span></button><span class="count" id="draw-message" aria-live="polite"></span></div>
      <div class="draw-results" id="draw-results" aria-live="polite"></div>
    </section>${renderFooter()}`;
}

function renderQuestion(question: Question, index: number): string {
  return `<fieldset class="question"><legend><span>Q${String(index + 1).padStart(2, "0")}</span>${escapeHTML(question.question)}</legend><div class="question-options">${question.answers.map(([letter, answer], answerIndex) => {
    const id = `q${index}-${answerIndex}`;
    return `<div class="answer-option"><input id="${id}" type="radio" name="q${index}" value="${letter}" data-axis="${question.axis}" required><label for="${id}">${escapeHTML(answer)}</label></div>`;
  }).join("")}</div></fieldset>`;
}

function renderMBTI(): string {
  return `${renderHeader("TRAVEL MBTI", "나에게 맞는 여행은?", "8개의 질문으로 여행 취향을 알아보고, 잘 어울리는 로컬 스팟도 추천받아 보세요.")}
    <div class="notice-box"><strong>여행 취향 네 가지</strong><br>O 실외형 ↔ I 실내형 &nbsp;·&nbsp; F 플렉스형 ↔ B 가성비형<br>E 실속·알찬형 ↔ R 여유형 &nbsp;·&nbsp; S 고독형 ↔ C 교류형</div>
    <form class="quiz-form" id="mbti-form">${QUESTIONS.map(renderQuestion).join("")}<button class="button quiz-submit" type="submit">나의 여행 성향 확인하기 <span>↗</span></button></form>
    <section id="mbti-result" aria-live="polite"></section>${renderFooter()}`;
}

function renderAbout(): string {
  return `${renderHeader("ABOUT LOCUS", "장소와 사람을 잇는 아카이브.", "LOCUS는 지역의 여행지와 문화 정보를 한곳에 모아, 다음 목적지를 발견하도록 돕습니다.")}
    <div class="place-hero"><div class="place-hero-content"><span class="eyebrow">OUR INTENTION</span><h1>지역의 고유한 매력을<br>한곳에 모읍니다.</h1><p>장소에 깃든 이야기와 실용적인 방문 정보를 함께 소개합니다.</p></div></div>
    <section class="guide-grid">
      <article class="guide-card"><span class="guide-number">01 · 큐레이션</span><h2>장소를 기준으로 정리합니다</h2><p>지역과 테마별로 여행 정보를 분류해 원하는 목적지를 쉽게 찾을 수 있도록 합니다.</p></article>
      <article class="guide-card"><span class="guide-number">02 · 정보</span><h2>맥락과 실용성을 함께</h2><p>장소의 배경과 매력, 방문에 필요한 정보를 한 페이지에서 확인할 수 있습니다.</p></article>
      <article class="guide-card"><span class="guide-number">03 · 안내</span><h2>공식 정보를 확인해 주세요</h2><p>운영 시간과 이용 정보는 변경될 수 있으니 방문 전 공식 안내를 확인해 주세요.</p></article>
    </section><div class="feature-band"><div><span class="section-kicker">START EXPLORING</span><h2>관심 있는 장소를 찾아보세요.</h2><p>지역별 스팟과 테마 아카이브를 둘러보세요.</p></div><a class="button" href="local.html?region=jeolla">여행지 둘러보기 ↗</a></div>${renderFooter()}`;
}

function renderRegionalCollection(items: Place[], page: string, title: string, kicker: string): string {
  const params = new URLSearchParams(location.search);
  const requestedRegion = params.get("region");
  const region: RegionKey = isRegionKey(requestedRegion) ? requestedRegion : "kangwon";
  const group = REGION_GROUPS[region];
  const filtered = items.filter((place) => placeMatchesGroup(place, region));
  const provinces = [...new Set(filtered.map((place) => place.province || "기타 지역"))].sort();
  const sections = provinces.map((province) => {
    const entries = filtered.filter((place) => (place.province || "기타 지역") === province);
    return `<section class="region-section"><div class="region-section-head"><h2>${escapeHTML(province)}</h2><span class="count">${entries.length} places</span></div>${renderCards(entries)}</section>`;
  }).join("");
  return `${renderHeader(kicker, `${group.label} ${title}`, `지역을 골라 원하는 ${title} 정보를 살펴보세요.`)}
    <nav class="region-tabs" aria-label="지역 선택">${REGION_LINKS.map(([label, slug]) => `<a class="pill${slug === region ? " active" : ""}" href="${page}?region=${slug}">${label}</a>`).join("")}</nav>
    ${sections || renderCards([])}${renderFooter()}`;
}

function renderStay(items: Place[]): string {
  return renderRegionalCollection(items, "stay.html", "숙박", "LOCAL STAY");
}

function renderMedical(items: Place[]): string {
  return renderRegionalCollection(items, "medical.html", "의료시설", "MEDICAL SUPPORT");
}

function renderInfoCenters(items: Place[]): string {
  return `${renderHeader("TRAVELER SUPPORT", "관광안내소", "여행 중 필요한 지역 관광 정보를 안내하는 곳을 모았어요.")}
    ${renderCards(items)}${renderFooter()}`;
}

function renderSupport(): string {
  return `${renderHeader("TRAVELER SUPPORT", "여행 중 필요한 정보", "낯선 곳에서도 편안하게 여행할 수 있도록 유용한 안내를 모았어요.")}
    <section class="guide-grid guide-grid-4">
      <article class="guide-card"><span class="guide-number">01 · TOURIST HELP</span><h2>관광안내소</h2><p>지역별 관광안내소와 여행 정보를 확인해 보세요.</p><a href="info-center.html">관광안내소 둘러보기 ↗</a></article>
      <article class="guide-card"><span class="guide-number">02 · MEDICAL</span><h2>의료시설</h2><p>지역별 병원과 의료시설 정보를 모았어요. 응급 상황은 119에 연락하세요.</p><a href="medical.html?region=kangwon">의료시설 둘러보기 ↗</a></article>
      <article class="guide-card"><span class="guide-number">03 · RESTROOM</span><h2>공중화장실 정보</h2><p>공중화장실을 확인해 보세요.</p><a href="https://modootoilet.com/" target="_blank" rel="noopener noreferrer">화장실 찾아보기 ↗</a></article>
      <article class="guide-card"><span class="guide-number">04 · Q&A</span><h2>자주 묻는 질문</h2><p>여행지 정보 이용 방법을 확인해 보세요.</p><a href="qna.html">Q&A 보기 ↗</a></article>
    </section>
    ${renderFooter()}`;
}

function renderQna(): string {
  return `${renderHeader("Q&A", "자주 묻는 질문", "여행지 정보를 더욱 편리하게 이용하실 수 있도록 안내해 드려요.")}
    <div class="faq-list"><details class="faq-item"><summary>여행지 운영 시간과 요금은 최신 정보인가요?</summary><p>운영 시간, 휴일, 요금은 변동될 수 있으니 방문 전 해당 장소의 공식 안내를 확인해 주세요.</p></details><details class="faq-item"><summary>여행지 정보가 잘못되었거나 추가하고 싶어요.</summary><p>여행지 정보는 정확하고 유용하게 안내할 수 있도록 계속 살펴보고 있어요.</p></details><details class="faq-item"><summary>모든 지역의 여행지를 볼 수 있나요?</summary><p>다양한 지역의 장소를 계속 소개하고 있어요. 새로운 여행지가 더해질 때마다 이곳에서 만나보세요.</p></details></div>
    ${renderFooter()}`;
}

function renderMap(iframeMarkup: string): string {
  const match = iframeMarkup.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
  const src = match ? safeURL(match[1]) : "";
  if (!src) return "";
  try {
    const url = new URL(src);
    if (url.hostname !== "www.google.com" || !url.pathname.startsWith("/maps/embed")) return "";
    return `<div class="detail-map"><iframe src="${escapeHTML(url.href)}" title="장소 위치 지도" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`;
  } catch {
    return "";
  }
}

function renderPlace(index: TravelIndex): string {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const source = params.get("source");
  const collection = params.get("collection") || "travel";
  const places = isCollectionKey(collection) ? index[collection] : [];
  const place = places.find((item) => source ? item.source === source : item.id === id);
  if (!place) {
    return `${renderHeader("LOCAL SPOT", "여행지를 찾을 수 없어요.", "주소가 올바른지 확인하거나 지역별 스팟을 둘러보세요.")}<a class="button" href="local.html?region=jeolla">로컬 스팟으로 돌아가기</a>${renderFooter()}`;
  }
  document.title = `${place.name} | LOCUS`;
  const cover = imageCandidates(place).length > 0;
  const heroImage = renderImage(place, `${place.name} 대표 이미지`);
  const images = [...new Set(place.photos.map(safeURL).filter(Boolean))];
  const gallery = images.length ? `<div class="gallery">${images.map((image, index) => `<img src="${escapeHTML(image)}" alt="${escapeHTML(place.name)} 사진 ${index + 1}" loading="lazy">`).join("")}</div>` : "";
  const alias = place.aliases.length ? `<span class="card-alias">${escapeHTML(place.aliases.join(" · "))}</span>` : "";
  const rows = (<[label: string, value: FieldValue][]>[
    ["주소", place.address],
    ["문의", place.contact],
    ["휴일", place.holiday],
    ["입장료", place.admission],
    ["주차", place.parking],
    ["대중교통", place.transit],
    ["영업시간", place.hours],
    ["촬영장소", place.filmingLocations],
    ["홈페이지", place.website],
  ]).filter(([, value]) => (Array.isArray(value) ? value.some((item) => String(item).trim()) : Boolean(value))).map(([label, value]) => {
    const items = Array.isArray(value) ? value : [value];
    const formatted = items.map((item) => {
      const text = String(item ?? "").trim();
      const url = label === "홈페이지" ? safeURL(text) : "";
      return url
        ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text)}</a>`
        : escapeHTML(text);
    }).filter(Boolean).join("<br>");
    return `<tr><th scope="row">${label}</th><td>${formatted}</td></tr>`;
  }).join("");
  const body = place.description.split(/\n\s*\n/).filter(Boolean).map(escapeHTML).join("\n\n");
  const region = (Object.keys(REGION_GROUPS) as RegionKey[]).find((key) => placeMatchesGroup(place, key)) || "jeolla";
  const backLink = collection === "stay"
    ? `stay.html?region=${region}`
    : collection === "medical"
      ? `medical.html?region=${region}`
      : collection === "infoCenters"
        ? "info-center.html"
        : `local.html?region=${region}`;
  const backLabel = collection === "stay" ? "숙박" : collection === "medical" ? "의료시설" : collection === "infoCenters" ? "관광안내소" : "지역 스팟";
  return `<div class="place-detail">
    <a class="text-link" href="${backLink}">← ${backLabel}</a>
    <section class="place-hero${cover ? " has-image" : ""}">${heroImage}<div class="place-hero-content"><span class="eyebrow">${escapeHTML(place.province || place.areas[0] || "LOCAL SPOT")}</span><h1>${escapeHTML(place.name)} ${alias}</h1><p>${escapeHTML(place.info)}</p></div></section>
    ${gallery}
    <article class="description">${body || escapeHTML(place.info)}</article>
    ${renderMap(place.mapEmbed)}
    ${rows ? `<table class="detail-table"><tbody>${rows}</tbody></table>` : `<div class="empty-state">방문 정보를 준비 중입니다.</div>`}
    <div class="tag-list">${place.tags.map((tag) => `<span class="tag">${escapeHTML(tag.replace(/^#/, ""))}</span>`).join("")}</div>
    ${renderFooter()}
  </div>`;
}

function describeType(type: string): string {
  const traits = [
    type[0] === "O" ? "바깥 풍경과 자연 속에서 에너지를 얻고" : "전시와 실내 공간에서 새로운 이야기를 발견하고",
    type[1] === "F" ? "마음에 드는 경험에는 기꺼이 투자하며" : "합리적인 선택 속에서 여행의 즐거움을 찾고",
    type[2] === "E" ? "동선을 알차게 채워 많은 것을 경험하고" : "마음에 드는 곳에 머물며 여유를 누리고",
    type[3] === "S" ? "혼자만의 속도로 차분히 여행하는" : "사람들과 감상을 나누며 추억을 만드는",
  ];
  return `당신은 ${traits[0]} ${traits[1]} ${traits[2]} ${traits[3]} 여행자예요. 계획과 취향에 꼭 맞는 장소를 찾아 나만의 로컬 여행을 즐겨보세요.`;
}

function typeTitle(type: string): string {
  const labels = [
    TYPE_TITLES.O[type[0] === "O" ? 0 : 1],
    TYPE_TITLES.F[type[1] === "F" ? 0 : 1],
    TYPE_TITLES.E[type[2] === "E" ? 0 : 1],
    TYPE_TITLES.S[type[3] === "S" ? 0 : 1],
  ];
  return `${labels[0]} ${labels[1]} 여행자`;
}

function recommendPlaces(places: Place[], type: string): Place[] {
  const outdoorTerms = ["숲", "공원", "바다", "해안", "섬", "산책", "자연", "정원", "습지"];
  const indoorTerms = ["박물관", "미술관", "전시", "시장", "문화", "한옥", "체험"];
  return [...places].map((place) => {
    const text = `${place.name} ${place.info} ${place.tags.join(" ")} ${place.themes.join(" ")}`;
    let score = 0;
    const terms = type[0] === "O" ? outdoorTerms : indoorTerms;
    score += terms.filter((term) => text.includes(term)).length * 2;
    if (type[1] === "B" && /무료|공원|산책|시장/.test(`${place.admission} ${text}`)) score += 2;
    if (type[1] === "F" && place.themes.includes("엔터테인먼트")) score += 1;
    if (type[2] === "E" && place.themes.length > 1) score += 1;
    if (type[2] === "R" && /공원|바다|숲|산책|정원/.test(text)) score += 2;
    if (type[3] === "S" && /산책|숲|자연|해안/.test(text)) score += 1;
    if (type[3] === "C" && /시장|체험|축제|마을|거리/.test(text)) score += 1;
    return { place, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3).map(({ place }) => place);
}

function setupRandom(places: Place[]): void {
  const regionButtons = [...document.querySelectorAll<HTMLButtonElement>("#random-regions [data-region]")];
  const drawButton = document.querySelector<HTMLButtonElement>("#draw-button");
  const results = document.querySelector<HTMLElement>("#draw-results");
  const message = document.querySelector<HTMLElement>("#draw-message");
  if (!drawButton || !results || !message) return;
  let selectedRegion: RegionKey = "jeolla";
  regionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const region = button.dataset.region;
      if (isRegionKey(region)) selectedRegion = region;
      regionButtons.forEach((item) => item.classList.toggle("active", item === button));
      results.innerHTML = "";
      message.textContent = "";
    });
  });
  drawButton.addEventListener("click", () => {
    const available = places.filter((place) => placeMatchesGroup(place, selectedRegion));
    if (!available.length) {
      results.innerHTML = `<div class="empty-state"><strong>아직 이 지역에 소개할 여행지가 없어요.</strong>새로운 장소가 추가되면 함께 소개해 드릴게요.</div>`;
      message.textContent = "";
      return;
    }
    const pool = [...available];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
    const drawn = pool.slice(0, Math.min(3, pool.length));
    results.innerHTML = `<div class="ticket-grid">${drawn.map((place, index) => `<article class="ticket"><small>YOUR LOCAL DRAW · 0${index + 1}</small><h3>${escapeHTML(place.name)}</h3><p>${escapeHTML(place.info)}</p><a href="${linkForPlace(place)}">이 여행지 보기 ↗</a></article>`).join("")}</div>`;
    message.textContent = `${REGION_GROUPS[selectedRegion].label}에서 ${drawn.length}곳을 뽑았어요. 다시 뽑아도 좋아요!`;
  });
}

function setupMBTI(places: Place[]): void {
  const form = document.querySelector<HTMLFormElement>("#mbti-form");
  const result = document.querySelector<HTMLElement>("#mbti-result");
  if (!form || !result) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const answers = [...form.querySelectorAll<HTMLInputElement>("input:checked")];
    const letters = (Object.entries(AXES) as [AxisKey, Axis][]).map(([axis, data]) => {
      const selected = answers.filter((answer) => answer.dataset.axis === axis).map((answer) => answer.value);
      const counts = data.letters.map((letter) => selected.filter((item) => item === letter).length);
      return counts[0] === counts[1] ? selected[0] : data.letters[counts[0] > counts[1] ? 0 : 1];
    });
    const type = letters.join("");
    const suggestions = recommendPlaces(places, type);
    result.innerHTML = `<div class="result-card"><span class="result-type">YOUR TRAVEL STYLE · ${type}</span><h2>${escapeHTML(typeTitle(type))}</h2><p>${escapeHTML(describeType(type))}</p><div class="result-recommendations"><h3>이런 로컬 스팟은 어때요?</h3>${renderCards(suggestions)}</div><button class="button secondary" id="retry-quiz" type="button">다시 해보기</button></div>`;
    document.querySelector("#retry-quiz")?.addEventListener("click", () => {
      form.reset();
      result.innerHTML = "";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function start(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const page = document.body.dataset.page ?? "";
  try {
    const response = await fetch("data/travel-index.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`여행지 정보를 불러오지 못했습니다 (${response.status}).`);
    const rawIndex: unknown = await response.json();
    // 예전 형식(관광지 배열 하나)으로 된 색인 파일도 읽을 수 있게 맞춰 줌
    const index = (Array.isArray(rawIndex)
      ? { travel: rawIndex, stay: [], infoCenters: [], medical: [] }
      : rawIndex) as TravelIndex | null;
    if (!index || !COLLECTIONS.every((key) => Array.isArray(index[key]))) {
      throw new Error("여행지 정보를 읽을 수 없습니다.");
    }
    renderTopNav();
    renderLanguageSwitch();
    renderSidebar();
    const places = index.travel;
    const destinationURL = randomPlaceURL(places);
    setRandomDestinationLink(destinationURL);
    const renderers: Record<string, (() => string) | undefined> = {
      home: () => renderHome(places),
      local: () => renderLocal(places),
      curation: () => renderCuration(places),
      random: () => renderRandom(places),
      mbti: renderMBTI,
      archive: () => renderArchive(places),
      place: () => renderPlace(index),
      about: renderAbout,
      stay: () => renderStay(index.stay),
      support: renderSupport,
      infoCenter: () => renderInfoCenters(index.infoCenters),
      medical: () => renderMedical(index.medical),
      qna: renderQna,
    };
    const render = renderers[page];
    if (!render) throw new Error(`페이지를 찾을 수 없습니다: ${page}`);
    app.innerHTML = render();
    setupImages(app);
    if (page === "home") setupHome(app);
    if (page === "random") setupRandom(places);
    if (page === "mbti") setupMBTI(places);
  } catch (error) {
    console.error(error);
    app.innerHTML = `<div class="load-error"><strong>페이지를 불러오지 못했습니다.</strong><br>${escapeHTML(error instanceof Error ? error.message : error)}<br><br>프로젝트 폴더에서 <code>npm run build</code>와 <code>npm run serve</code>를 실행한 뒤 <code>http://localhost:8000</code>으로 접속해 주세요.</div>`;
  }
}

start();
