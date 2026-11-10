// dist/data/travel-index.json(build_travel_index.py 결과)과 지도 데이터의 모양을 정의한 타입

type RegionKey = "kangwon" | "gyeongsang" | "jeolla" | "chungcheong";
type CollectionKey = "travel" | "stay" | "infoCenters" | "medical";

// YAML 값은 한 줄이면 문자열, 여러 줄(- 목록)이면 문자열 배열로 색인됨
type FieldValue = string | string[];

interface Place {
  id: string;
  name: string;
  collection: CollectionKey;
  aliases: string[];
  cover: FieldValue;
  info: FieldValue;
  address: FieldValue;
  // en/ja 색인에만 있음: 번역 주소 아래 함께 보여줄 한국어 원문 주소
  addressKo?: FieldValue;
  contact: FieldValue;
  holiday: FieldValue;
  admission: FieldValue;
  parking: FieldValue;
  transit: FieldValue;
  website: FieldValue;
  hours: FieldValue;
  areas: string[];
  province: string;
  themes: string[];
  subthemes: string[];
  courses: string[];
  tags: string[];
  filmingLocations: FieldValue;
  // 축제 파일에만 값이 있음 (YAML: 주최-주관, 축제 기간)
  organizer?: FieldValue;
  festivalPeriod?: FieldValue;
  description: string;
  photos: string[];
  mapEmbed: string;
  source: string;
}

// content/ko의 "소개" 폴더 글: 로컬 스팟 페이지에서 도 이름 아래에 표시
interface RegionIntro {
  region: RegionKey;
  name: string;
  info: FieldValue;
  cover: FieldValue;
  description: string;
  source: string;
}

// content/ko의 "Q&A" 폴더 글 (Q. / A. 형식)
interface FaqItem {
  question: string;
  answer: string;
  region: RegionKey | "";
}

type TravelIndex = Record<CollectionKey, Place[]> & {
  regionIntros: Partial<Record<RegionKey, RegionIntro>>;
  faq: FaqItem[];
};

interface KoreaMapRegion {
  name: string;
  region: RegionKey | "";
  d: string;
}

interface KoreaMapLabel {
  name: string;
  region: RegionKey | "";
  x: number;
  y: number;
}

interface KoreaMap {
  width: number;
  height: number;
  regions: KoreaMapRegion[];
  labels: KoreaMapLabel[];
}
