import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { AnalysisResult, SubtitleItem } from "./types";

type GeminiMood = AnalysisResult["mood"];

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

const ANALYSIS_SCHEMA = {
  type: "object",
  propertyOrdering: [
    "title",
    "mood",
    "narration",
    "bgmTags",
    "segments",
    "subtitles",
  ],
  required: ["title", "mood", "narration", "bgmTags", "segments", "subtitles"],
  properties: {
    title: {
      type: "string",
    },
    mood: {
      type: "string",
      enum: ["energetic", "cozy", "premium", "cute"],
    },
    narration: {
      type: "string",
    },
    bgmTags: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "string",
      },
    },
    segments: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        propertyOrdering: ["start", "end", "label"],
        required: ["start", "end", "label"],
        properties: {
          start: {
            type: "number",
          },
          end: {
            type: "number",
          },
          label: {
            type: "string",
          },
        },
      },
    },
    subtitles: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        propertyOrdering: ["start", "end", "text"],
        required: ["start", "end", "text"],
        properties: {
          start: {
            type: "number",
          },
          end: {
            type: "number",
          },
          text: {
            type: "string",
          },
        },
      },
    },
  },
} as const;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 타임아웃 (${ms / 1000}초)`)), ms),
    ),
  ]);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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

function isValidMood(value: unknown): value is GeminiMood {
  return (
    value === "energetic" ||
    value === "cozy" ||
    value === "premium" ||
    value === "cute"
  );
}

function normalizeSubtitles(
  subtitles: unknown,
  maxDuration = 30,
): SubtitleItem[] {
  if (!Array.isArray(subtitles)) return [];

  const normalized = subtitles
    .map((sub) => ({
      start: Number((sub as SubtitleItem)?.start ?? 0),
      end: Number((sub as SubtitleItem)?.end ?? 0),
      text:
        typeof (sub as SubtitleItem)?.text === "string" &&
        (sub as SubtitleItem).text.trim()
          ? (sub as SubtitleItem).text.trim()
          : "",
    }))
    .filter((sub) => {
      const valid =
        Number.isFinite(sub.start) &&
        Number.isFinite(sub.end) &&
        sub.start >= 0 &&
        sub.end > sub.start &&
        sub.end <= maxDuration &&
        sub.text.length > 0;

      if (!valid) {
        console.warn("[Gemini] invalid subtitle dropped:", sub);
      }

      return valid;
    })
    .sort((a, b) => a.start - b.start)
    .slice(0, 8);

  return normalized;
}

function normalizeAnalysis(
  parsed: Partial<AnalysisResult>,
  videoDuration: number,
): AnalysisResult {
  const rawSegments = Array.isArray(parsed.segments) ? parsed.segments : [];

  const safeSegments = rawSegments
    .map((segment, index) => ({
      start: Number(segment?.start ?? 0),
      end: Number(segment?.end ?? 0),
      label:
        typeof segment?.label === "string" && segment.label.trim()
          ? segment.label.trim()
          : `구간 ${index + 1}`,
    }))
    .filter((segment) => {
      const valid =
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        segment.start >= 0 &&
        segment.end > segment.start &&
        segment.end <= videoDuration;

      if (!valid) {
        console.warn("[Gemini] invalid segment dropped:", {
          segment,
          videoDuration,
        });
      }

      return valid;
    })
    .slice(0, 4);

  if (safeSegments.length !== 4) {
    throw new Error(
      `Gemini가 유효한 4개 segments를 반환하지 않았습니다. count=${safeSegments.length}, videoDuration=${videoDuration}`,
    );
  }

  const safeSubtitles = normalizeSubtitles(parsed.subtitles, 30);

  if (safeSubtitles.length === 0) {
    throw new Error("Gemini가 유효한 subtitles를 반환하지 않았습니다.");
  }

  const mood: GeminiMood = isValidMood(parsed.mood)
    ? parsed.mood
    : "energetic";

  return {
    title:
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : "또 먹고 싶은 한 컷",
    mood,
    narration:
      typeof parsed.narration === "string" && parsed.narration.trim()
        ? parsed.narration.trim()
        : "또 먹고 싶은 이 집의 메뉴입니다. 이 비주얼은 그냥 지나치면 손해예요. 저장해두고 한 번은 꼭 가봐야 할 맛입니다.",
    bgmTags: Array.isArray(parsed.bgmTags)
      ? parsed.bgmTags
          .filter((tag): tag is string => typeof tag === "string" && !!tag.trim())
          .slice(0, 4)
      : ["upbeat", "food", "trendy"],
    segments: safeSegments,
    subtitles: safeSubtitles,
  };
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
      `[Gemini] 파일 상태 확인: ${state} / 경과 ${(
        elapsed / 1000
      ).toFixed(1)}초 / uri=${getFileUri(current) ?? "N/A"} / mime=${getMimeType(current)}`,
    );

    if (state === "ACTIVE") {
      return current;
    }

    if (state === "FAILED") {
      throw new Error(
        `Gemini 파일 처리 실패: ${safeJson({
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

function buildPrompt(videoDuration: number) {
  return `
# 시스템 역할 정의: 전문 숏폼 영상 디렉터 + 카피라이터

당신은 단순 분석가가 아니라,
"30초짜리 인스타 숏폼을 설계하는 영상 편집자"입니다.

이 영상에서 가장 매력적인 장면을 구조적으로 배치하여
완성형 숏폼을 설계하세요.

# 최종 목표
- 총 길이 28~30초 숏폼 구성
- Hook → Body A → Body B → CTA 구조 필수
- 영상 흐름이 자연스럽게 이어져야 함

# 영상 구성 구조 (반드시 이 구조 따를 것)

1. Hook
- 최종 숏폼 기준 0~2초 역할
- 가장 강한 장면
- 음식 비주얼 / 자극적인 컷
- 스크롤 멈추는 역할
- 원본 구간 길이도 2초 전후로 선택

2. Body A
- 최종 숏폼 기준 2~10초 역할
- 조리 과정 / 핵심 장면
- 빠른 컷 전환 느낌
- 원본 구간 길이는 7~8초 전후

3. Body B
- 최종 숏폼 기준 10~22초 역할
- 완성 / 먹는 장면 / 디테일
- 슬로우, 클로즈업 느낌
- 원본 구간 길이는 11~12초 전후

4. CTA
- 최종 숏폼 기준 22~30초 역할
- 다시 먹고 싶게 만드는 장면
- 저장 유도
- 원본 구간 길이는 7~8초 전후

# segments 규칙
- 반드시 4개 반환 (Hook / Body A / Body B / CTA)
- 각 segment의 start, end는 반드시 원본 영상 기준 timestamp
- Hook, Body A, Body B, CTA 순서대로 반환
- label은 반드시 Hook, Body A, Body B, CTA 중 하나로 작성
- 모든 segment는 반드시 원본 영상 길이 안에 있어야 한다
- 절대 videoDuration을 넘는 timestamp를 만들지 마라
- 4개 segment 길이의 총합은 반드시 28~30초가 되도록 맞춰라
- 자연스럽게 이어지는 장면을 선택하되, 총 길이 규칙을 우선한다

예:
Hook: 120~122
Body A: 30~38
Body B: 70~82
CTA: 150~158

# narration 규칙
- 반드시 한국어 구어체
- 2~3문장
- 전체 영상 설명이 아니라, 반드시 선택된 4개 segment 흐름만 설명
- 첫 문장은 반드시:
  또 먹고 싶은 [가게명]의 [음식 이름]입니다.
- 길고 장황하게 쓰지 말고, 30초 숏폼에 맞게 짧고 강하게 작성

# subtitles 규칙
- subtitles는 최종 숏폼 타임라인 기준으로 작성
- 즉 start, end는 원본 영상 시간이 아니라 최종 편집본 기준 0~30초 사이여야 한다
- 총 4~6개 생성
- 각 subtitle은 Hook → Body A → Body B → CTA 흐름을 따라야 한다
- 짧고 강하게, 한 줄 또는 두 줄 분량
- 실제 인스타 숏폼 느낌으로 작성
- subtitle 시간은 반드시 0초 이상 30초 이하
- subtitle 순서는 시간 순이어야 함
- 가능한 한 아래 구조를 따를 것:
  - Hook: 0~2
  - Body A: 2~10
  - Body B: 10~22
  - CTA: 22~30

예:
0~2초: 강한 Hook
2~10초: 빠른 정보
10~22초: 디테일/몰입
22~30초: 저장 유도

# 자막 스타일 예시
- 이거 미쳤다
- 겉바속쫀 레전드
- 갓 튀긴 비주얼
- 이건 저장해야지

# 기타
- mood: energetic | cozy | premium | cute
- bgmTags: 2~4개

# 절대 규칙
- segments는 반드시 4개
- subtitles는 최종 숏폼 기준 0~30초 사용
- narration은 segments 흐름과 반드시 일치
- 전체 영상 설명 금지
- videoDuration을 벗어나는 timestamp 절대 금지
- JSON schema를 반드시 준수

이 영상의 길이는 ${videoDuration.toFixed(1)}초이다.
  `.trim();
}

export async function analyzeVideoWithGemini(
  videoPath: string,
  videoDuration: number,
): Promise<AnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 없습니다.");
  }

  if (!fs.existsSync(videoPath)) {
    throw new Error(`영상 파일이 없습니다: ${videoPath}`);
  }

  if (!Number.isFinite(videoDuration) || videoDuration <= 0) {
    throw new Error(`유효하지 않은 videoDuration 입니다: ${videoDuration}`);
  }

  const stat = fs.statSync(videoPath);
  const ext = path.extname(videoPath).toLowerCase();

  if (![".mp4", ".mov", ".m4v", ".webm"].includes(ext)) {
    console.warn(`[Gemini] 경고: 일반적인 비디오 확장자가 아닙니다: ${ext}`);
  }

  console.log("[Gemini] 분석 시작:", videoPath);
  console.log(
    "[Gemini] 입력 파일 크기(MB):",
    (stat.size / 1024 / 1024).toFixed(2),
  );
  console.log("[Gemini] 입력 영상 길이(초):", videoDuration.toFixed(2));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  console.log("[Gemini] 영상 업로드 시작...");
  const uploadStartedAt = Date.now();

  let uploaded: GeminiFileLike;

  try {
    uploaded = (await withTimeout(
      ai.files.upload({
        file: videoPath,
        config: {
          mimeType: "video/mp4",
        },
      }),
      5 * 60 * 1000,
      "Gemini 영상 업로드",
    )) as GeminiFileLike;
  } catch (error) {
    console.error("[Gemini] 업로드 실패:", error);
    throw error;
  }

  console.log(
    "[Gemini] 업로드 완료:",
    uploaded.name,
    `(${((Date.now() - uploadStartedAt) / 1000).toFixed(1)}초)`,
  );
  console.log("[Gemini] 업로드 응답(raw):", safeJson(uploaded));

  const uploadedName = uploaded.name;
  if (!uploadedName) {
    throw new Error(
      `Gemini 업로드 결과에서 file name을 찾지 못했습니다. raw=${safeJson(uploaded)}`,
    );
  }

  const initialState = fileStateToString(uploaded);
  console.log("[Gemini] 업로드 직후 파일 상태:", initialState);

  if (initialState !== "ACTIVE") {
    console.log("[Gemini] 비디오 처리 완료 대기 중...");
    uploaded = await waitUntilFileActive(ai, uploadedName);
    console.log("[Gemini] 비디오 처리 완료:", uploadedName);
  }

  const fileUri = getFileUri(uploaded);
  const mimeType = getMimeType(uploaded);

  if (!fileUri) {
    throw new Error(
      `Gemini 업로드 결과에서 fileUri를 찾지 못했습니다. raw=${safeJson(uploaded)}`,
    );
  }

  console.log(
    "[Gemini] 최종 파일 참조:",
    safeJson({
      name: uploaded.name,
      state: fileStateToString(uploaded),
      uri: fileUri,
      mimeType,
    }),
  );

  const prompt = buildPrompt(videoDuration);

  console.log("[Gemini] 분석 요청 시작...");
  const requestStartedAt = Date.now();

  let response: Awaited<ReturnType<typeof ai.models.generateContent>>;

  try {
    response = await withTimeout(
      ai.models.generateContent({
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
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: ANALYSIS_SCHEMA,
          temperature: 0.4,
        },
      }),
      10 * 60 * 1000,
      "Gemini 분석 요청",
    );
  } catch (error) {
    console.error("[Gemini] generateContent 실패:", error);
    throw error;
  }

  console.log(
    "[Gemini] 응답 수신 완료:",
    `${((Date.now() - requestStartedAt) / 1000).toFixed(1)}초`,
  );

  const text = response.text ?? "";
  console.log("[Gemini] 응답 원문:", text);

  if (!text.trim()) {
    throw new Error("Gemini 응답 text가 비어 있습니다.");
  }

  let parsed: Partial<AnalysisResult>;
  try {
    parsed = JSON.parse(text) as Partial<AnalysisResult>;
  } catch (error) {
    console.error("[Gemini] JSON 파싱 실패. 원문:", text);
    throw new Error(
      `Gemini JSON 파싱 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const normalized = normalizeAnalysis(parsed, videoDuration);

  console.log("[Gemini] 분석 완료 - 구간 수:", normalized.segments.length);
  console.log("[Gemini] 분석 결과:", safeJson(normalized));

  return normalized;
}