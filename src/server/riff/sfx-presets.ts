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
    filePath: path.join(BGM_DIR, "고기굽는소리.MP3"),
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
];
