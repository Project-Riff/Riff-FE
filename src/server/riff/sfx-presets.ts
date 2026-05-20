import path from "path";
import { AnalysisShotType } from "./types";

export type SfxPreset = {
  id: string;
  filePath: string;
  keywords: string[];
  shotTypes: AnalysisShotType[];
  volume: number;
  offsetSec: number;
  trimToSec: number;
};

const BGM_DIR = path.join(process.cwd(), "storage", "bgm");

export const SFX_PRESETS: SfxPreset[] = [
  {
    id: "meat-sizzle",
    filePath: path.join(BGM_DIR, "베이컨굽는소리.mp3"),
    keywords: [
      "고기",
      "불판",
      "굽는",
      "구워",
      "육즙",
      "스테이크",
      "갈비",
      "삼겹",
      "바베큐",
      "오븐",
      "화덕",
      "튀김",
      "튀김기",
      "갓 나온",
      "막 나온",
      "베이컨",
    ],
    shotTypes: ["food_hook", "food_detail"],
    volume: 0.95,
    offsetSec: 0.06,
    trimToSec: 1.2,
  },
  {
    id: "water-pour",
    filePath: path.join(BGM_DIR, "물따르는소리.MP3"),
    keywords: [
      "따르는",
      "따르",
      "붓는",
      "붓",
      "음료",
      "커피",
      "라떼",
      "에이드",
      "소스",
      "국물",
      "육수",
    ],
    shotTypes: ["food_hook", "food_detail"],
    volume: 0.85,
    offsetSec: 0.08,
    trimToSec: 1.0,
  },
  {
    id: "ice",
    filePath: path.join(BGM_DIR, "얼음소리.MP3"),
    keywords: ["얼음", "아이스", "차가운", "컵", "잔", "콜드", "시원"],
    shotTypes: ["food_hook", "food_detail"],
    volume: 0.82,
    offsetSec: 0.04,
    trimToSec: 0.9,
  },
  {
    id: "bread-cut",
    filePath: path.join(BGM_DIR, "빵자르는소리.mp3"),
    keywords: [
      "자르는",
      "자르기",
      "잘라",
      "썰기",
      "썰어",
      "컷팅",
      "칼질",
      "도우",
      "갈라",
      "갈라지는",
      "뜯는",
      "뜯어",
      "들어올려",
      "들어 올려",
      "늘어나는",
      "늘어남",
      "치즈 스트레치",
      "피자",
      "빵",
      "크러스트",
    ],
    shotTypes: ["food_hook", "food_detail"],
    volume: 0.9,
    offsetSec: 0.05,
    trimToSec: 1.0,
  },
  {
    id: "crunch-bite",
    filePath: path.join(BGM_DIR, "과자씹는소리.mp3"),
    keywords: [
      "씹는",
      "한입",
      "한 입",
      "먹는",
      "먹자마자",
      "바삭",
      "크리스피",
      "튀김",
      "치킨",
      "감자튀김",
      "과자",
      "크런치",
    ],
    shotTypes: ["food_hook", "food_detail", "ending"],
    volume: 0.88,
    offsetSec: 0.08,
    trimToSec: 0.95,
  },
];
