import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import {
  AnalysisResult,
  AnalysisSegment,
  AnalysisShotType,
  StoreInfo,
  SubtitleItem,
} from "./types";
import { ensureJobDirs } from "./local-paths";

type GeminiFileLike = {
  name?: string;
  uri?: string;
  mimeType?: string;
  state?: string | { name?: string; toString?: () => string };
  error?: unknown;
  file?: {
    uri?: string;
    mimeType?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message || "";
  const retryMatch =
    message.match(/retry in\s+([\d.]+)s/i) ||
    message.match(/"retryDelay":"(\d+)s"/i);

  if (!retryMatch?.[1]) {
    return null;
  }

  const seconds = Number(retryMatch[1]);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return Math.ceil(seconds * 1000);
}

function shouldRetryUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message || "";
  return (
    /"status":"UNAVAILABLE"/i.test(message) ||
    /currently experiencing high demand/i.test(message) ||
    /status:\s*503/i.test(message)
  );
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  contents: Array<{
    role: "user";
    parts: Array<
      | {
        fileData: {
          fileUri: string;
          mimeType: string;
        };
      }
      | {
        text: string;
      }
    >;
  }>,
) {
  const unavailableBackoffMs = [15000, 30000, 60000];
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= unavailableBackoffMs.length; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });
    } catch (error) {
      lastError = error;
      const retryDelayMs = getRetryDelayMs(error);

      if (retryDelayMs) {
        console.log(
          `[Gemini] quota 재시도 대기 ${(retryDelayMs / 1000).toFixed(1)}초`,
        );

        await sleep(retryDelayMs + 1000);
        continue;
      }

      if (shouldRetryUnavailable(error) && attempt < unavailableBackoffMs.length) {
        const fallbackDelayMs = unavailableBackoffMs[attempt];
        console.log(
          `[Gemini] 고부하 재시도 대기 ${(fallbackDelayMs / 1000).toFixed(1)}초 (${attempt + 1}/${unavailableBackoffMs.length})`,
        );

        await sleep(fallbackDelayMs);
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini generateContent 재시도 실패");
}

const FINAL_SCRIPT_DURATION = 20;
const EARLY_INFO_DURATION = 9;
const MIN_SUBTITLE_CHUNKS = 5;
const MAX_SUBTITLE_CHUNKS = 7;

function loadPrompt(promptFileName: string, storeInfo?: StoreInfo) {
  const filePath = path.join(process.cwd(), "src/prompts", promptFileName);
  const basePrompt = fs.readFileSync(filePath, "utf-8");

  const contextLines = [
    storeInfo?.name ? `- 매장명: ${storeInfo.name}` : "",
    storeInfo?.address ? `- 주소: ${storeInfo.address}` : "",
    storeInfo?.subtitle ? `- 부제 참고 문구: ${storeInfo.subtitle}` : "",
    storeInfo?.strengths ? `- 가게 특장점: ${storeInfo.strengths}` : "",
    storeInfo?.hours ? `- 영업시간: ${storeInfo.hours}` : "",
    storeInfo?.phone ? `- 전화번호: ${storeInfo.phone}` : "",
    storeInfo?.instagram ? `- 인스타그램: ${storeInfo.instagram}` : "",
  ].filter(Boolean);

  if (contextLines.length === 0) {
    return basePrompt;
  }

  return `${basePrompt}

### 🏪 매장 정보 (입력 컨텍스트):

${contextLines.join("\n")}

[추가 규칙]
- 위 매장 정보를 적극 반영하세요.
- 매장명, 주소, 가게 특장점을 우선적으로 반영하세요.
- 입력된 부제가 있으면 우선 참고하세요.
`;
}

function fileStateToString(file: unknown) {
  const f = file as GeminiFileLike;

  if (!f?.state) return "STATE_UNSPECIFIED";
  if (typeof f.state === "string") return f.state;
  if (typeof f.state === "object" && typeof f.state.name === "string") {
    return f.state.name;
  }
  if (typeof f.state?.toString === "function") {
    return f.state.toString();
  }

  return String(f.state);
}

function getFileUri(file: GeminiFileLike) {
  return file.uri ?? file.file?.uri ?? null;
}

function getMimeType(file: GeminiFileLike) {
  return file.mimeType ?? file.file?.mimeType ?? "video/mp4";
}

async function waitUntilFileActive(
  ai: GoogleGenAI,
  fileName: string,
  timeoutMs = 10 * 60 * 1000,
  intervalMs = 5000,
) {
  const startedAt = Date.now();
  let lastState = "UNKNOWN";

  while (true) {
    const elapsed = Date.now() - startedAt;

    if (elapsed > timeoutMs) {
      throw new Error(
        `Gemini 파일 처리 타임아웃 (${timeoutMs / 1000}초), 마지막 상태=${lastState}`,
      );
    }

    const current = (await ai.files.get({ name: fileName })) as GeminiFileLike;
    const state = fileStateToString(current);
    lastState = state;

    console.log(
      `[Gemini] 파일 상태 확인: ${state} / 경과 ${(elapsed / 1000).toFixed(1)}초`,
    );

    if (state === "ACTIVE") {
      return current;
    }

    if (state === "FAILED") {
      throw new Error(
        `Gemini 파일 처리 실패: ${JSON.stringify({
          name: current.name,
          state,
          error: current.error,
          uri: getFileUri(current),
          mimeType: getMimeType(current),
        })}`,
      );
    }

    await sleep(intervalMs);
  }
}

function parseTimeRange(timeStr: string) {
  const clean = timeStr
    .replace(/\*\*/g, "")
    .replace(/초/g, "")
    .replace(/sec/gi, "")
    .trim();

  const parseTimeToken = (value: string) => {
    const token = value.trim();

    if (/^\d+(?:\.\d+)?$/.test(token)) {
      return Number(token);
    }

    const hourMinuteSecondMatch = token.match(
      /^(\d+):(\d{1,2}):(\d{1,2})(?:\.(\d+))?$/,
    );

    if (hourMinuteSecondMatch) {
      const hours = Number(hourMinuteSecondMatch[1]);
      const minutes = Number(hourMinuteSecondMatch[2]);
      const seconds = Number(hourMinuteSecondMatch[3]);
      const fraction = hourMinuteSecondMatch[4]
        ? Number(`0.${hourMinuteSecondMatch[4]}`)
        : 0;

      return hours * 3600 + minutes * 60 + seconds + fraction;
    }

    const minuteSecondMatch = token.match(
      /^(\d+):(\d{1,2})(?:\.(\d+))?$/,
    );

    if (minuteSecondMatch) {
      const minutes = Number(minuteSecondMatch[1]);
      const seconds = Number(minuteSecondMatch[2]);
      const fraction = minuteSecondMatch[3]
        ? Number(`0.${minuteSecondMatch[3]}`)
        : 0;

      return minutes * 60 + seconds + fraction;
    }

    return Number.NaN;
  };

  const match = clean.match(
    /([\d:.]+)\s*[~\-–]\s*([\d:.]+)/,
  );

  if (!match) {
    throw new Error(`시간 범위 파싱 실패: ${timeStr}`);
  }

  const start = parseTimeToken(match[1]);
  const end = parseTimeToken(match[2]);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error(`시간 토큰 파싱 실패: ${timeStr}`);
  }

  return {
    start,
    end,
  };
}

function cleanScript(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/\[BGM\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickField(text: string, labels: string[]) {
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    for (const label of labels) {
      const pattern = new RegExp(`^${label}\\s*[:：]\\s*(.+)$`, "i");
      const match = trimmed.match(pattern);

      if (match?.[1]) {
        return cleanScript(match[1]);
      }
    }
  }

  return "";
}

export function deriveRegionTitle(address?: string) {
  if (!address) {
    return "";
  }

  const normalized = address.trim();
  const mapping: Array<[RegExp, string]> = [
    [/^서울(?:특별시|시)?/, "서울"],
    [/^부산(?:광역시|시)?/, "부산"],
    [/^대구(?:광역시|시)?/, "대구"],
    [/^인천(?:광역시|시)?/, "인천"],
    [/^광주(?:광역시|시)?/, "광주"],
    [/^대전(?:광역시|시)?/, "대전"],
    [/^울산(?:광역시|시)?/, "울산"],
    [/^세종(?:특별자치시|시)?/, "세종"],
    [/^제주(?:특별자치도|도)?/, "제주"],
    [/^경기(?:도)?/, "경기"],
    [/^강원(?:특별자치도|도)?/, "강원"],
    [/^충북|^충청북도/, "충북"],
    [/^충남|^충청남도/, "충남"],
    [/^전북|^전라북도|^전북특별자치도/, "전북"],
    [/^전남|^전라남도/, "전남"],
    [/^경북|^경상북도/, "경북"],
    [/^경남|^경상남도/, "경남"],
  ];

  for (const [pattern, value] of mapping) {
    if (pattern.test(normalized)) {
      return value;
    }
  }

  return normalized.split(/\s+/)[0] ?? "";
}

type ParsedCutRow = {
  start: number;
  end: number;
  shotType: AnalysisShotType;
  label: string;
  hookStrength: number;
  visualClarity: number;
  shortformImpact: number;
};

type FoodDetailRole =
  | "action"
  | "display"
  | "serving"
  | "eating"
  | "closeup";

type CandidateSelectionLog = {
  start: number;
  end: number;
  shotType: AnalysisShotType;
  label: string;
  reason: string;
};

type CutParseIssue = {
  line: string;
  reason:
    | "missing_columns"
    | "time_parse_failed"
    | "invalid_range"
    | "invalid_type";
};

type CutSelectionResult = {
  candidates: ParsedCutRow[];
  selected: ParsedCutRow[];
  removed: CandidateSelectionLog[];
  parseIssues: CutParseIssue[];
  candidateDiagnostics: Array<{
    start: number;
    end: number;
    shotType: AnalysisShotType;
    label: string;
    detailRole?: FoodDetailRole;
    baseScore: number;
    isBridgeCandidate: boolean;
    hookStrength: number;
    visualClarity: number;
    shortformImpact: number;
  }>;
  selectionTrace: Array<{
    slot: string;
    start: number;
    end: number;
    shotType: AnalysisShotType;
    label: string;
    detailRole?: FoodDetailRole;
    baseScore: number;
    diversityAdjustment: number;
    totalScore: number;
    hookStrength: number;
    visualClarity: number;
    shortformImpact: number;
  }>;
  selectionMode: "normal" | "fallback";
};

const ALLOWED_SHOT_TYPES: AnalysisShotType[] = [
  "food_hook",
  "location",
  "interior",
  "food_detail",
  "ending",
];

function parseShotType(value: string): AnalysisShotType | null {
  const normalized = cleanScript(value).toLowerCase();
  return ALLOWED_SHOT_TYPES.find((type) => type === normalized) ?? null;
}

function parseFivePointScore(value: string | undefined, fallback = 3) {
  const parsed = Number((value ?? "").trim());

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(5, Math.round(parsed)));
}

function extractKeywords(label: string) {
  return cleanScript(label)
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function getKeywordOverlapScore(a: string, b: string) {
  const aTokens = new Set(extractKeywords(a));
  const bTokens = new Set(extractKeywords(b));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let overlap = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function getOverlapRatio(a: ParsedCutRow, b: ParsedCutRow) {
  const overlap = Math.min(a.end, b.end) - Math.max(a.start, b.start);

  if (overlap <= 0) {
    return 0;
  }

  const shorter = Math.min(a.end - a.start, b.end - b.start);
  return shorter > 0 ? overlap / shorter : 0;
}

function isSameSceneFamily(a: ParsedCutRow, b: ParsedCutRow) {
  const overlapRatio = getOverlapRatio(a, b);
  const startGap = Math.abs(a.start - b.start);
  const endGap = Math.abs(a.end - b.end);
  const keywordOverlap = getKeywordOverlapScore(a.label, b.label);
  const aRole =
    a.shotType === "food_detail" ? inferFoodDetailRole(a.label) : undefined;
  const bRole =
    b.shotType === "food_detail" ? inferFoodDetailRole(b.label) : undefined;
  const sameFoodRole =
    a.shotType === "food_detail" &&
    b.shotType === "food_detail" &&
    aRole === bRole;

  if (overlapRatio >= 0.45) {
    return true;
  }

  // 진열/쇼케이스 계열은 너무 쉽게 같은 장면으로 묶지 않는다.
  // 그래야 대표 display 후보 하나가 후보 단계에서 통째로 사라지지 않는다.
  if (aRole === "display" || bRole === "display") {
    return (
      sameFoodRole &&
      startGap <= 6 &&
      endGap <= 6 &&
      keywordOverlap >= 0.55
    );
  }

  if (
    startGap <= 8 &&
    endGap <= 8 &&
    a.shotType === b.shotType &&
    (keywordOverlap >= 0.3 || sameFoodRole)
  ) {
    return true;
  }

  if (
    a.shotType === "food_detail" &&
    b.shotType === "food_detail" &&
    startGap <= 10 &&
    endGap <= 10 &&
    keywordOverlap >= 0.4
  ) {
    return true;
  }

  return false;
}

function inferFoodDetailRole(label: string): FoodDetailRole {
  const normalized = cleanScript(label).toLowerCase();

  if (
    /(먹는|먹자마자|한입|한 입|표정|반응|즐기는|손님들이.*즐기|대화하는)/.test(
      normalized,
    )
  ) {
    return "eating";
  }

  if (
    /(자르|잘린|흘러|열리|뿌리|들어올리|벗겨|제거|조리|굽|붓|올리)/.test(
      normalized,
    )
  ) {
    return "action";
  }

  if (
    /(상차림|테이블|세팅|접시에 담긴|놓인 테이블|음료와.*함께|항공샷)/.test(
      normalized,
    )
  ) {
    return "serving";
  }

  if (
    /(쇼케이스|진열|매대|진열대|display|전시|여러.*케이크|다양한.*빵)/.test(
      normalized,
    )
  ) {
    return "display";
  }

  return "closeup";
}

function isBridgeCandidate(row: ParsedCutRow) {
  if (row.shotType === "interior") {
    return true;
  }

  if (row.shotType === "location") {
    return getKeywordOverlapScore(
      row.label,
      "전경 입구 입구 주변 매장 진입 외부 분위기 실내 분위기",
    ) >= 0.12;
  }

  if (row.shotType === "food_detail") {
    const role = inferFoodDetailRole(row.label);
    return role === "serving" || role === "display";
  }

  return false;
}

function scoreCutCandidate(row: ParsedCutRow) {
  const duration = row.end - row.start;
  let score = 0;

  if (row.shotType === "food_hook") {
    score = -Math.abs(duration - 2.3);
  } else if (row.shotType === "ending") {
    score = -Math.abs(duration - 2.8) + 0.1;
  } else if (row.shotType === "food_detail") {
    const role = inferFoodDetailRole(row.label);

    if (role === "action" || role === "eating") {
      score = -Math.abs(duration - 2.6) + 0.08;
    } else if (role === "display" || role === "serving") {
      score = -Math.abs(duration - 3.0) + 0.04;
    } else {
      score = -Math.abs(duration - 2.8);
    }
  } else {
    score = -Math.abs(duration - 2.9);
  }

  const hookBonus = (row.hookStrength - 3) * 0.18;
  const clarityBonus = (row.visualClarity - 3) * 0.16;
  const impactBonus = (row.shortformImpact - 3) * 0.18;

  if (row.shotType === "food_hook") {
    score += hookBonus + clarityBonus + impactBonus;
  } else if (row.shotType === "food_detail") {
    score += clarityBonus + impactBonus;
  } else if (row.shotType === "ending") {
    score += clarityBonus + impactBonus * 0.8;
  } else {
    score += clarityBonus;
  }

  return score;
}

function getDiversityAdjustment(
  candidate: ParsedCutRow,
  selected: ParsedCutRow[],
) {
  if (selected.length === 0) {
    return 0;
  }

  let adjustment = 0;
  const recent = selected.slice(-2);
  const hasSameType = selected.some((picked) => picked.shotType === candidate.shotType);
  const maxKeywordOverlap = Math.max(
    ...selected.map((picked) => getKeywordOverlapScore(candidate.label, picked.label)),
  );

  if (!hasSameType) {
    adjustment += 0.28;
  }

  if (candidate.shotType === "food_detail") {
    const candidateRole = inferFoodDetailRole(candidate.label);

    if (
      candidateRole === "display" &&
      !selected.some(
        (picked) =>
          picked.shotType === "food_detail" &&
          inferFoodDetailRole(picked.label) === "display",
      )
    ) {
      adjustment += 0.18;
    }

    if (maxKeywordOverlap < 0.25) {
      adjustment += 0.22;
    }

    if (
      recent.some(
        (picked) =>
          picked.shotType === "food_detail" &&
          (getKeywordOverlapScore(candidate.label, picked.label) >= 0.4 ||
            inferFoodDetailRole(picked.label) === candidateRole),
      )
    ) {
      adjustment -= 0.35;
    }
  }

  if (recent.some((picked) => picked.shotType === candidate.shotType)) {
    adjustment -= 0.15;
  }

  // 훅 2개 직후 첫 연결 구간에서는 완충 성격 후보를 약하게 우대한다.
  // 단, 별도 슬롯으로 강제하지 않고 점수에만 작게 반영한다.
  if (
    selected.length === 2 &&
    selected[0]?.shotType === "food_hook" &&
    (selected[1]?.shotType === "food_hook" ||
      selected[1]?.shotType === "food_detail") &&
    isBridgeCandidate(candidate)
  ) {
    adjustment += 0.16;
  }

  if (maxKeywordOverlap >= 0.5) {
    adjustment -= 0.4;
  } else if (maxKeywordOverlap >= 0.35) {
    adjustment -= 0.2;
  }

  return adjustment;
}

function validateCandidateRows(
  rows: ParsedCutRow[],
  videoDuration?: number,
) {
  const valid: ParsedCutRow[] = [];
  const removed: CandidateSelectionLog[] = [];

  for (const row of rows) {
    const duration = row.end - row.start;

    if (row.start < 0) {
      removed.push({ ...row, reason: "start<0" });
      continue;
    }

    if (!Number.isFinite(row.start) || !Number.isFinite(row.end) || row.end <= row.start) {
      removed.push({ ...row, reason: "invalid_range" });
      continue;
    }

    if (videoDuration && row.end > videoDuration + 0.01) {
      removed.push({ ...row, reason: "end>videoDuration" });
      continue;
    }

    if (duration < 1.8) {
      removed.push({ ...row, reason: "too_short" });
      continue;
    }

    if (duration > 5) {
      removed.push({ ...row, reason: "too_long" });
      continue;
    }

    valid.push(row);
  }

  return {
    valid,
    removed,
  };
}

function dedupeCutRows(rows: ParsedCutRow[]) {
  const deduped: ParsedCutRow[] = [];
  const removed: CandidateSelectionLog[] = [];

  for (const row of rows) {
    const duplicateOf = deduped.find((picked) => {
      const overlap = Math.min(picked.end, row.end) - Math.max(picked.start, row.start);
      const almostSameWindow =
        Math.abs(picked.start - row.start) < 1.5 &&
        Math.abs(picked.end - row.end) < 1.5;
      const sameTypeSimilarLabel =
        picked.shotType === row.shotType &&
        getKeywordOverlapScore(picked.label, row.label) >= 0.6;
      const sameFoodRoleSimilarLabel =
        picked.shotType === "food_detail" &&
        row.shotType === "food_detail" &&
        inferFoodDetailRole(picked.label) === inferFoodDetailRole(row.label) &&
        getKeywordOverlapScore(picked.label, row.label) >= 0.45;
      const sameSceneFamily =
        picked.shotType === row.shotType &&
        isSameSceneFamily(picked, row);

      return (
        overlap >= 0.75 ||
        almostSameWindow ||
        sameTypeSimilarLabel ||
        sameFoodRoleSimilarLabel ||
        sameSceneFamily
      );
    });

    if (duplicateOf) {
      removed.push({
        ...row,
        reason: "duplicate_candidate",
      });
      continue;
    }

    deduped.push(row);
  }

  return {
    deduped,
    removed,
  };
}

function reorderCutRowsForStructure(rows: ParsedCutRow[]) {
  if (rows.length === 0) {
    return rows;
  }

  const remaining = [...rows];
  const ordered: ParsedCutRow[] = [];

  const takeEarliest = (predicate: (row: ParsedCutRow) => boolean) => {
    let index = -1;
    let earliestStart = Number.POSITIVE_INFINITY;

    remaining.forEach((row, candidateIndex) => {
      if (!predicate(row)) {
        return;
      }

      if (row.start < earliestStart) {
        earliestStart = row.start;
        index = candidateIndex;
      }
    });

    if (index === -1) {
      return null;
    }

    const [row] = remaining.splice(index, 1);
    ordered.push(row);
    return row;
  };

  const takeAllSorted = (predicate: (row: ParsedCutRow) => boolean) => {
    const matches = remaining
      .filter(predicate)
      .sort((a, b) => a.start - b.start);

    for (const row of matches) {
      const index = remaining.findIndex(
        (item) =>
          item.start === row.start &&
          item.end === row.end &&
          item.shotType === row.shotType &&
          item.label === row.label,
      );

      if (index === -1) {
        continue;
      }

      const [picked] = remaining.splice(index, 1);
      ordered.push(picked);
    }
  };

  // 도입부는 음식 훅 1개를 최우선으로 배치한다.
  takeEarliest((row) => row.shotType === "food_hook");

  // 초반에는 위치/내부 컷을 1~2개만 짧게 배치한다.
  if (!takeEarliest((row) => row.shotType === "location")) {
    takeEarliest((row) => row.shotType === "interior");
  }

  if (ordered.length < 4) {
    takeEarliest(
      (row) =>
        row.shotType === "location" || row.shotType === "interior",
    );
  }

  takeAllSorted((item) => item.shotType === "food_detail");
  takeAllSorted((item) => item.shotType === "food_hook");
  takeAllSorted((item) => item.shotType === "location");
  takeAllSorted((item) => item.shotType === "interior");
  takeAllSorted((item) => item.shotType === "ending");

  return ordered;
}

function pickBestCandidates(
  rows: ParsedCutRow[],
  minCount = 7,
  maxCount = 8,
) {
  const selected: ParsedCutRow[] = [];
  const remaining = [...rows];
  const selectionTrace: CutSelectionResult["selectionTrace"] = [];

  const getSelectedDisplays = () =>
    selected.filter(
      (row) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "display",
    );

  const getSameSceneFamilyFoodDetailCount = (candidate: ParsedCutRow) => {
    if (candidate.shotType !== "food_detail") {
      return 0;
    }

    return selected.filter(
      (picked) =>
        picked.shotType === "food_detail" && isSameSceneFamily(candidate, picked),
    ).length;
  };

  const isDistinctDisplayEnough = (candidate: ParsedCutRow) => {
    if (
      candidate.shotType !== "food_detail" ||
      inferFoodDetailRole(candidate.label) !== "display"
    ) {
      return false;
    }

    const displays = getSelectedDisplays();

    if (displays.length >= 2) {
      return false;
    }

    return displays.every((picked) => {
      if (isSameSceneFamily(candidate, picked)) {
        return false;
      }

      return getKeywordOverlapScore(candidate.label, picked.label) < 0.35;
    });
  };

  const takeBest = (
    slot: string,
    predicate: (row: ParsedCutRow) => boolean,
  ) => {
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestBaseScore = 0;
    let bestDiversityAdjustment = 0;

    remaining.forEach((row, index) => {
      if (!predicate(row)) {
        return;
      }

      const baseScore = scoreCutCandidate(row);
      const diversityAdjustment = getDiversityAdjustment(row, selected);
      const totalScore = baseScore + diversityAdjustment;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestIndex = index;
        bestBaseScore = baseScore;
        bestDiversityAdjustment = diversityAdjustment;
      }
    });

    if (bestIndex === -1) {
      return null;
    }

    const [row] = remaining.splice(bestIndex, 1);
    selected.push(row);
    selectionTrace.push({
      slot,
      start: row.start,
      end: row.end,
      shotType: row.shotType,
      label: row.label,
      detailRole:
        row.shotType === "food_detail"
          ? inferFoodDetailRole(row.label)
          : undefined,
      baseScore: Number(bestBaseScore.toFixed(3)),
      diversityAdjustment: Number(bestDiversityAdjustment.toFixed(3)),
      totalScore: Number(bestScore.toFixed(3)),
      hookStrength: row.hookStrength,
      visualClarity: row.visualClarity,
      shortformImpact: row.shortformImpact,
    });
    return row;
  };

  const isDistinctEnough = (candidate: ParsedCutRow) => {
    if (getSameSceneFamilyFoodDetailCount(candidate) >= 1) {
      return false;
    }

    return selected.every((picked) => {
      if (getOverlapRatio(candidate, picked) >= 0.45) {
        return false;
      }

      if (isSameSceneFamily(candidate, picked)) {
        if (candidate.shotType === picked.shotType) {
          return false;
        }

        if (
          candidate.shotType === "food_detail" &&
          picked.shotType === "food_detail"
        ) {
          return false;
        }
      }

      if (
        candidate.shotType === picked.shotType &&
        getKeywordOverlapScore(candidate.label, picked.label) >= 0.7
      ) {
        return false;
      }

      if (
        candidate.shotType === "food_detail" &&
        picked.shotType === "food_detail" &&
        inferFoodDetailRole(candidate.label) === inferFoodDetailRole(picked.label) &&
        getKeywordOverlapScore(candidate.label, picked.label) >= 0.45
      ) {
        return false;
      }

      return true;
    });
  };

  takeBest(
    "opening_hook_1",
    (row) => row.shotType === "food_hook",
  );
  takeBest(
    "food_variety_display",
    (row) =>
      row.shotType === "food_detail" &&
      inferFoodDetailRole(row.label) === "display" &&
      isDistinctEnough(row),
  );
  takeBest(
    "space_location",
    (row) => row.shotType === "location" && isDistinctEnough(row),
  );
  takeBest(
    "space_interior",
    (row) => row.shotType === "interior" && isDistinctEnough(row),
  );
  takeBest(
    "ending",
    (row) => row.shotType === "ending" && isDistinctEnough(row),
  );
  takeBest(
    "food_appeal_1",
    (row) =>
      row.shotType === "food_detail" &&
      ["action", "closeup", "serving", "eating"].includes(
        inferFoodDetailRole(row.label),
      ) &&
      isDistinctEnough(row),
  );
  takeBest(
    "food_variety_display_2",
    (row) => isDistinctDisplayEnough(row) && isDistinctEnough(row),
  );
  takeBest(
    "food_appeal_2",
    (row) =>
      row.shotType === "food_detail" &&
      ["action", "closeup", "eating", "serving"].includes(
        inferFoodDetailRole(row.label),
      ) &&
      isDistinctEnough(row),
  );

  const preferredFillOrder: Array<{
    name: string;
    predicate: (row: ParsedCutRow) => boolean;
  }> = [
    {
      name: "food_hook",
      predicate: (row) => row.shotType === "food_hook",
    },
    {
      name: "interior",
      predicate: (row) => row.shotType === "interior",
    },
    {
      name: "location",
      predicate: (row) => row.shotType === "location",
    },
    {
      name: "food_serving",
      predicate: (row) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "serving",
    },
    {
      name: "food_action",
      predicate: (row) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "action",
    },
    {
      name: "food_eating",
      predicate: (row) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "eating",
    },
    {
      name: "food_closeup",
      predicate: (row) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "closeup",
    },
    {
      name: "food_display",
      predicate: (row) => isDistinctDisplayEnough(row),
    },
    {
      name: "ending",
      predicate: (row) => row.shotType === "ending",
    },
  ];

  for (const entry of preferredFillOrder) {
    while (selected.length < maxCount) {
      let bestIndex = -1;
      let bestScore = Number.NEGATIVE_INFINITY;
      let bestBaseScore = 0;
      let bestDiversityAdjustment = 0;

      remaining.forEach((row, index) => {
        if (!entry.predicate(row) || !isDistinctEnough(row)) {
          return;
        }

        const baseScore = scoreCutCandidate(row);
        const diversityAdjustment = getDiversityAdjustment(row, selected);
        const totalScore = baseScore + diversityAdjustment;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestIndex = index;
          bestBaseScore = baseScore;
          bestDiversityAdjustment = diversityAdjustment;
        }
      });

      if (bestIndex === -1) {
        break;
      }

      const [row] = remaining.splice(bestIndex, 1);
      selected.push(row);
      selectionTrace.push({
        slot: `fill_${entry.name}`,
        start: row.start,
        end: row.end,
        shotType: row.shotType,
        label: row.label,
        detailRole:
          row.shotType === "food_detail"
            ? inferFoodDetailRole(row.label)
            : undefined,
        baseScore: Number(bestBaseScore.toFixed(3)),
        diversityAdjustment: Number(bestDiversityAdjustment.toFixed(3)),
        totalScore: Number(bestScore.toFixed(3)),
        hookStrength: row.hookStrength,
        visualClarity: row.visualClarity,
        shortformImpact: row.shortformImpact,
      });
    }
  }

  if (selected.length < minCount) {
    const fallbackPriority = [
      (row: ParsedCutRow) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "display",
      (row: ParsedCutRow) => row.shotType === "food_hook",
      (row: ParsedCutRow) => row.shotType === "interior",
      (row: ParsedCutRow) => row.shotType === "location",
      (row: ParsedCutRow) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "eating",
      (row: ParsedCutRow) =>
        row.shotType === "food_detail" &&
        inferFoodDetailRole(row.label) === "action",
      (row: ParsedCutRow) => row.shotType === "food_detail",
      (row: ParsedCutRow) => true,
    ];

    for (const predicate of fallbackPriority) {
      for (const row of remaining) {
        if (selected.length >= minCount) {
          break;
        }

        if (!predicate(row) || !isDistinctEnough(row)) {
          continue;
        }

        selected.push(row);
        selectionTrace.push({
          slot: "fallback_fill",
          start: row.start,
          end: row.end,
          shotType: row.shotType,
          label: row.label,
          detailRole:
            row.shotType === "food_detail"
              ? inferFoodDetailRole(row.label)
              : undefined,
          baseScore: Number(scoreCutCandidate(row).toFixed(3)),
          diversityAdjustment: Number(
            getDiversityAdjustment(row, selected.slice(0, -1)).toFixed(3),
          ),
          totalScore: Number(
            (
              scoreCutCandidate(row) +
              getDiversityAdjustment(row, selected.slice(0, -1))
            ).toFixed(3),
          ),
          hookStrength: row.hookStrength,
          visualClarity: row.visualClarity,
          shortformImpact: row.shortformImpact,
        });
      }

      if (selected.length >= minCount) {
        break;
      }
    }
  }

  return {
    selected,
    selectionTrace,
    selectionMode: selected.length >= minCount ? "normal" : "fallback",
  } as const;
}

function buildCutSelectionResult(
  rows: ParsedCutRow[],
  parseIssues: CutParseIssue[] = [],
  videoDuration?: number,
): CutSelectionResult {
  const validation = validateCandidateRows(rows, videoDuration);
  const dedupe = dedupeCutRows(validation.valid);
  const picked = pickBestCandidates(dedupe.deduped);
  const reordered = reorderCutRowsForStructure(picked.selected);
  const reorderedSet = new Set(
    reordered.map((row) => `${row.start}-${row.end}-${row.shotType}-${row.label}`),
  );

  const unselected = dedupe.deduped
    .filter(
      (row) =>
        !reorderedSet.has(`${row.start}-${row.end}-${row.shotType}-${row.label}`),
    )
    .map((row) => ({
      ...row,
      reason: "not_selected",
    }));

  return {
    candidates: dedupe.deduped,
    selected: reordered,
    removed: [...validation.removed, ...dedupe.removed, ...unselected],
    parseIssues,
    candidateDiagnostics: dedupe.deduped.map((row) => ({
      start: row.start,
      end: row.end,
      shotType: row.shotType,
      label: row.label,
      detailRole:
        row.shotType === "food_detail"
          ? inferFoodDetailRole(row.label)
          : undefined,
      baseScore: Number(scoreCutCandidate(row).toFixed(3)),
      isBridgeCandidate: isBridgeCandidate(row),
      hookStrength: row.hookStrength,
      visualClarity: row.visualClarity,
      shortformImpact: row.shortformImpact,
    })),
    selectionTrace: picked.selectionTrace,
    selectionMode: picked.selectionMode,
  };
}

function validateCutDurations(segments: AnalysisSegment[]) {
  if (segments.length === 0) {
    return;
  }

  const durations = segments.map((segment) => segment.end - segment.start);
  const tooShortCuts = segments.filter(
    (segment) => segment.end - segment.start < 1.5,
  );
  const twoSecondCuts = durations.filter(
    (duration) => duration >= 1.8 && duration <= 2.8,
  );
  const longCuts = durations.filter((duration) => duration >= 3 && duration <= 4);

  if (tooShortCuts.length > 0) {
    console.warn(
      `[Gemini] 컷 길이 권장 이탈: 1.5초 미만 컷 ${tooShortCuts.length}개`,
      tooShortCuts.map(
        (segment) =>
          `${segment.start.toFixed(1)}~${segment.end.toFixed(1)}(${(
            segment.end - segment.start
          ).toFixed(1)}s)`,
      ),
    );
  }

  if (twoSecondCuts.length < Math.ceil(segments.length * 0.6)) {
    console.warn(
      `[Gemini] 컷 길이 권장 이탈: 2초대 컷 비중 부족 total=${segments.length}, twoSecond=${twoSecondCuts.length}, long=${longCuts.length}`,
    );
  }
}

function parseCutsTable(text: string, videoDuration?: number): CutSelectionResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|"));

  const rows = lines.filter((line) => {
    if (line.includes(":---")) return false;
    if (line.includes("시간") && line.includes("화면")) return false;
    return true;
  });

  const parsedRows: ParsedCutRow[] = [];
  const parseIssues: CutParseIssue[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const cols = rows[i]
      .split("|")
      .map((col) => col.trim())
      .filter(Boolean);

    if (cols.length < 3) {
      parseIssues.push({
        line: rows[i],
        reason: "missing_columns",
      });
      continue;
    }

    try {
      const { start, end } = parseTimeRange(cols[0]);
      const shotType = parseShotType(cols[1] ?? "");
      const visual = cols[2] ?? "";

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        parseIssues.push({
          line: rows[i],
          reason: "invalid_range",
        });
        continue;
      }

      if (!shotType) {
        parseIssues.push({
          line: rows[i],
          reason: "invalid_type",
        });
        continue;
      }

      parsedRows.push({
        start,
        end,
        shotType,
        label: visual || `구간 ${i + 1}`,
        hookStrength: parseFivePointScore(cols[3], 3),
        visualClarity: parseFivePointScore(cols[4], 3),
        shortformImpact: parseFivePointScore(cols[5], 3),
      });
    } catch {
      parseIssues.push({
        line: rows[i],
        reason: "time_parse_failed",
      });
      continue;
    }
  }

  const selection = buildCutSelectionResult(
    parsedRows,
    parseIssues,
    videoDuration,
  );
  const segments = selection.selected.map(({ start, end, shotType, label }) => ({
    start,
    end,
    shotType,
    label,
  }));

  if (segments.length === 0) {
    throw new Error(`Gemini cuts table 파싱 실패\nraw:\n${text}`);
  }

  if (parseIssues.length > 0) {
    console.warn(
      `[Gemini] cuts parse 이슈 ${parseIssues.length}개`,
      parseIssues.slice(0, 10),
    );
  }

  validateCutDurations(segments);

  return selection;
}

function splitSubtitleChunks(value: string) {
  return value
    .split("/")
    .map((item) => cleanScript(item))
    .filter(Boolean);
}

function normalizeSubtitleChunks(texts: string[], fallbackSource: string[]) {
  const normalized = texts
    .map((item) => cleanScript(item))
    .filter(Boolean)
    .slice(0, MAX_SUBTITLE_CHUNKS);

  const fallback = fallbackSource
    .map((item) => cleanScript(item))
    .filter(Boolean);

  let fallbackIndex = 0;

  while (
    normalized.length < MIN_SUBTITLE_CHUNKS &&
    fallbackIndex < fallback.length
  ) {
    normalized.push(fallback[fallbackIndex]);
    fallbackIndex += 1;
  }

  while (normalized.length < MIN_SUBTITLE_CHUNKS) {
    normalized.push(`매장 정보 ${normalized.length + 1}`);
  }

  return normalized.slice(0, MAX_SUBTITLE_CHUNKS);
}

function buildSubtitleItems(texts: string[]): SubtitleItem[] {
  const safeTexts = texts.filter(Boolean);

  if (safeTexts.length === 0) {
    return [];
  }

  const unit = EARLY_INFO_DURATION / safeTexts.length;

  return safeTexts.map((text, index) => ({
    start: index * unit,
    end:
      index === safeTexts.length - 1
        ? EARLY_INFO_DURATION
        : (index + 1) * unit,
    text,
  }));
}

function buildFallbackSubtitleChunks(
  narration: string,
  heroSubtitle?: string,
): string[] {
  const candidate = narration || heroSubtitle || "매장 정보 소개";
  const baseChunks = candidate
    .split(/[.!?。！？]/)
    .map((item) => cleanScript(item))
    .filter(Boolean);

  return normalizeSubtitleChunks(baseChunks, [
    heroSubtitle ?? "",
    narration,
    "매장 정보 소개",
  ]);
}

function parseScriptResult(
  text: string,
  segments: AnalysisSegment[],
  storeInfo?: StoreInfo,
): AnalysisResult {
  const heroTitle =
    deriveRegionTitle(storeInfo?.address) ||
    pickField(text, ["제목", "heroTitle", "title"]) ||
    "맛집 숏폼";
  const heroSubtitle =
    storeInfo?.subtitle?.trim() ||
    pickField(text, ["부제목", "heroSubtitle", "subtitle"]) ||
    undefined;
  const narration =
    pickField(text, ["내레이션", "narration", "스크립트", "대본"]) ||
    [storeInfo?.address, storeInfo?.name, storeInfo?.strengths]
      .filter(Boolean)
      .join(". ");
  const subtitleChunkRaw = pickField(text, [
    "자막문장들",
    "subtitleChunks",
    "subtitles",
  ]);
  const subtitleChunks = splitSubtitleChunks(subtitleChunkRaw).length > 0
    ? normalizeSubtitleChunks(splitSubtitleChunks(subtitleChunkRaw), [
      heroSubtitle ?? "",
      narration,
      storeInfo?.address ?? "",
      storeInfo?.name ?? "",
      storeInfo?.strengths ?? "",
    ])
    : buildFallbackSubtitleChunks(narration, heroSubtitle);
  const subtitles = buildSubtitleItems(subtitleChunks);

  return {
    title: "맛집 숏폼",
    heroTitle,
    heroSubtitle,
    mood: "energetic",
    narration,
    bgmTags: ["food", "shortform", "instagram"],
    segments,
    subtitles,
  };
}

async function uploadVideoAndWaitUntilActive(ai: GoogleGenAI, videoPath: string) {
  console.log("[Gemini] 업로드 시작");

  let uploaded = (await ai.files.upload({
    file: videoPath,
    config: {
      mimeType: "video/mp4",
    },
  })) as GeminiFileLike;

  if (!uploaded.name) {
    throw new Error("Gemini 업로드 결과에 file name이 없습니다.");
  }

  console.log("[Gemini] 업로드 완료:", uploaded.name);
  console.log("[Gemini] 업로드 직후 상태:", fileStateToString(uploaded));

  if (fileStateToString(uploaded) !== "ACTIVE") {
    console.log("[Gemini] 파일 ACTIVE 대기 시작");
    uploaded = await waitUntilFileActive(ai, uploaded.name);
  }

  const fileUri = getFileUri(uploaded);
  const mimeType = getMimeType(uploaded);

  if (!fileUri) {
    throw new Error("Gemini ACTIVE 파일에서 fileUri를 찾지 못했습니다.");
  }

  return {
    fileUri,
    mimeType,
  };
}

async function requestCutsWithGemini(
  ai: GoogleGenAI,
  videoPath: string,
  storeInfo?: StoreInfo,
  jobId?: string,
  videoDuration?: number,
) {
  const prompt = loadPrompt("shortform-cuts.txt", storeInfo);
  const uploaded = await uploadVideoAndWaitUntilActive(ai, videoPath);

  console.log("[Gemini] 컷 분석 요청");

  const response = await generateContentWithRetry(ai, [
    {
      role: "user",
      parts: [
        {
          fileData: uploaded,
        },
        {
          text: prompt,
        },
      ],
    },
  ]);

  const text = response.text ?? "";

  if (!text.trim()) {
    throw new Error("Gemini 컷 분석 응답이 비어 있습니다.");
  }

  console.log(
    `[Gemini cuts raw${jobId ? ` job=${jobId}` : ""}]\n`,
    text,
  );

  const selection = parseCutsTable(text, videoDuration);
  const segments = selection.selected.map(({ start, end, shotType, label }) => ({
    start,
    end,
    shotType,
    label,
  }));

  console.log(
    `[Gemini] 후보 컷 ${selection.candidates.length}개 / 최종 선택 ${segments.length}개 / mode=${selection.selectionMode}`,
  );

  if (jobId) {
    const paths = ensureJobDirs(jobId);
    fs.writeFileSync(paths.cutsRawPath, text, "utf-8");
    fs.writeFileSync(
      paths.cutsParsedPath,
      JSON.stringify(
        {
          candidates: selection.candidates,
          candidateDiagnostics: selection.candidateDiagnostics,
          selected: segments,
          selectionTrace: selection.selectionTrace,
          removed: selection.removed,
          parseIssues: selection.parseIssues,
          selectionMode: selection.selectionMode,
        },
        null,
        2,
      ),
      "utf-8",
    );
  }

  return segments;
}

function buildCutSummary(segments: AnalysisSegment[]) {
  return segments
    .map(
      (segment, index) =>
        `${index + 1}. ${segment.start.toFixed(1)}~${segment.end.toFixed(1)} / ${segment.shotType} / ${segment.label}`,
    )
    .join("\n");
}

async function requestScriptWithGemini(
  ai: GoogleGenAI,
  segments: AnalysisSegment[],
  storeInfo?: StoreInfo,
) {
  const prompt = loadPrompt("shortform-script.txt", storeInfo);
  const cutSummary = buildCutSummary(segments);

  console.log("[Gemini] 대본 생성 요청");

  const response = await generateContentWithRetry(ai, [
    {
      role: "user",
      parts: [
        {
          text: `${prompt}

### 🎬 선택된 컷 요약

${cutSummary}
`,
        },
      ],
    },
  ]);

  const text = response.text ?? "";

  if (!text.trim()) {
    throw new Error("Gemini 대본 생성 응답이 비어 있습니다.");
  }

  console.log("[Gemini script raw]\n", text);

  return parseScriptResult(text, segments, storeInfo);
}

export async function analyzeVideoWithGemini(
  videoPath: string,
  storeInfo?: StoreInfo,
  jobId?: string,
  videoDuration?: number,
): Promise<AnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 없습니다.");
  }

  if (!fs.existsSync(videoPath)) {
    throw new Error(`영상 파일이 없습니다: ${videoPath}`);
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const segments = await requestCutsWithGemini(
    ai,
    videoPath,
    storeInfo,
    jobId,
    videoDuration,
  );
  return requestScriptWithGemini(ai, segments, storeInfo);
}

export async function regenerateScriptWithGemini(
  segments: AnalysisSegment[],
  storeInfo?: StoreInfo,
): Promise<AnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 없습니다.");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  return requestScriptWithGemini(ai, segments, storeInfo);
}
