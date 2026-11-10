# LOCUS

지역의 여행지와 문화를 소개하는 로컬 여행 아카이브입니다.
여행지 정보를 Markdown 파일로 작성하면, 빌드 과정에서 JSON으로 색인되어 정적 웹사이트로 보여집니다. 서버나 데이터베이스 없이 파일만으로 동작합니다.

## 빠른 시작

필요한 것: **Node.js**(npm 포함), **Python 3.8 이상**

```bash
npm install        # 처음 한 번만 (TypeScript 설치)
npm run build      # dist/ 폴더에 사이트 생성
npm run serve      # http://localhost:8000 에서 확인
```

`dist/index.html`을 더블클릭해서 열면 여행지 데이터를 불러오지 못합니다. 브라우저 보안 정책 때문이므로 반드시 `npm run serve`로 띄운 주소에서 확인합니다.

## 폴더 구조

```
LOCUS/
├── content/                 원본 자료 (Markdown)
│   ├── travel/              관광지 (지역별 하위 폴더)
│   ├── stay/                숙박
│   ├── medical/             의료시설
│   └── info-center/         관광안내소
├── src/                     소스 코드
│   ├── ts/                  TypeScript (화면 생성과 동작)
│   │   ├── script.ts        페이지별 화면, 필터, 랜덤 뽑기, 여행 MBTI 등
│   │   ├── korea-map.ts     메인 화면 지도의 행정구역 경계 데이터
│   │   └── types.d.ts       여행지 데이터·지도 데이터의 타입 정의
│   ├── pages/               HTML 13개 (페이지마다 하나)
│   └── styles/style.css     전체 디자인
├── public/                  그대로 복사되는 정적 파일 (로고 이미지)
├── dist/                    빌드 결과물 (자동 생성, git 제외)
├── build_travel_index.py    Markdown 색인 + 정적 파일 복사
├── package.json             npm 명령어
└── tsconfig.json            TypeScript 설정
```

`dist/`는 빌드할 때마다 새로 만들어지므로 **직접 수정하지 않습니다.** 수정은 항상 `content/`, `src/`, `public/`에서 합니다.

## 빌드 과정

`npm run build`는 두 단계를 차례로 실행합니다.

| 단계 | 입력 | 출력 |
|---|---|---|
| 1. `build_travel_index.py` | `content/**/*.md` | `dist/data/travel-index.json` |
| | `src/pages/*.html` | `dist/*.html` |
| | `src/styles/` | `dist/css/` |
| | `public/` | `dist/` (예: `dist/image/`) |
| 2. `tsc` (TypeScript 컴파일) | `src/ts/*.ts` | `dist/js/` |

1단계는 실행할 때마다 `dist/js/`를 제외한 `dist/` 안의 파일을 지우고 다시 만듭니다. 원본에서 지운 파일이 `dist/`에 남지 않습니다.

브라우저에서는 각 HTML이 `js/script.js`를 불러오고, 스크립트가 `data/travel-index.json`을 읽어 주소의 조건(`?region=`, `?theme=` 등)에 맞는 여행지만 골라 화면을 그립니다.

### npm 명령어

| 명령 | 하는 일 | 이럴 때 사용 |
|---|---|---|
| `npm run build` | 1단계 + 2단계 전체 | 기본. 무엇을 고쳤든 이것 하나면 됨 |
| `npm run build:content` | 1단계만 | Markdown, HTML, CSS, 이미지만 고쳤을 때 |
| `npm run build:ts` | 2단계만 | TypeScript만 고쳤을 때 |
| `npm run watch` | TypeScript 저장 시 자동 컴파일 | TS를 계속 수정하는 중일 때 |
| `npm run typecheck` | 파일을 만들지 않고 타입 검사만 | 오류 확인용 |
| `npm run serve` | `dist/`를 `localhost:8000`으로 띄움 | 결과 확인 |

TypeScript에서 타입 오류가 나면 `dist/js/` 파일이 만들어지지 않습니다. 화면이 바뀌지 않으면 터미널의 오류 메시지를 먼저 확인합니다.

## 여행지 추가하기

1. 해당 폴더(`content/travel/지역/`, `content/stay/지역/` 등)에 `장소이름.md` 파일을 만듭니다. 파일 이름이 사이트에 표시되는 장소 이름이 됩니다.
2. 아래 템플릿을 붙여 넣고 값을 채웁니다.
3. `npm run build:content`(또는 `npm run build`)를 실행합니다.

```markdown
---
aliases:
cover: https://대표-사진-주소.jpg
info: 카드에 표시되는 한 줄 소개
주소: 경상남도 함양군 지곡면 개평길 59
문의: 055-000-0000
휴일: 연중무휴
입장료: 무료
주차: 가능
대중교통: 터미널에서 OO번 버스 → OO 정류장 하차
홈페이지: https://...
영업시간:
  - 하절기 09:00~18:00
  - 동절기 09:00~17:00
대지역:
  - 경상남도
메인 테마:
  - 역사
서브 테마:
  - 한옥마을
코스: K-컬쳐
촬영장소: 드라마 이름 (있을 때만)
태그:
  - 함양
  - 한옥마을
---

본문 소개글을 여기에 씁니다.

https://추가-사진-주소.jpg

<iframe src="https://www.google.com/maps/embed?..."></iframe>
```

### 항목 작성 규칙

- 값이 하나면 `항목: 값`, 여러 개면 아래 줄에 `  - 값`으로 나열합니다. 여러 줄로 쓴 값은 상세 페이지에서 한 줄씩 나뉘어 표시됩니다.
- 빈 항목은 비워 두면 됩니다. 상세 페이지 표에서 자동으로 빠집니다.
- 본문에 붙여 넣은 이미지 주소(`.jpg`, `.png`, `.webp` 등)는 사진 갤러리로, Google 지도 `<iframe>`은 지도 칸으로 자동 분리됩니다.

### 필터에 쓰이는 항목

아래 항목의 값이 정해진 이름과 정확히 같아야 해당 메뉴에 나타납니다.

| 항목 | 쓰이는 곳 | 사용할 값 |
|---|---|---|
| `대지역` (+ `주소`) | 로컬 스팟, 숙박, 의료시설, 메인 지도 | 강원도, 충청북도, 충청남도, 전라북도, 전라남도, 경상북도, 경상남도 |
| `메인 테마` | 테마 아카이브 | 쇼핑, 엔터테인먼트, 역사, 음식, 자연관광 |
| `코스` | 여행 큐레이션 | `K-컬쳐`면 K-컬쳐 Pick, 그 외 값은 에디터's Pick의 코스 |

지역은 `주소`의 앞부분(예: `충남`, `부산`)으로도 자동 보정되지만, `대지역`을 정확히 쓰는 것이 가장 확실합니다.

## 코드 수정하기

| 바꾸고 싶은 것 | 수정할 곳 |
|---|---|
| 화면 구성, 문구, 필터 동작 | `src/ts/script.ts` |
| 상단 메뉴·사이드바 순서 | `src/ts/script.ts`의 `navGroups` |
| 메인 화면 섹션 순서 | `src/ts/script.ts`의 `renderHome` |
| 슬라이드 사진, 테마 버튼, 조원 이름 | `src/ts/script.ts`의 `HOME_SLIDES`, `HOME_THEMES`, `TEAM_MEMBERS` |
| 색, 크기, 간격 | `src/styles/style.css` |
| 내용 가로 폭 | `style.css`의 `--content-width`(메인 화면), `--page-width`(나머지 페이지) |
| 로고 등 이미지 | `public/image/` |

HTML 파일은 거의 빈 틀입니다. 실제 내용은 `script.ts`가 각 HTML의 `<body data-page="...">` 값을 보고 `<main id="app">` 안에 채워 넣습니다.

CSS나 JS를 고친 뒤 브라우저에 예전 화면이 계속 보이면 캐시 때문입니다. 강력 새로고침(macOS `Cmd+Shift+R`)을 하거나, HTML의 `css/style.css?v=13`, `js/script.js?v=14` 숫자를 하나 올립니다.

## Obsidian으로 자료 편집하기

프로젝트 폴더를 Obsidian 보관함으로 열면 Markdown의 YAML 항목을 표 형태로 편집할 수 있습니다. `.obsidian/types.json`에 `대지역`, `메인 테마`, `태그` 등이 목록 형식으로 지정되어 있어 팀원 모두 같은 형식으로 작성됩니다.

자료 파일을 옮기거나 이름을 바꿀 때는 Finder보다 Obsidian 안에서 하는 것이 안전합니다.
