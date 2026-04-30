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

const FINAL_SCRIPT_DURATION = 30;
const EARLY_INFO_DURATION = 7;
const TARGET_SUBTITLE_CHUNKS = 7;

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

function deriveRegionTitle(address?: string) {
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

function dedupeCutRows(rows: ParsedCutRow[]) {
  const sorted = [...rows].sort((a, b) => a.start - b.start);
  const deduped: ParsedCutRow[] = [];

  for (const row of sorted) {
    const previous = deduped[deduped.length - 1];

    if (!previous) {
      deduped.push(row);
      continue;
    }

    const overlap = Math.min(previous.end, row.end) - Math.max(previous.start, row.start);
    const almostSameWindow =
      Math.abs(previous.start - row.start) < 1.5 &&
      Math.abs(previous.end - row.end) < 1.5;

    if (overlap >= 0.75 || almostSameWindow) {
      continue;
    }

    deduped.push(row);
  }

  return deduped;
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

function parseCutsTable(text: string): AnalysisSegment[] {
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

  for (let i = 0; i < rows.length; i += 1) {
    const cols = rows[i]
      .split("|")
      .map((col) => col.trim())
      .filter(Boolean);

    if (cols.length < 3) continue;

    try {
      const { start, end } = parseTimeRange(cols[0]);
      const shotType = parseShotType(cols[1] ?? "");
      const visual = cols[2] ?? "";

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        continue;
      }

      if (!shotType) {
        continue;
      }

      parsedRows.push({
        start,
        end,
        shotType,
        label: visual || `구간 ${i + 1}`,
      });
    } catch {
      continue;
    }
  }

  const dedupedRows = dedupeCutRows(parsedRows);
  const segments = dedupedRows.map(({ start, end, shotType, label }) => ({
    start,
    end,
    shotType,
    label,
  }));

  if (segments.length === 0) {
    throw new Error(`Gemini cuts table 파싱 실패\nraw:\n${text}`);
  }

  validateCutDurations(segments);

  return segments;
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
    .slice(0, TARGET_SUBTITLE_CHUNKS);

  const fallback = fallbackSource
    .map((item) => cleanScript(item))
    .filter(Boolean);

  let fallbackIndex = 0;

  while (
    normalized.length < TARGET_SUBTITLE_CHUNKS &&
    fallbackIndex < fallback.length
  ) {
    normalized.push(fallback[fallbackIndex]);
    fallbackIndex += 1;
  }

  while (normalized.length < TARGET_SUBTITLE_CHUNKS) {
    normalized.push(`매장 정보 ${normalized.length + 1}`);
  }

  return normalized.slice(0, TARGET_SUBTITLE_CHUNKS);
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

  console.log("[Gemini cuts raw]\n", text);

  return parseCutsTable(text);
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

  const segments = await requestCutsWithGemini(ai, videoPath, storeInfo);
  return requestScriptWithGemini(ai, segments, storeInfo);
}
