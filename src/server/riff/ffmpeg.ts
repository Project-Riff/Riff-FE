import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { AnalysisSegment, SceneChunk } from "./types";
import { SfxCue } from "./sfx";

type ProbeResult = {
  duration: number;
  width?: number;
  height?: number;
};

export const FINAL_VIDEO_DURATION = 20;
export const MAX_FINAL_VIDEO_DURATION = 22;
export const TARGET_WIDTH = 1080;
export const TARGET_HEIGHT = 1920;
const SUBTITLE_TOP_RATIO = 0.65;
const CLIP_EDGE_TRIM = 0.05;
const FADE_TRANSITION_DURATION = 0.15;

type StoreShortformLookPreset = "balance" | "vivid" | "mild";

type StoreShortformLookOptions = {
  preset?: StoreShortformLookPreset;
  useVignette?: boolean;
};

export function buildStoreShortformLookFilter(
  options: StoreShortformLookOptions = {},
) {
  const { preset = "balance", useVignette } = options;

  const presetFilters: Record<StoreShortformLookPreset, string[]> = {
    balance: [
      // Neutralize warm cast first so whites and signage stay cleaner.
      "colorbalance=rs=-0.035:gs=-0.015:bs=0.035:rm=-0.02:gm=0.00:bm=0.02:rh=-0.03:gh=-0.01:bh=0.04",
      // Gentle exposure lift while preserving bright dishes and windows.
      "eq=brightness=0.008:gamma=1.01",
      // Mild highlight rolloff so white plates and cafe lights do not blow out.
      "curves=all='0/0 0.18/0.18 0.54/0.53 0.84/0.81 1/0.98'",
      // Stronger overall definition without crushing the frame.
      "eq=contrast=1.08",
      // Keep texture on food, drink foam, signage, and interiors.
      "unsharp=5:5:0.72:5:5:0.0",
      // Balanced color lift for food + cafe + storefront mixed clips.
      "eq=saturation=1.10",
      "vibrance=intensity=0.12:rbal=1.03:gbal=0.99:bbal=0.98",
    ],
    vivid: [
      // A stronger commercial preset for punchier reels.
      "colorbalance=rs=-0.025:gs=-0.01:bs=0.025:rm=-0.01:gm=0.00:bm=0.015:rh=-0.02:gh=-0.005:bh=0.03",
      "eq=brightness=0.010:gamma=1.01",
      "curves=all='0/0 0.16/0.15 0.50/0.49 0.82/0.86 1/1'",
      "eq=contrast=1.12",
      "unsharp=5:5:0.84:5:5:0.0",
      "eq=saturation=1.16",
      "vibrance=intensity=0.18:rbal=1.05:gbal=0.99:bbal=0.97",
    ],
    mild: [
      // Safe preset for already vivid or bright footage.
      "colorbalance=rs=-0.02:gs=-0.01:bs=0.02:rm=-0.01:gm=0.00:bm=0.01:rh=-0.015:gh=0.00:bh=0.02",
      "eq=brightness=0.004:gamma=1.00",
      "curves=all='0/0 0.20/0.20 0.55/0.55 0.85/0.84 1/0.99'",
      "eq=contrast=1.04",
      "unsharp=5:5:0.48:5:5:0.0",
      "eq=saturation=1.05",
      "vibrance=intensity=0.06:rbal=1.01:gbal=1.00:bbal=0.99",
    ],
  };

  const filters = [...presetFilters[preset]];

  if (useVignette ?? preset === "vivid") {
    filters.push("vignette=angle=PI/6:mode=forward");
  }

  return filters.join(",");
}

function buildSubtitleFilter(subtitlePath: string) {
  const escapedSubtitlePath = escapeSubtitlePathForFfmpeg(subtitlePath);
  const marginV = Math.round(TARGET_HEIGHT * SUBTITLE_TOP_RATIO);
  const forceStyle = [
    "Alignment=8",
    `MarginV=${marginV}`,
    "FontName=Apple SD Gothic Neo",
    "FontSize=10",
    "Bold=0",
    "PrimaryColour=&H00FFFFFF",
    "OutlineColour=&H001A120E",
    "Outline=1",
    "Shadow=0",
    "Spacing=0.2",
    "BackColour=&H00000000",
  ].join(",");

  return `subtitles=filename='${escapedSubtitlePath}':force_style='${forceStyle}'`;
}

function buildVerticalCoverFilter(extraFilters: string[] = []) {
  const filters = [
    `scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${TARGET_WIDTH}:${TARGET_HEIGHT}`,
    ...extraFilters,
    "fps=60",
    "format=yuv420p",
  ];

  return filters.join(",");
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} 실행 실패 (code=${code})\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });
}

function runCommandCapture(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(
        new Error(
          `${command} 실행 실패 (code=${code})\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });
}

function runCommandCaptureCombined(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code === 0) {
        resolve(`${stdout}\n${stderr}`.trim());
        return;
      }

      reject(
        new Error(
          `${command} 실행 실패 (code=${code})\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });
}

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export async function compressVideoForAnalysis(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  ensureParentDir(outputPath);

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale='min(1080,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
    "-maxrate",
    "8M",
    "-bufsize",
    "16M",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    outputPath,
  ]);
}

export async function detectStableSceneChunks(
  videoPath: string,
  options: {
    sceneThreshold?: number;
    minChunkDuration?: number;
  } = {},
): Promise<SceneChunk[]> {
  const { sceneThreshold = 0.24, minChunkDuration = 2.2 } = options;
  const meta = await probeVideo(videoPath);
  const duration = meta.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`scene chunk 분석 실패: ${videoPath}`);
  }

  const rawOutput = await runCommandCaptureCombined("ffmpeg", [
    "-hide_banner",
    "-i",
    videoPath,
    "-filter:v",
    `select='gt(scene,${sceneThreshold})',metadata=print:file=-`,
    "-an",
    "-f",
    "null",
    "-",
  ]);

  const matches = Array.from(
    rawOutput.matchAll(/pts_time:([0-9]+(?:\.[0-9]+)?)/g),
  );
  const sceneTimes = Array.from(
    new Set(
      matches
        .map((match) => Number(match[1]))
        .filter(
          (time) =>
            Number.isFinite(time) &&
            time > 0.2 &&
            time < duration - 0.2,
        )
        .map((time) => Number(time.toFixed(3))),
    ),
  ).sort((a, b) => a - b);

  const boundaries = [0, ...sceneTimes, duration];
  const chunks: SceneChunk[] = [];

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = Number(boundaries[index].toFixed(3));
    const end = Number(boundaries[index + 1].toFixed(3));
    const chunkDuration = Number((end - start).toFixed(3));

    if (chunkDuration < minChunkDuration) {
      continue;
    }

    chunks.push({
      id: `c${String(chunks.length + 1).padStart(2, "0")}`,
      start,
      end,
      duration: chunkDuration,
    });
  }

  if (chunks.length === 0) {
    return [
      {
        id: "c01",
        start: 0,
        end: Number(duration.toFixed(3)),
        duration: Number(duration.toFixed(3)),
      },
    ];
  }

  return chunks;
}

function escapeSubtitlePathForFfmpeg(filePath: string) {
  return filePath
    .replace(/\\/g, "/")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/,/g, "\\,");
}

function normalizeSegments(segments: AnalysisSegment[]) {
  return segments
    .map((segment, index) => ({
      ...segment,
      start: Number(segment.start),
      end: Number(segment.end),
      label: segment.label ?? `구간 ${index + 1}`,
    }))
    .filter((segment) => {
      return (
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        segment.start >= 0 &&
        segment.end > segment.start
      );
    });
}

export async function probeVideo(videoPath: string): Promise<ProbeResult> {
  const output = await runCommandCapture("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    videoPath,
  ]);

  const parsed = JSON.parse(output) as {
    format?: { duration?: string };
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
    }>;
  };

  const duration = Number(parsed?.format?.duration ?? 0);
  const videoStream = parsed?.streams?.find(
    (stream) => stream.codec_type === "video",
  );

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`영상 길이 분석 실패: ${videoPath}`);
  }

  return {
    duration,
    width: videoStream?.width,
    height: videoStream?.height,
  };
}

export async function hasSubtitlesFilter(): Promise<boolean> {
  const output = await runCommandCapture("ffmpeg", ["-filters"]);
  return /\bsubtitles\b/.test(output);
}

export async function cutSegments(
  sourcePath: string,
  segments: AnalysisSegment[],
  clipsDir: string,
): Promise<string[]> {
  fs.mkdirSync(clipsDir, { recursive: true });

  const normalizedSegments = normalizeSegments(segments);

  if (normalizedSegments.length === 0) {
    throw new Error("cutSegments: 유효한 segments가 없습니다.");
  }

  const clipPaths: string[] = [];

  for (let i = 0; i < normalizedSegments.length; i += 1) {
    const segment = normalizedSegments[i];
    const clipPath = path.join(clipsDir, `clip_${i + 1}.mp4`);
    const duration = Math.max(0.1, segment.end - segment.start);

    ensureParentDir(clipPath);

    await runCommand("ffmpeg", [
      "-y",
      "-i",
      sourcePath,
      "-ss",
      String(segment.start),
      "-t",
      String(duration),
      "-vf",
      buildVerticalCoverFilter(),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-c:a",
      "aac",
      clipPath,
    ]);

    clipPaths.push(clipPath);
  }

  return clipPaths;
}

export async function retimeClipToDuration(
  inputPath: string,
  outputPath: string,
  targetDuration: number,
): Promise<void> {
  const meta = await probeVideo(inputPath);
  const currentDuration = meta.duration;

  if (!Number.isFinite(currentDuration) || currentDuration <= 0) {
    throw new Error(`clip duration 분석 실패: ${inputPath}`);
  }

  if (!Number.isFinite(targetDuration) || targetDuration <= 0) {
    throw new Error(`targetDuration이 잘못되었습니다: ${targetDuration}`);
  }

  ensureParentDir(outputPath);

  const speedFactor = targetDuration / currentDuration;

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    buildVerticalCoverFilter([`setpts=${speedFactor.toFixed(6)}*PTS`]),
    "-t",
    String(targetDuration),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-c:a",
    "aac",
    outputPath,
  ]);
}

export async function trimClipToDuration(
  inputPath: string,
  outputPath: string,
  targetDuration: number,
): Promise<void> {
  if (!Number.isFinite(targetDuration) || targetDuration <= 0) {
    throw new Error(`targetDuration이 잘못되었습니다: ${targetDuration}`);
  }

  ensureParentDir(outputPath);

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-t",
    String(targetDuration),
    "-vf",
    buildVerticalCoverFilter(),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-c:a",
    "aac",
    outputPath,
  ]);
}

export async function normalizeClipsForTimeline(
  clipPaths: string[],
  outputDir: string,
): Promise<string[]> {
  if (clipPaths.length === 0) {
    throw new Error("normalizeClipsForTimeline: clipPaths가 비어 있습니다.");
  }

  fs.mkdirSync(outputDir, { recursive: true });
  return clipPaths;
}

export async function concatClips(
  clipPaths: string[],
  outputPath: string,
): Promise<void> {
  if (clipPaths.length === 0) {
    throw new Error("concatClips: clipPaths가 비어 있습니다.");
  }

  ensureParentDir(outputPath);

  if (clipPaths.length === 1) {
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      clipPaths[0],
      "-vf",
      buildVerticalCoverFilter(),
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-c:a",
      "aac",
      outputPath,
    ]);
    return;
  }

  const durations = await Promise.all(
    clipPaths.map(async (clipPath) => {
      const meta = await probeVideo(clipPath);
      return meta.duration;
    }),
  );

  const inputArgs = clipPaths.flatMap((clipPath) => ["-i", clipPath]);
  const filterParts: string[] = [];
  const effectiveDurations: number[] = [];

  for (let i = 0; i < clipPaths.length; i += 1) {
    const duration = durations[i];
    const startTrim = i === 0 ? 0 : Math.min(CLIP_EDGE_TRIM, duration / 8);
    const endTrim =
      i === clipPaths.length - 1 ? 0 : Math.min(CLIP_EDGE_TRIM, duration / 8);
    const trimmedEnd = Math.max(startTrim + 0.1, duration - endTrim);
    const effectiveDuration = Math.max(0.1, trimmedEnd - startTrim);
    effectiveDurations.push(effectiveDuration);

    filterParts.push(
      `[${i}:v]trim=start=${startTrim.toFixed(3)}:end=${trimmedEnd.toFixed(3)},setpts=PTS-STARTPTS,scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase,crop=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=60,format=yuv420p[v${i}]`,
    );
    filterParts.push(
      `[${i}:a]atrim=start=${startTrim.toFixed(3)}:end=${trimmedEnd.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000[a${i}]`,
    );
  }

  let currentVideoLabel = "v0";
  let currentAudioLabel = "a0";
  let accumulatedDuration = effectiveDurations[0];

  for (let i = 1; i < clipPaths.length; i += 1) {
    const transitionDuration = Math.min(
      FADE_TRANSITION_DURATION,
      Math.max(0.03, Math.min(accumulatedDuration, effectiveDurations[i]) / 4),
    );
    const offset = Math.max(0, accumulatedDuration - transitionDuration);
    const nextVideoLabel = `vx${i}`;
    const nextAudioLabel = `ax${i}`;

    filterParts.push(
      `[${currentVideoLabel}][v${i}]xfade=transition=fade:duration=${transitionDuration.toFixed(3)}:offset=${offset.toFixed(3)}[${nextVideoLabel}]`,
    );
    filterParts.push(
      `[${currentAudioLabel}][a${i}]acrossfade=d=${transitionDuration.toFixed(3)}[${nextAudioLabel}]`,
    );

    currentVideoLabel = nextVideoLabel;
    currentAudioLabel = nextAudioLabel;
    accumulatedDuration += effectiveDurations[i] - transitionDuration;
  }

  await runCommand("ffmpeg", [
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    `[${currentVideoLabel}]`,
    "-map",
    `[${currentAudioLabel}]`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-c:a",
    "aac",
    outputPath,
  ]);
}

export async function muxVideoWithAudioAndSubtitles(
  videoPath: string,
  audioPath: string,
  subtitlePath: string | undefined,
  outputPath: string,
  sfxCues: SfxCue[] = [],
): Promise<void> {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`videoPath가 없습니다: ${videoPath}`);
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error(`audioPath가 없습니다: ${audioPath}`);
  }

  const validSfxCues = sfxCues.filter((cue) => fs.existsSync(cue.filePath));

  ensureParentDir(outputPath);
  const videoMeta = await probeVideo(videoPath);
  const outputDuration = videoMeta.duration;
  const extraFilters: string[] = [
    buildStoreShortformLookFilter({ preset: "balance" }),
  ];

  if (subtitlePath) {
    if (!fs.existsSync(subtitlePath)) {
      throw new Error(`subtitlePath가 없습니다: ${subtitlePath}`);
    }

    const subtitlesAvailable = await hasSubtitlesFilter();

    if (!subtitlesAvailable) {
      throw new Error(
        "현재 ffmpeg 빌드에 subtitles 필터가 없습니다. ffmpeg를 libass 포함 빌드로 다시 설치해야 합니다.",
      );
    }

    extraFilters.push(buildSubtitleFilter(subtitlePath));
  }

  const sfxInputArgs = validSfxCues.flatMap((cue) => ["-i", cue.filePath]);
  const filterParts = [
    `[0:a]volume=0.8[a0]`,
    `[1:a]volume=2.6,apad,atrim=0:${outputDuration}[a1]`,
  ];
  const amixInputs = ["[a0]", "[a1]"];

  validSfxCues.forEach((cue, index) => {
    const inputIndex = index + 2;
    const label = `sfx${index}`;
    const delayMs = Math.max(0, Math.round(cue.startSec * 1000));
    const trimToSec = Math.max(0.2, cue.trimToSec);

    filterParts.push(
      `[${inputIndex}:a]volume=${cue.volume},atrim=0:${trimToSec.toFixed(3)},adelay=${delayMs}|${delayMs},aresample=48000[${label}]`,
    );
    amixInputs.push(`[${label}]`);
  });

  filterParts.push(
    `${amixInputs.join("")}amix=inputs=${amixInputs.length}:duration=first:dropout_transition=0[aout]`,
  );

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    ...sfxInputArgs,
    ...(extraFilters.length > 0
      ? ["-vf", buildVerticalCoverFilter(extraFilters)]
      : []),
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    "-t",
    String(outputDuration),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-c:a",
    "aac",
    outputPath,
  ]);
}
