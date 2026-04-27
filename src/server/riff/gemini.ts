import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { AnalysisResult, StoreInfo } from "./types";

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

function loadPrompt(storeInfo?: StoreInfo) {
  const filePath = path.join(process.cwd(), "src/prompts/shortform.txt");
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
- 오디오 스크립트와 대본의 핵심 내용은 **매장명, 주소, 가게 특장점** 이 3가지를 우선 재료로 삼아 작성하세요.
- 위 3가지 정보가 있다면, 대본과 TTS 문장 안에 자연스럽게 녹여서 사용하세요.
- title은 주소를 기준으로 대표 지역/도시명을 짧게 뽑아 작성하세요.
- 입력된 부제가 있으면 subtitle 작성 시 우선 참고하세요.
- 입력된 부제가 있으면 가능하면 그 문구를 최대한 유지하세요.
- 입력된 가게 특장점이 있으면 대사와 포인트 선정에 적극 반영하세요.
- subtitle은 매장 정보와 영상 내용을 조합해 한 줄 설명으로 작성하세요.
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

type ParsedRow = {
  start: number;
  end: number;
  label: string;
  text: string;
};

function dedupeParsedRows(rows: ParsedRow[]) {
  const sorted = [...rows].sort((a, b) => a.start - b.start);
  const deduped: ParsedRow[] = [];

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

function parseGeminiTable(text: string): AnalysisResult {
  const heroTitle =
    pickField(text, ["제목", "heroTitle", "title"]) || "맛집 숏폼";
  const heroSubtitle =
    pickField(text, ["부제목", "heroSubtitle", "subtitle"]) || undefined;
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|"));

  const rows = lines.filter((line) => {
    if (line.includes(":---")) return false;
    if (line.includes("시간") && line.includes("오디오")) return false;
    return true;
  });

  const parsedRows: ParsedRow[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const cols = rows[i]
      .split("|")
      .map((col) => col.trim())
      .filter(Boolean);

    if (cols.length < 3) continue;

    try {
      const { start, end } = parseTimeRange(cols[0]);
      const visual = cols[1] ?? "";
      const script = cleanScript(cols[2] ?? "");

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        continue;
      }

      if (!script) {
        continue;
      }

      parsedRows.push({
        start,
        end,
        label: visual || `구간 ${i + 1}`,
        text: script,
      });
    } catch {
      continue;
    }
  }

  const dedupedRows = dedupeParsedRows(parsedRows);
  const segments = dedupedRows.map(({ start, end, label }) => ({
    start,
    end,
    label,
  }));
  const subtitles = dedupedRows.map(({ start, end, text }) => ({
    start,
    end,
    text,
  }));

  if (segments.length === 0) {
    throw new Error(`Gemini table 파싱 실패\nraw:\n${text}`);
  }

  return {
    title: "맛집 숏폼",
    heroTitle,
    heroSubtitle,
    mood: "energetic",
    narration: subtitles.map((item) => item.text).join(" "),
    bgmTags: ["food", "shortform", "instagram"],
    segments,
    subtitles,
  };
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

  const prompt = loadPrompt(storeInfo);

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

  console.log("[Gemini] 분석 요청");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  const text = response.text ?? "";

  if (!text.trim()) {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  console.log("[Gemini raw]\n", text);

  return parseGeminiTable(text);
}
