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
  description: string;
  photos: string[];
  mapEmbed: string;
  source: string;
}

type TravelIndex = Record<CollectionKey, Place[]>;

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
