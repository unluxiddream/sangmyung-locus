// 원본은 src/ts/ 폴더의 .ts 파일임. dist/js/의 script.js, korea-map.js는 `npm run build`로 자동 생성되므로 직접 고치지 말 것.
// 화면에 보이는 문구는 i18n.ts의 t()(고정 문구)와 term()(지역·테마·코스 값)으로 언어에 맞게 바뀜.

"use strict";

type Link = [label: string, href: string];
type AxisKey = "OI" | "FB" | "ER" | "SC";

interface RegionGroup {
  label: string;
  prefixes: string[];
}

interface Axis {
  letters: [MbtiLetter, MbtiLetter];
  active: MbtiLetter;
}

interface Question {
  axis: AxisKey;
  letters: [MbtiLetter, MbtiLetter];
}

interface AxisResult {
  axis: AxisKey;
  letter: MbtiLetter;
  counts: [number, number];
  early: number;
  late: number;
  tie: "" | "lean" | "last" | "early" | "late";
}

interface NavGroup {
  number: string;
  label: string;
  href: string;
  links: Link[];
  sections: { label: string; links: Link[] }[];
}

const COLLECTIONS: CollectionKey[] = ["travel", "stay", "infoCenters", "medical"];

// label과 prefixes는 데이터(한국어 도 이름)와 맞추는 값이라 번역하지 않음. 화면에는 term(label)로 표시.
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
// 지역별 담당 에디터 이니셜 (에디터's Pick)
const CURATION_EDITORS: Record<RegionKey, string> = {
  kangwon: "J",
  gyeongsang: "H",
  chungcheong: "A",
  jeolla: "I",
};
const THEMES = ["쇼핑", "엔터테인먼트", "역사", "음식", "자연관광"];
const THEME_CLASSES: Record<string, string> = {
  쇼핑: "shopping",
  엔터테인먼트: "entertainment",
  역사: "history",
  음식: "food",
  자연관광: "nature",
};
// 결과 코드 글자 순서: O/I → F/B → E/R → S/C (예: OFES)
// active: 에너지를 밖으로 쓰는 쪽(밖으로 나가고, 아낌없이 쓰고, 많이 다니고, 사람과 어울림)
const AXES: Record<AxisKey, Axis> = {
  OI: { letters: ["O", "I"], active: "O" },
  FB: { letters: ["F", "B"], active: "F" },
  ER: { letters: ["E", "R"], active: "E" },
  SC: { letters: ["S", "C"], active: "C" },
};

// 질문 문구는 i18n.ts의 MBTI[언어].questions에 같은 순서로 있음
// letters: [A 보기, B 보기]가 각각 어느 글자인지 (질문.md의 괄호 표기 그대로)
const QUESTIONS: Question[] = [
  { axis: "ER", letters: ["R", "E"] },
  { axis: "FB", letters: ["F", "B"] },
  { axis: "OI", letters: ["O", "I"] },
  { axis: "ER", letters: ["E", "R"] },
  { axis: "SC", letters: ["S", "C"] },
  { axis: "OI", letters: ["O", "I"] },
  { axis: "FB", letters: ["F", "B"] },
  { axis: "SC", letters: ["C", "S"] },
];

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

// 태그·별칭은 한국어로만 작성되어 있어 한국어 화면에서만 보여줌
function localTags(place: Place): string[] {
  return LANG === "ko" ? place.tags : [];
}

function localAliases(place: Place): string[] {
  return LANG === "ko" ? place.aliases : [];
}

type ImageSource = Pick<Place, "cover" | "photos">;

function imageCandidates(place: ImageSource): string[] {
  return [...new Set([place.cover, ...place.photos].map(safeURL).filter(Boolean))];
}

// 장소 사진은 대부분 외부 블로그 주소임. 네이버 블로그(pstatic.net) 등은 다른 사이트에서 불러오면
// 차단(403)하므로, 어느 사이트에서 요청했는지(Referer)를 보내지 않도록 모든 장소 사진에 붙임.
const EXTERNAL_IMAGE = `referrerpolicy="no-referrer"`;

function renderImage(place: ImageSource, alt = ""): string {
  const [cover, ...fallbacks] = imageCandidates(place);
  if (!cover) return "";
  return `<img src="${escapeHTML(cover)}" alt="${escapeHTML(alt)}" data-fallbacks="${escapeHTML(JSON.stringify(fallbacks))}" loading="lazy" ${EXTERNAL_IMAGE}>`;
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
  const aliasList = localAliases(place);
  const aliases = aliasList.length
    ? `<span class="card-alias">${escapeHTML(aliasList.join(" · "))}</span>`
    : "";
  const tags = localTags(place).slice(0, 4)
    .map((tag) => `<span class="tag">${escapeHTML(tag.replace(/^#/, ""))}</span>`)
    .join("");
  const picture = renderImage(place);
  return `<article class="place-card">
    <a class="card-link" href="${linkForPlace(place)}" aria-label="${escapeHTML(t("cardDetail", { name: place.name }))}">
      <div class="card-visual ${getThemeClass(place)}${picture ? " has-image" : ""}">${picture}<span class="visual-caption">LOCAL · ${String(index + 1).padStart(2, "0")}</span></div>
      <div class="card-body">
        <span class="card-region">${escapeHTML(term(place.province || place.areas[0] || "") || t("localSpot"))}</span>
        <div class="card-title-row"><h3 class="card-title">${escapeHTML(place.name)}</h3>${aliases}</div>
        <p class="card-info">${escapeHTML(place.info || t("cardInfoFallback"))}</p>
        <div class="tag-list">${tags}</div>
        <div class="card-foot"><span>${escapeHTML(place.themes.slice(0, 2).map(term).join(" · ") || "LOCAL SPOT")}</span><span>${t("cardMore")}</span></div>
      </div>
    </a>
  </article>`;
}

function renderEmpty(title = t("emptyTitle"), text = t("emptyText")): string {
  return `<div class="empty-state"><strong>${escapeHTML(title)}</strong>${escapeHTML(text)}</div>`;
}

function renderCards(places: Place[]): string {
  if (!places.length) return renderEmpty();
  return `<div class="card-grid">${places.map(renderCard).join("")}</div>`;
}

function renderHeader(kicker: string, title: string, description = ""): string {
  return `<div class="page-heading"><span class="eyebrow">${escapeHTML(kicker)}</span><h1>${escapeHTML(title)}</h1>${description ? `<p>${escapeHTML(description)}</p>` : ""}</div>`;
}

function renderFooter(): string {
  return `<footer class="site-footer"><span><strong>LOCUS</strong> · Local places, thoughtfully found.</span><span>${escapeHTML(t("footerNote"))}</span></footer>`;
}

function renderSectionHead(title: string, count: number): string {
  return `<div class="region-section-head"><h2>${escapeHTML(title)}</h2><span class="count">${escapeHTML(t("placesCount", { count }))}</span></div>`;
}

function navGroups(): NavGroup[] {
  const themes = THEMES.map((theme): Link => [term(theme), `archive.html?theme=${encodeURIComponent(theme)}`]);
  const regions = REGION_LINKS.map(([label, region]): Link => [term(label), `local.html?region=${region}`]);
  const curation: Link[] = [
    [t("editorPick"), "curation.html?pick=editor"],
    [t("kculturePick"), "curation.html?pick=kculture"],
  ];
  const explore: Link[] = [[t("randomPick"), "random.html"], [t("travelMbti"), "mbti.html"]];
  const guide: Link[] = [
    [t("stay"), "stay.html"],
    [t("support"), "support.html"],
    [t("infoCenter"), "info-center.html?region=kangwon"],
    [t("medical"), "medical.html"],
    [t("qna"), "qna.html"],
  ];
  return [
    {
      number: "01",
      label: t("navCuration"),
      href: "curation.html?pick=editor",
      links: [...curation, ...explore],
      sections: [{ label: "", links: curation }, { label: t("moreToExplore"), links: explore }],
    },
    {
      number: "02",
      label: t("navArchive"),
      href: "archive.html?theme=자연관광",
      links: themes,
      sections: [{ label: "", links: themes }],
    },
    {
      number: "03",
      label: t("navLocal"),
      href: "local.html?region=kangwon",
      links: regions,
      sections: [{ label: "", links: regions }],
    },
    {
      number: "04",
      label: t("navGuide"),
      href: "about.html",
      links: [[t("about"), "about.html"], ...guide],
      sections: [
        { label: "About", links: [[t("about"), "about.html"]] },
        { label: t("travelSupport"), links: guide },
      ],
    },
  ];
}

function renderTopNav(): void {
  const nav = document.querySelector(".topnav");
  if (!nav) return;
  const groups = navGroups();
  nav.innerHTML = groups.map((group) => {
    // "테마 아카이브"는 좁은 화면에서 두 줄로 나뉘도록 단어별로 감쌈
    const label = group.number === "02"
      ? `<span class="archive-nav-label">${group.label.split(" ").map((word) => `<span>${escapeHTML(word)}</span>`).join("")}</span>`
      : escapeHTML(group.label);
    const sections = group.sections.map((section) => `<div class="submenu-section">${section.label ? `<strong>${escapeHTML(section.label)}</strong>` : ""}${section.links.map(([itemLabel, link]) => `<a href="${link}">${escapeHTML(itemLabel)}</a>`).join("")}</div>`).join("");
    return `<div class="nav-group"><a href="${group.href}">${label}</a><div class="submenu">${sections}</div></div>`;
  }).join("");
}

function renderLanguageSwitch(): void {
  const topbar = document.querySelector(".topbar");
  if (!topbar || topbar.querySelector(".lang-switch")) return;
  const current = LANGUAGES.find((item) => item.lang === LANG) ?? LANGUAGES[0];
  const options = LANGUAGES.map((item) => item.lang === LANG
    ? `<button type="button" class="lang-option active" aria-current="true" data-lang="${item.lang}">${item.label}<span>${item.code}</span></button>`
    : `<button type="button" class="lang-option" data-lang="${item.lang}" lang="${item.lang}">${item.label}<span>${item.code}</span></button>`).join("");
  topbar.insertAdjacentHTML("beforeend", `<details class="lang-switch">
    <summary aria-label="${escapeHTML(t("langChange"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z"/></svg><b>${current.code}</b><i aria-hidden="true">⌄</i></summary>
    <div class="lang-menu">${options}</div>
  </details>`);
  const languageSwitch = topbar.querySelector<HTMLDetailsElement>(".lang-switch");
  if (!languageSwitch) return;
  languageSwitch.querySelectorAll<HTMLButtonElement>(".lang-option").forEach((button) => {
    button.addEventListener("click", () => {
      const lang = button.dataset.lang;
      if (isLang(lang) && lang !== LANG) setLanguage(lang);
      languageSwitch.open = false;
    });
  });
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
  link.setAttribute("aria-label", t("randomGo"));
  link.innerHTML = `${escapeHTML(t("randomGo"))} <span>↗</span>`;
}

function setStaticLabels(): void {
  document.querySelectorAll<HTMLAnchorElement>(".brand").forEach((brand) => brand.setAttribute("aria-label", t("homeLabel")));
}

function renderSidebar(): void {
  const rail = document.querySelector<HTMLElement>(".right-rail");
  if (!rail) return;
  const groups = navGroups();
  rail.innerHTML = `<a class="rail-logo" href="index.html" aria-label="${escapeHTML(t("homeLabel"))}">L</a><span class="rail-label">EXPLORE</span>
    ${groups.map((group) => `<details class="rail-group"><summary><i>${group.number}</i><span>${escapeHTML(group.label)}</span></summary><div class="rail-submenu">${group.links.map(([label, href]) => `<a href="${href}">${escapeHTML(label)}</a>`).join("")}</div></details>`).join("")}`;
  const existingToggle = document.querySelector<HTMLButtonElement>(".rail-toggle");
  const toggle = existingToggle ?? document.createElement("button");
  if (!existingToggle) {
    toggle.className = "rail-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", t("railCollapse"));
    toggle.setAttribute("aria-expanded", "true");
    rail.after(toggle);
    toggle.addEventListener("click", () => {
      const collapsed = rail.classList.toggle("is-collapsed");
      document.body.classList.toggle("rail-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? t("railExpand") : t("railCollapse"));
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
    toggle.setAttribute("aria-label", t("railExpand"));
    toggle.textContent = "‹";
  }
  rail.dataset.initialized = "true";
}

function placeMatchesGroup(place: Place, key: RegionKey): boolean {
  return REGION_GROUPS[key].prefixes.some((prefix) => place.province.startsWith(prefix));
}

const HOME_SLIDES: [src: string, alt: UIKey][] = [
  ["https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80", "slide1"],
  ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=80", "slide2"],
  ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80", "slide3"],
  ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80", "slide4"],
  ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80", "slide5"],
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
const HOME_SERVICES: [title: UIKey, text: UIKey, href: string, icon: IconName][] = [
  ["serviceStay", "serviceStayText", "stay.html?region=kangwon", "bed"],
  ["serviceInfo", "serviceInfoText", "info-center.html?region=kangwon", "pin"],
  ["serviceMedical", "serviceMedicalText", "medical.html?region=kangwon", "cross"],
  ["qna", "serviceQnaText", "qna.html", "chat"],
];

function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

function firstWithImage(places: Place[]): Place | null {
  return places.find((place) => imageCandidates(place).length) || null;
}

function renderPhotoTile(place: ImageSource | null, label: string, href: string, className: string, sub = ""): string {
  const picture = place ? renderImage(place) : "";
  return `<a class="photo-tile ${className}${picture ? " has-image" : ""}" href="${href}">${picture}<span class="tile-label">${escapeHTML(label)}${sub ? `<small>${escapeHTML(sub)}</small>` : ""}</span></a>`;
}

function renderHomeTitle(title: string, extra = ""): string {
  return `<div class="home-title-row"><h2 class="home-title">${escapeHTML(title)}</h2>${extra}</div>`;
}

function renderSlider(): string {
  const slides = HOME_SLIDES.map(([src, alt], index) => `<div class="home-slide${index === 0 ? " active" : ""}" aria-hidden="${index !== 0}"><img src="${src}" alt="${escapeHTML(t(alt))}"></div>`).join("");
  const dots = HOME_SLIDES.map((_, index) => `<button type="button" class="slider-dot${index === 0 ? " active" : ""}" data-slide="${index}" aria-label="${escapeHTML(t("slideDot", { n: index + 1 }))}"></button>`).join("");
  return `<section class="home-slider home-bleed" aria-roledescription="carousel" aria-label="${escapeHTML(t("slider"))}">${slides}<div class="slider-dots">${dots}</div></section>`;
}

// text는 <br>이 든 사전 문구라 HTML 그대로 넣음
function renderBanner(art: IconName, title: string, text: string, buttonLabel: string, href: string): string {
  return `<div class="home-banner"><span class="home-banner-art">${icon(art)}</span><div class="home-banner-copy"><h3>${escapeHTML(title)}</h3><p>${text}</p></div><a class="home-banner-button" href="${href}">${escapeHTML(buttonLabel)}</a></div>`;
}

function renderKoreaMap(places: Place[]): string {
  if (typeof KOREA_MAP === "undefined") return "";
  const paths = (regions: KoreaMapRegion[]) => regions.map((item) => `<path d="${item.d}"/>`).join("");
  const regionLinks = (Object.entries(REGION_GROUPS) as [RegionKey, RegionGroup][]).map(([key, group]) => {
    const count = places.filter((place) => placeMatchesGroup(place, key)).length;
    const region = term(group.label);
    return `<a class="map-region" href="local.html?region=${key}" aria-label="${escapeHTML(t("mapRegionLink", { region, count }))}"><title>${escapeHTML(t("mapRegionTitle", { region, count }))}</title>${paths(KOREA_MAP.regions.filter((item) => item.region === key))}</a>`;
  }).join("");
  const labels = KOREA_MAP.labels.map((item) => `<text x="${item.x}" y="${item.y}"${item.region ? "" : ` class="is-muted"`}>${escapeHTML(term(item.name))}</text>`).join("");
  return `<svg class="korea-map" viewBox="0 0 ${KOREA_MAP.width} ${KOREA_MAP.height}" role="group" aria-label="${escapeHTML(t("mapAria"))}">
    <g class="map-disabled"><title>${escapeHTML(t("mapComingSoon"))}</title>${paths(KOREA_MAP.regions.filter((item) => !item.region))}</g>
    ${regionLinks}
    <g class="map-labels" aria-hidden="true">${labels}</g>
  </svg>`;
}

function renderHomeFooter(): string {
  const members = TEAM_MEMBERS.map(([role, name]) => `<div><strong>${escapeHTML(role)}</strong><span>${escapeHTML(name)}</span></div>`).join("");
  return `<footer class="home-footer home-bleed">
    <div class="home-footer-inner">
      <a class="home-footer-brand" href="index.html"><img src="image/LOCUS_logo_dark_700.png" alt="${escapeHTML(t("homeLabel"))}"></a>
      <div class="home-footer-team">${members}</div>
      <p class="home-footer-about">LOCAL TRAVEL PLATFORM<br>Discover Local, Experience More.<br>KOREA LOCAL CONTENT PROJECT · 2026</p>
    </div>
    <p class="home-footer-copy">Copyright © 2026 LOCUS. All rights reserved.</p>
  </footer>`;
}

function renderHome(index: TravelIndex): string {
  const places = index.travel;
  const themeTiles = HOME_THEMES.map(([label, theme]) => renderPhotoTile(
    firstWithImage(places.filter((place) => place.themes.includes(theme))),
    term(label),
    `archive.html?theme=${encodeURIComponent(theme)}`,
    "theme-tile",
  )).join("");
  const editorTiles = REGION_LINKS.map(([label, region]) => renderPhotoTile(
    editorPosts(index, region).find((post) => imageCandidates(post).length)
      ?? firstWithImage(places.filter((place) => placeMatchesGroup(place, region))),
    t("editorTile", { initial: CURATION_EDITORS[region] }),
    `curation.html?pick=editor&region=${region}`,
    "editor-tile",
    term(label),
  )).join("");
  const culturePlaces = places.filter((place) => place.courses.includes("K-컬쳐"));
  const cultureTiles = culturePlaces.map((place) => renderPhotoTile(place, place.name, linkForPlace(place), "culture-tile", term(place.province))).join("");
  const stripButtons = `<div class="strip-buttons"><button type="button" data-scroll="-1" aria-label="${escapeHTML(t("prevCard"))}">←</button><button type="button" data-scroll="1" aria-label="${escapeHTML(t("nextCard"))}">→</button></div>`;
  const services = HOME_SERVICES.map(([title, text, href, name]) => `<a class="service-link" href="${href}"><span class="service-icon">${icon(name)}</span><strong>${escapeHTML(t(title))}</strong><span>${escapeHTML(t(text))}</span></a>`).join("");
  return `${renderSlider()}
  <section class="home-section">
    ${renderHomeTitle(t("editorPick"))}
    <div class="editor-panel">
      <nav class="editor-tiles" aria-label="${escapeHTML(t("editorPicksBy"))}">${editorTiles}</nav>
      <div class="editor-panel-copy"><h3>${escapeHTML(t("editorPanelTitle"))}</h3><p>${t("editorPanelText")}</p></div>
    </div>
    <div class="home-banners">
      ${renderBanner("compass", t("mbtiBannerTitle"), t("mbtiBannerText"), t("mbtiBannerButton"), "mbti.html")}
      ${renderBanner("map", t("randomBannerTitle"), t("randomBannerText"), t("randomBannerButton"), "random.html")}
    </div>
  </section>
  <section class="home-section">
    ${renderHomeTitle(t("homeKculture"), culturePlaces.length ? stripButtons : "")}
    ${culturePlaces.length ? `<div class="culture-strip" tabindex="0" aria-label="${escapeHTML(t("cultureStrip"))}">${cultureTiles}</div>` : renderCards([])}
  </section>
  <section class="home-section">
    ${renderHomeTitle(t("navArchive"))}
    <nav class="theme-tiles" aria-label="${escapeHTML(t("themeSelect"))}">${themeTiles}</nav>
  </section>
  <section class="home-section">
    ${renderHomeTitle(t("navLocal"), `<p class="home-title-note">${escapeHTML(t("mapNote"))}</p>`)}
    <div class="map-wrap">${renderKoreaMap(places)}</div>
  </section>
  <nav class="service-links" aria-label="${escapeHTML(t("travelSupport"))}">${services}</nav>
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

function renderRegionTabs(active: RegionKey, href: (region: RegionKey) => string): string {
  return `<nav class="region-tabs" aria-label="${escapeHTML(t("regionSelect"))}">${REGION_LINKS.map(([label, slug]) => `<a class="pill${slug === active ? " active" : ""}" href="${href(slug)}">${escapeHTML(term(label))}</a>`).join("")}</nav>`;
}

function renderRegionIntro(intro: RegionIntro | undefined): string {
  if (!intro?.description) return "";
  const paragraphs = intro.description.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    .map((line) => `<p>${escapeHTML(line)}</p>`).join("");
  const image = safeURL(intro.cover);
  return `<section class="region-intro">
    <div class="region-intro-text">${paragraphs}</div>
    ${image ? `<img class="region-intro-image" src="${escapeHTML(image)}" alt="" loading="lazy" ${EXTERNAL_IMAGE}>` : ""}
  </section>`;
}

function renderLocal(places: Place[], intros: TravelIndex["regionIntros"]): string {
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
    return `<section class="region-section">${renderSectionHead(term(province), entries.length)}${renderCards(entries)}</section>`;
  }).join("");
  const intro = intros[key];
  const lead = intro?.info ? String(intro.info) : t("localLead");
  return `${renderHeader("LOCAL SPOTS", t("localTitle", { region: term(group.label) }), lead)}
    ${renderRegionIntro(intro)}
    ${renderRegionTabs(key, (slug) => `local.html?region=${slug}`)}
    ${sections}${renderFooter()}`;
}

// ---- 에디터's Pick: Markdown 블로그 글 ----
// HTML 태그는 그대로 글자로 보이고(실행 안 됨), 아래 문법만 화면 요소로 바뀜:
// # 제목, 문단(빈 줄), 줄바꿈(Enter), **굵게**, *기울임*, `코드`, - 목록, 1. 목록, > 인용, ---,
// ![설명](이미지 주소), [글자](링크), [[장소명]] 장소 링크, ![[장소명]] 방문 정보 박스

function findPlace(index: TravelIndex, name: string): Place | null {
  const key = name.normalize("NFC").trim();
  for (const collection of COLLECTIONS) {
    const place = index[collection].find((item) => item.id === key);
    if (place) return place;
  }
  return null;
}

function renderPlaceBox(index: TravelIndex, name: string): string {
  const place = findPlace(index, name);
  if (!place) return `<p class="post-place-missing">📍 ${escapeHTML(name)}</p>`;
  const rows = renderInfoRows(place);
  return `<aside class="post-place">
    <a class="post-place-head" href="${linkForPlace(place)}"><span>${escapeHTML(t("placeBoxTitle", { name: place.name }))}</span><span class="post-place-more">${t("cardMore")}</span></a>
    ${rows ? `<table class="detail-table"><tbody>${rows}</tbody></table>` : ""}
  </aside>`;
}

function renderInline(text: string, index: TravelIndex): string {
  const pattern = /!?\[\[([^\]|#]+)(?:[|#]([^\]]*))?\]\]|!\[([^\]]*)\]\(\s*(\S+?)\s*(?:"[^"]*")?\)|\[([^\]]+)\]\(\s*(\S+?)\s*\)|\*\*(.+?)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`/g;
  let html = "";
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    html += escapeHTML(text.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;
    const [whole, wiki, wikiLabel, imageAlt, imageURL, linkText, linkURL, bold, italic, code] = match;
    if (wiki !== undefined) {
      const place = findPlace(index, wiki);
      const label = escapeHTML((wikiLabel || place?.name || wiki).trim());
      html += place ? `<a class="post-place-link" href="${linkForPlace(place)}">${label}</a>` : label;
    } else if (imageURL !== undefined) {
      const url = safeURL(imageURL);
      html += url ? `<img class="post-inline-image" src="${escapeHTML(url)}" alt="${escapeHTML(imageAlt)}" loading="lazy" ${EXTERNAL_IMAGE}>` : "";
    } else if (linkURL !== undefined) {
      const url = safeURL(linkURL);
      html += url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${renderInline(linkText, index)}</a>` : renderInline(linkText, index);
    } else if (bold !== undefined) {
      html += `<strong>${renderInline(bold, index)}</strong>`;
    } else if (italic !== undefined) {
      html += `<em>${renderInline(italic, index)}</em>`;
    } else if (code !== undefined) {
      html += `<code>${escapeHTML(code)}</code>`;
    } else {
      html += escapeHTML(whole);
    }
  }
  return html + escapeHTML(text.slice(last));
}

function renderMarkdown(markdown: string, index: TravelIndex): string {
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  const flush = () => {
    // 문단 안의 줄바꿈(Enter)은 Obsidian 미리보기처럼 그대로 줄바꿈으로 보여줌
    if (paragraph.length) blocks.push(`<p>${paragraph.map((line) => renderInline(line, index)).join("<br>")}</p>`);
    if (list) blocks.push(`<${list.ordered ? "ol" : "ul"}>${list.items.map((item) => `<li>${renderInline(item, index)}</li>`).join("")}</${list.ordered ? "ol" : "ul"}>`);
    if (quote.length) blocks.push(`<blockquote>${quote.map((line) => renderInline(line, index)).join("<br>")}</blockquote>`);
    paragraph = [];
    list = null;
    quote = [];
  };
  for (const raw of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    const embed = line.match(/^!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]$/);
    const image = line.match(/^!\[([^\]]*)\]\(\s*(\S+?)\s*(?:"[^"]*")?\)$/);
    const bullet = line.match(/^[-*+]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const quoted = line.match(/^>\s?(.*)$/);
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flush();
      blocks.push("<hr>");
    } else if (heading) {
      // 페이지 제목(h1)은 "I의 전라도"이므로 글 속 제목은 한 단계씩 낮춤
      flush();
      const level = Math.min(heading[1].length + 1, 6);
      blocks.push(`<h${level}>${renderInline(heading[2], index)}</h${level}>`);
    } else if (embed) {
      flush();
      blocks.push(renderPlaceBox(index, embed[1]));
    } else if (image) {
      flush();
      const url = safeURL(image[2]);
      if (url) blocks.push(`<figure class="post-figure"><img src="${escapeHTML(url)}" alt="${escapeHTML(image[1])}" loading="lazy" ${EXTERNAL_IMAGE}></figure>`);
    } else if (bullet || numbered) {
      const ordered = !bullet;
      if (paragraph.length || quote.length || (list && list.ordered !== ordered)) flush();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1]);
    } else {
      if (list || quote.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks.join("\n");
}

function renderEditorSwitch(active: RegionKey): string {
  return `<nav class="editor-switch" aria-label="${escapeHTML(t("editorSelect"))}">${REGION_LINKS.map(([label, region]) => `<a class="pill${region === active ? " active" : ""}" href="curation.html?pick=editor&amp;region=${region}"${region === active ? ` aria-current="page"` : ""}>${escapeHTML(t("editorTile", { initial: CURATION_EDITORS[region] }))} <span>${escapeHTML(term(label))}</span></a>`).join("")}</nav>`;
}

function editorPosts(index: TravelIndex, region: RegionKey): EditorPick[] {
  return index.editorPicks.filter((post) => post.editor === CURATION_EDITORS[region]);
}

function renderEditorPick(index: TravelIndex): string {
  const params = new URLSearchParams(location.search);
  const requestedRegion = params.get("region");
  const region: RegionKey = isRegionKey(requestedRegion) ? requestedRegion : "kangwon";
  const posts = editorPosts(index, region);
  const post = posts.find((item) => item.id === params.get("post")) ?? posts[0];
  const title = t("curationTitle", { initial: CURATION_EDITORS[region], region: term(REGION_GROUPS[region].label) });
  if (post) document.title = `${post.name} | LOCUS`;
  const others = posts.length > 1
    ? `<nav class="post-list" aria-label="${escapeHTML(t("editorOtherPosts"))}">${posts.map((item) => `<a class="pill${item === post ? " active" : ""}" href="curation.html?pick=editor&amp;region=${region}&amp;post=${encodeURIComponent(item.id)}">${escapeHTML(item.name)}</a>`).join("")}</nav>`
    : "";
  const body = post
    ? `<article class="post">${renderMarkdown(post.markdown, index)}</article>`
    : renderEmpty(t("editorEmptyTitle"), t("editorEmptyText"));
  return `${renderEditorSwitch(region)}
    ${renderHeader("EDITOR'S PICK", title, post?.info ? String(post.info) : t("curationEditorLead"))}
    ${others}
    ${body}
    <div class="editor-switch-bottom">${renderEditorSwitch(region)}</div>${renderFooter()}`;
}

function renderCulturePick(places: Place[]): string {
  const params = new URLSearchParams(location.search);
  const requestedRegion = params.get("region");
  const region: RegionKey = isRegionKey(requestedRegion) ? requestedRegion : "kangwon";
  const regionName = term(REGION_GROUPS[region].label);
  const curated = places.filter((place) => place.courses.includes("K-컬쳐") && placeMatchesGroup(place, region));
  return `${renderHeader("TRAVEL CURATION", t("kculturePick"), t("curationCultureLead"))}
    ${renderRegionTabs(region, (slug) => `curation.html?pick=kculture&region=${slug}`)}
    <div class="editor-pick"><div class="editor-note"><h2>${escapeHTML(t("cultureNoteTitle"))}</h2><p>${escapeHTML(t("cultureNoteText"))}</p></div>
    <div class="editor-note"><h2>${escapeHTML(t("otherCuration"))}</h2><p><a class="text-link" href="curation.html?pick=editor">${escapeHTML(t("editorPick"))} ↗</a><br><br><a class="text-link" href="random.html">${escapeHTML(t("randomPick"))} ↗</a> &nbsp; <a class="text-link" href="mbti.html">${escapeHTML(t("travelMbti"))} ↗</a></p></div></div>
    <section class="region-section">${renderSectionHead(t("cultureSectionTitle", { region: regionName }), curated.length)}${renderCards(curated)}</section>${renderFooter()}`;
}

function renderCuration(index: TravelIndex): string {
  const pick = new URLSearchParams(location.search).get("pick") || "editor";
  return pick === "kculture" ? renderCulturePick(index.travel) : renderEditorPick(index);
}

function renderArchive(places: Place[]): string {
  const params = new URLSearchParams(location.search);
  const theme = params.get("theme") || "자연관광";
  const themeName = term(theme);
  const filtered = places.filter((place) => place.themes.includes(theme));
  return `${renderHeader("THEME ARCHIVE", t("archiveTitle", { theme: themeName }), t("archiveLead"))}
    <nav class="theme-pills" aria-label="${escapeHTML(t("themeSelect"))}">${THEMES.map((name) => `<a class="pill${name === theme ? " active" : ""}" href="archive.html?theme=${encodeURIComponent(name)}">${escapeHTML(term(name))}</a>`).join("")}</nav>
    <section class="archive-strip-section" aria-label="${escapeHTML(t("archivePlaces", { theme: themeName }))}">
      <div class="section-head"><div><span class="section-kicker">${filtered.length} PLACES</span><h2>${escapeHTML(t("archivePlaces", { theme: themeName }))}</h2></div><span class="section-note">${t("swipeMore")}</span></div>
      ${filtered.length
        ? `<div class="archive-strip" tabindex="0" aria-label="${escapeHTML(t("stripAria"))}">${filtered.map(renderCard).join("")}</div>`
        : renderCards([])}
    </section>${renderFooter()}`;
}

function renderRandom(): string {
  return `${renderHeader("RANDOM DESTINATION", t("randomPick"), t("randomLead"))}
    <section class="random-panel"><h2>${escapeHTML(t("randomPanelTitle"))}</h2><p>${escapeHTML(t("randomPanelText"))}</p>
      <div class="selector-row" id="random-regions">${REGION_LINKS.map(([label, slug], index) => `<button class="pill${index === 2 ? " active" : ""}" type="button" data-region="${slug}">${escapeHTML(term(label))}</button>`).join("")}</div>
      <div class="random-actions"><button class="button" id="draw-button" type="button">${escapeHTML(t("drawButton"))} <span>↗</span></button><span class="count" id="draw-message" aria-live="polite"></span></div>
      <div class="draw-results" id="draw-results" aria-live="polite"></div>
    </section>${renderFooter()}`;
}

function renderQuestion(question: Question, index: number): string {
  const { text, options } = MBTI[LANG].questions[index];
  return `<fieldset class="question"><legend><span>Q${String(index + 1).padStart(2, "0")}</span>${escapeHTML(text)}</legend><div class="question-options">${options.map(([head, body], answerIndex) => {
    const id = `q${index}-${answerIndex}`;
    return `<div class="answer-option"><input id="${id}" type="radio" name="q${index}" value="${question.letters[answerIndex]}" required><label for="${id}"><strong>${["A", "B"][answerIndex]}. ${escapeHTML(head)}</strong>${escapeHTML(body)}</label></div>`;
  }).join("")}</div></fieldset>`;
}

function renderMBTI(): string {
  return `${renderHeader("TRAVEL MBTI", t("mbtiTitle"), t("mbtiLead"))}
    <div class="quiz-story">${MBTI[LANG].intro.map((line) => `<p>${escapeHTML(line)}</p>`).join("")}</div>
    <div class="notice-box">${t("mbtiNotice")}</div>
    <form class="quiz-form" id="mbti-form">${QUESTIONS.map(renderQuestion).join("")}<button class="button quiz-submit" type="submit">${escapeHTML(t("mbtiSubmit"))} <span>↗</span></button></form>
    <section id="mbti-result" aria-live="polite"></section>${renderFooter()}`;
}

function renderAbout(): string {
  const cards = ([1, 2, 3] as const).map((n) => `<article class="guide-card"><span class="guide-number">${escapeHTML(t(`about${n}Label`))}</span><h2>${escapeHTML(t(`about${n}Title`))}</h2><p>${escapeHTML(t(`about${n}Text`))}</p></article>`).join("\n      ");
  return `${renderHeader("ABOUT LOCUS", t("aboutTitle"), t("aboutLead"))}
    <div class="place-hero"><div class="place-hero-content"><span class="eyebrow">OUR INTENTION</span><h1>${t("aboutHeroTitle")}</h1><p>${escapeHTML(t("aboutHeroText"))}</p></div></div>
    <section class="guide-grid">
      ${cards}
    </section><div class="feature-band"><div><span class="section-kicker">START EXPLORING</span><h2>${escapeHTML(t("aboutBandTitle"))}</h2><p>${escapeHTML(t("aboutBandText"))}</p></div><a class="button" href="local.html?region=jeolla">${escapeHTML(t("aboutBandButton"))}</a></div>${renderFooter()}`;
}

function renderRegionalCollection(items: Place[], page: string, title: string, kicker: string): string {
  const params = new URLSearchParams(location.search);
  const requestedRegion = params.get("region");
  const region: RegionKey = isRegionKey(requestedRegion) ? requestedRegion : "kangwon";
  const filtered = items.filter((place) => placeMatchesGroup(place, region));
  const provinces = [...new Set(filtered.map((place) => place.province || ""))].sort();
  const sections = provinces.map((province) => {
    const entries = filtered.filter((place) => (place.province || "") === province);
    return `<section class="region-section">${renderSectionHead(province ? term(province) : t("otherArea"), entries.length)}${renderCards(entries)}</section>`;
  }).join("");
  return `${renderHeader(kicker, t("regionalTitle", { region: term(REGION_GROUPS[region].label), title }), t("regionalLead", { title }))}
    ${renderRegionTabs(region, (slug) => `${page}?region=${slug}`)}
    ${sections || renderCards([])}${renderFooter()}`;
}

function renderStay(items: Place[]): string {
  return renderRegionalCollection(items, "stay.html", t("stay"), "LOCAL STAY");
}

function renderMedical(items: Place[]): string {
  return renderRegionalCollection(items, "medical.html", t("medical"), "MEDICAL SUPPORT");
}

function renderInfoCenters(items: Place[]): string {
  return renderRegionalCollection(items, "info-center.html", t("infoCenter"), "TRAVELER SUPPORT");
}

function renderSupport(): string {
  const card = (number: string, title: string, text: string, href: string, link: string, external = false) =>
    `<article class="guide-card"><span class="guide-number">${number}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(text)}</p><a href="${href}"${external ? ` target="_blank" rel="noopener noreferrer"` : ""}>${escapeHTML(link)}</a></article>`;
  return `${renderHeader("TRAVELER SUPPORT", t("supportTitle"), t("supportLead"))}
    <section class="guide-grid guide-grid-4">
      ${card("01 · TOURIST HELP", t("infoCenter"), t("support1Text"), "info-center.html?region=kangwon", t("support1Link"))}
      ${card("02 · MEDICAL", t("medical"), t("support2Text"), "medical.html?region=kangwon", t("support2Link"))}
      ${card("03 · RESTROOM", t("support3Title"), t("support3Text"), "https://modootoilet.com/", t("support3Link"), true)}
      ${card("04 · Q&amp;A", t("faqTitle"), t("support4Text"), "qna.html", t("support4Link"))}
    </section>
    ${renderFooter()}`;
}

// Q&A 답변: 글자는 그대로 보여 주고 [이름](https://주소)만 새 창 링크로 바꿈
function renderFaqAnswer(answer: string): string {
  const link = /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let html = "";
  let last = 0;
  for (const match of answer.matchAll(link)) {
    const url = safeURL(match[2]);
    html += escapeHTML(answer.slice(last, match.index));
    html += url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(match[1])}</a>` : escapeHTML(match[0]);
    last = (match.index ?? 0) + match[0].length;
  }
  return html + escapeHTML(answer.slice(last));
}

// Q&A.md의 [분류] 줄마다 소제목을 달고, 그 아래 질문들을 묶어서 보여 줌
function renderQna(faq: FaqItem[]): string {
  const groups: { category: string; items: FaqItem[] }[] = [];
  faq.forEach((item) => {
    const category = item.category ?? "";
    const group = groups[groups.length - 1];
    if (group && group.category === category) group.items.push(item);
    else groups.push({ category, items: [item] });
  });
  const sections = groups.map(({ category, items }) => `<section class="faq-group">${category ? `<h2>${escapeHTML(category)}</h2>` : ""}<div class="faq-list">${items.map((item) => `<details class="faq-item"><summary>${escapeHTML(item.question)}</summary><p>${renderFaqAnswer(item.answer)}</p></details>`).join("")}</div></section>`).join("");
  return `${renderHeader("Q&A", t("faqTitle"), t("faqLead"))}
    ${sections}
    ${renderFooter()}`;
}

function renderMap(iframeMarkup: string): string {
  const match = iframeMarkup.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
  const src = match ? safeURL(match[1]) : "";
  if (!src) return "";
  try {
    const url = new URL(src);
    if (url.hostname !== "www.google.com" || !url.pathname.startsWith("/maps/embed")) return "";
    return `<div class="detail-map"><iframe src="${escapeHTML(url.href)}" title="${escapeHTML(t("mapIframe"))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`;
  } catch {
    return "";
  }
}

function fieldLines(value: FieldValue | undefined): string[] {
  const items = Array.isArray(value) ? value : [value ?? ""];
  return items.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function renderInfoRows(place: Place): string {
  return (<[label: UIKey, value: FieldValue | undefined][]>[
    ["rowAddress", place.address],
    ["rowFestivalPeriod", place.festivalPeriod],
    ["rowOrganizer", place.organizer],
    ["rowContact", place.contact],
    ["rowHoliday", place.holiday],
    ["rowAdmission", place.admission],
    ["rowParking", place.parking],
    ["rowTransit", place.transit],
    ["rowHours", place.hours],
    ["rowFilming", place.filmingLocations],
    ["rowWebsite", place.website],
  ]).map(([label, value]): [UIKey, string[]] => [label, fieldLines(value)])
    .filter(([, lines]) => lines.length)
    .map(([label, lines]) => {
      const formatted = lines.map((text) => {
        const url = label === "rowWebsite" ? safeURL(text) : "";
        return url
          ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text)}</a>`
          : escapeHTML(text);
      }).join("<br>");
      // 영어·일본어 화면: 번역 주소 아래 한국어 원문 주소 (택시 기사에게 보여주거나 국내 지도 앱에 입력할 때 필요)
      const korean = label === "rowAddress" && LANG !== "ko" ? fieldLines(place.addressKo).filter((line) => !lines.includes(line)) : [];
      const original = korean.length ? `<span class="address-ko" lang="ko">${korean.map(escapeHTML).join("<br>")}</span>` : "";
      return `<tr><th scope="row">${escapeHTML(t(label))}</th><td>${formatted}${original}</td></tr>`;
    }).join("");
}

function renderPlace(index: TravelIndex): string {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const source = params.get("source");
  const collection = params.get("collection") || "travel";
  const places = isCollectionKey(collection) ? index[collection] : [];
  const place = places.find((item) => source ? item.source === source : item.id === id);
  if (!place) {
    return `${renderHeader("LOCAL SPOT", t("placeNotFoundTitle"), t("placeNotFoundLead"))}<a class="button" href="local.html?region=jeolla">${escapeHTML(t("backToLocal"))}</a>${renderFooter()}`;
  }
  document.title = `${place.name} | LOCUS`;
  const cover = imageCandidates(place).length > 0;
  const heroImage = renderImage(place, t("heroAlt", { name: place.name }));
  const images = [...new Set(place.photos.map(safeURL).filter(Boolean))];
  const gallery = images.length ? `<div class="gallery">${images.map((image, index) => `<img src="${escapeHTML(image)}" alt="${escapeHTML(t("photoAlt", { name: place.name, n: index + 1 }))}" loading="lazy" ${EXTERNAL_IMAGE}>`).join("")}</div>` : "";
  const aliasList = localAliases(place);
  const alias = aliasList.length ? `<span class="card-alias">${escapeHTML(aliasList.join(" · "))}</span>` : "";
  const rows = renderInfoRows(place);
  const body = place.description.split(/\n\s*\n/).filter(Boolean).map(escapeHTML).join("\n\n");
  const region = (Object.keys(REGION_GROUPS) as RegionKey[]).find((key) => placeMatchesGroup(place, key)) || "jeolla";
  const backLink = collection === "stay"
    ? `stay.html?region=${region}`
    : collection === "medical"
      ? `medical.html?region=${region}`
      : collection === "infoCenters"
        ? `info-center.html?region=${region}`
        : `local.html?region=${region}`;
  const backLabel = collection === "stay" ? t("stay") : collection === "medical" ? t("medical") : collection === "infoCenters" ? t("infoCenter") : t("backLocal");
  const tags = localTags(place);
  return `<div class="place-detail">
    <a class="text-link" href="${backLink}">← ${escapeHTML(backLabel)}</a>
    <section class="place-hero${cover ? " has-image" : ""}">${heroImage}<div class="place-hero-content"><span class="eyebrow">${escapeHTML(term(place.province || place.areas[0] || "") || "LOCAL SPOT")}</span><h1>${escapeHTML(place.name)} ${alias}</h1><p>${escapeHTML(place.info)}</p></div></section>
    ${gallery}
    <article class="description">${body || escapeHTML(place.info)}</article>
    ${renderMap(place.mapEmbed)}
    ${rows ? `<table class="detail-table"><tbody>${rows}</tbody></table>` : renderEmpty(t("noVisitInfo"), "")}
    <div class="tag-list">${tags.map((tag) => `<span class="tag">${escapeHTML(tag.replace(/^#/, ""))}</span>`).join("")}</div>
    ${renderFooter()}
  </div>`;
}

// 여행 MBTI 채점. 축마다 질문이 2개라 1:1 동점이 생길 수 있음. 랜덤 없이 항상 같은 답 → 같은 결과.
// 1) 한 축에서 같은 글자를 2번 고르면 그 글자.
// 2) E/R 동점(Q1 ≠ Q4): 나머지 6개 답변에서 활동형(O·F·C)과 휴식형(I·B·S) 중 더 많은 쪽 → E 또는 R.
//    3:3이면 실제 여행 중 선택인 Q4의 답.
// 3) O/I, F/B, S/C 동점: 2)까지 정해진 E/R로 어느 질문을 믿을지 정함.
//    E(실속·알찬형, 계획대로) → 그 축의 앞 질문, R(여유형, 마음 가는 대로) → 그 축의 뒤 질문.
// 256가지 답 조합에서 16유형이 모두 나오고(유형별 9~23가지), 8개 질문 모두 결과에 영향을 줌.
function scoreMBTI(answers: MbtiLetter[]): AxisResult[] {
  const picks = (axis: AxisKey) => QUESTIONS.flatMap((question, index) => question.axis === axis ? [index] : []);
  const decide = (axis: AxisKey): AxisResult => {
    const data = AXES[axis];
    const indexes = picks(axis);
    const counts = data.letters.map((letter) => indexes.filter((index) => answers[index] === letter).length) as [number, number];
    const base = { axis, counts, early: indexes[0] + 1, late: indexes[indexes.length - 1] + 1 };
    if (counts[0] !== counts[1]) return { ...base, letter: data.letters[counts[0] > counts[1] ? 0 : 1], tie: "" };
    if (axis === "ER") {
      const activeLetters = Object.values(AXES).map((item) => item.active);
      const lean = answers.reduce((sum, letter, index) => indexes.includes(index) ? sum : sum + (activeLetters.includes(letter) ? 1 : -1), 0);
      if (lean !== 0) return { ...base, letter: lean > 0 ? "E" : "R", tie: "lean" };
      return { ...base, letter: answers[base.late - 1], tie: "last" };
    }
    const planner = er.letter === "E";
    return { ...base, letter: answers[(planner ? base.early : base.late) - 1], tie: planner ? "early" : "late" };
  };
  const er = decide("ER");
  return (Object.keys(AXES) as AxisKey[]).map((axis) => axis === "ER" ? er : decide(axis));
}

function renderAxisResults(results: AxisResult[]): string {
  const text = MBTI[LANG];
  return `<ul class="axis-results">${results.map(({ axis, letter, counts, early, late, tie }) => {
    const sides = AXES[axis].letters.map((side, index) => `<span class="axis-side${side === letter ? " picked" : ""}"><b>${side}</b> ${escapeHTML(text.letters[side])} <em>${counts[index]}</em></span>`);
    const note = tie ? `<small>${escapeHTML(text.tie[tie].replace("{q}", String(tie === "early" ? early : late)))}</small>` : "";
    return `<li>${sides.join('<span class="axis-vs">:</span>')}${note}</li>`;
  }).join("")}</ul>`;
}

// 점수 계산은 언어와 상관없이 한국어 값(테마, 태그, 이름)을 기준으로 함
function recommendPlaces(places: Place[], type: string): Place[] {
  const outdoorTerms = ["숲", "공원", "바다", "해안", "섬", "산책", "자연", "정원", "습지"];
  const indoorTerms = ["박물관", "미술관", "전시", "시장", "문화", "한옥", "체험"];
  return [...places].map((place) => {
    const text = `${place.id} ${place.name} ${place.info} ${place.tags.join(" ")} ${place.themes.join(" ")}`;
    let score = 0;
    const terms = type[0] === "O" ? outdoorTerms : indoorTerms;
    score += terms.filter((word) => text.includes(word)).length * 2;
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
      results.innerHTML = renderEmpty(t("drawEmptyTitle"), t("drawEmptyText"));
      message.textContent = "";
      return;
    }
    const pool = [...available];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
    const drawn = pool.slice(0, Math.min(3, pool.length));
    results.innerHTML = `<div class="ticket-grid">${drawn.map((place, index) => `<article class="ticket"><small>YOUR LOCAL DRAW · 0${index + 1}</small><h3>${escapeHTML(place.name)}</h3><p>${escapeHTML(place.info)}</p><a href="${linkForPlace(place)}">${escapeHTML(t("drawSee"))}</a></article>`).join("")}</div>`;
    message.textContent = t("drawMessage", { region: term(REGION_GROUPS[selectedRegion].label), count: drawn.length });
  });
}

function setupMBTI(places: Place[]): void {
  const form = document.querySelector<HTMLFormElement>("#mbti-form");
  const result = document.querySelector<HTMLElement>("#mbti-result");
  if (!form || !result) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const answers = QUESTIONS.map((_, index) => form.querySelector<HTMLInputElement>(`input[name="q${index}"]:checked`)?.value as MbtiLetter);
    const axes = scoreMBTI(answers);
    const type = axes.map((item) => item.letter).join("");
    const [title, description] = MBTI[LANG].types[type];
    const suggestions = recommendPlaces(places, type);
    result.innerHTML = `<div class="result-card"><span class="result-type">YOUR TRAVEL STYLE · ${type}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p>${renderAxisResults(axes)}<div class="result-recommendations"><h3>${escapeHTML(t("mbtiSuggest"))}</h3>${renderCards(suggestions)}</div><button class="button secondary" id="retry-quiz" type="button">${escapeHTML(t("mbtiRetry"))}</button></div>`;
    document.querySelector("#retry-quiz")?.addEventListener("click", () => {
      form.reset();
      result.innerHTML = "";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// 각 페이지의 브라우저 탭 제목 (place는 장소 이름으로 따로 설정)
const PAGE_TITLES: Record<string, UIKey> = {
  local: "navLocal",
  curation: "navCuration",
  archive: "navArchive",
  random: "randomPick",
  mbti: "travelMbti",
  place: "placeDetail",
  about: "about",
  stay: "stay",
  support: "support",
  infoCenter: "infoCenter",
  medical: "medical",
  qna: "qna",
};

function indexURL(): string {
  return LANG === "ko" ? "data/travel-index.json" : `data/travel-index.${LANG}.json`;
}

async function start(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const page = document.body.dataset.page ?? "";
  const pageTitle = PAGE_TITLES[page];
  if (pageTitle) document.title = `${t(pageTitle)} | LOCUS`;
  try {
    const response = await fetch(indexURL(), { cache: "no-store" });
    if (!response.ok) throw new Error(t("loadFail", { status: response.status }));
    const rawIndex: unknown = await response.json();
    // 예전 형식(관광지 배열 하나)으로 된 색인 파일도 읽을 수 있게 맞춰 줌
    const index = (Array.isArray(rawIndex)
      ? { travel: rawIndex, stay: [], infoCenters: [], medical: [] }
      : rawIndex) as TravelIndex | null;
    if (!index || !COLLECTIONS.every((key) => Array.isArray(index[key]))) {
      throw new Error(t("readFail"));
    }
    const regionIntros = index.regionIntros ?? {};
    const faq = Array.isArray(index.faq) ? index.faq : [];
    if (!Array.isArray(index.editorPicks)) index.editorPicks = [];
    renderTopNav();
    renderLanguageSwitch();
    renderSidebar();
    setStaticLabels();
    const places = index.travel;
    const destinationURL = randomPlaceURL(places);
    setRandomDestinationLink(destinationURL);
    const renderers: Record<string, (() => string) | undefined> = {
      home: () => renderHome(index),
      local: () => renderLocal(places, regionIntros),
      curation: () => renderCuration(index),
      random: renderRandom,
      mbti: renderMBTI,
      archive: () => renderArchive(places),
      place: () => renderPlace(index),
      about: renderAbout,
      stay: () => renderStay(index.stay),
      support: renderSupport,
      infoCenter: () => renderInfoCenters(index.infoCenters),
      medical: () => renderMedical(index.medical),
      qna: () => renderQna(faq),
    };
    const render = renderers[page];
    if (!render) throw new Error(t("pageNotFound", { page }));
    app.innerHTML = render();
    setupImages(app);
    if (page === "home") setupHome(app);
    if (page === "random") setupRandom(places);
    if (page === "mbti") setupMBTI(places);
  } catch (error) {
    console.error(error);
    app.innerHTML = `<div class="load-error"><strong>${escapeHTML(t("errorTitle"))}</strong><br>${escapeHTML(error instanceof Error ? error.message : error)}<br><br>${t("errorHelp")}</div>`;
  }
}

start();
