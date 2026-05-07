import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { AnalysisSegment } from "./types";

type ProbeResult = {
  duration: number;
  width?: number;
  height?: number;
};

export const FINAL_VIDEO_DURATION = 30;
export const MAX_FINAL_VIDEO_DURATION = 33;
export const TARGET_WIDTH = 1080;
export const TARGET_HEIGHT = 1920;
const SUBTITLE_TOP_RATIO = 0.65;
const TRANSITION_DURATION = 0.15;

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

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
      "-ss",
      String(segment.start),
      "-i",
      sourcePath,
      "-t",
      String(duration),
      "-vf",
      buildVerticalCoverFilter(),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
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
    "23",
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
    "23",
    "-c:a",
    "aac",
    outputPath,
  ]);
}

export async function normalizeClipsTo30s(
  clipPaths: string[],
  outputDir: string,
): Promise<string[]> {
  if (clipPaths.length === 0) {
    throw new Error("normalizeClipsTo30s: clipPaths가 비어 있습니다.");
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const durations = await Promise.all(
    clipPaths.map(async (clipPath) => {
      const meta = await probeVideo(clipPath);
      return meta.duration;
    }),
  );

  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

  if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
    throw new Error("normalizeClipsTo30s: 전체 clip 길이 계산 실패");
  }

  if (totalDuration < FINAL_VIDEO_DURATION - 0.05) {
    console.warn(
      `normalizeClipsTo30s: 실제 클립 총합이 ${totalDuration.toFixed(2)}초로 30초 미만입니다. 프롬프트 품질 이슈로 보고 원본 길이 그대로 진행합니다.`,
    );
    return clipPaths;
  }

  if (totalDuration <= MAX_FINAL_VIDEO_DURATION + 0.05) {
    return clipPaths;
  }

  const normalized: string[] = [];
  const lastIndex = clipPaths.length - 1;
  const lastClipPath = clipPaths[lastIndex];
  const lastClipDuration = durations[lastIndex];

  if (lastClipDuration >= MAX_FINAL_VIDEO_DURATION - 0.05) {
    const outputPath = path.join(outputDir, `clip_norm_${lastIndex + 1}.mp4`);
    await trimClipToDuration(lastClipPath, outputPath, MAX_FINAL_VIDEO_DURATION);
    return [outputPath];
  }

  const targetDurationBeforeLast = Math.max(
    0.1,
    MAX_FINAL_VIDEO_DURATION - lastClipDuration,
  );
  let usedDurationBeforeLast = 0;

  for (let i = 0; i < clipPaths.length; i += 1) {
    const inputPath = clipPaths[i];
    const clipDuration = durations[i];

    if (i === lastIndex) {
      normalized.push(inputPath);
      break;
    }

    if (usedDurationBeforeLast >= targetDurationBeforeLast) {
      continue;
    }

    const remainingDuration = targetDurationBeforeLast - usedDurationBeforeLast;

    if (clipDuration <= remainingDuration + 0.05) {
      normalized.push(inputPath);
      usedDurationBeforeLast += clipDuration;
      continue;
    }

    const outputPath = path.join(outputDir, `clip_norm_${i + 1}.mp4`);
    await trimClipToDuration(inputPath, outputPath, remainingDuration);
    normalized.push(outputPath);
    usedDurationBeforeLast += remainingDuration;
  }

  return normalized;
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
      "23",
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

  const transition = Math.min(
    TRANSITION_DURATION,
    ...durations.map((duration) => Math.max(0.05, duration / 4)),
  );
  const inputArgs = clipPaths.flatMap((clipPath) => ["-i", clipPath]);
  const filterParts: string[] = [];

  for (let i = 0; i < clipPaths.length; i += 1) {
    filterParts.push(
      `[${i}:v]scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase,crop=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=60,format=yuv420p,setpts=PTS-STARTPTS[v${i}]`,
    );
    filterParts.push(
      `[${i}:a]aresample=48000,asetpts=PTS-STARTPTS[a${i}]`,
    );
  }

  let accumulatedDuration = durations[0];
  let previousLabel = "[v0]";
  let previousAudioLabel = "[a0]";

  for (let i = 1; i < clipPaths.length; i += 1) {
    const outputLabel = i === clipPaths.length - 1 ? "[vout]" : `[vx${i}]`;
    const audioOutputLabel =
      i === clipPaths.length - 1 ? "[aout]" : `[ax${i}]`;
    const offset = Math.max(0, accumulatedDuration - transition);

    filterParts.push(
      `${previousLabel}[v${i}]xfade=transition=fade:duration=${transition.toFixed(3)}:offset=${offset.toFixed(3)}${outputLabel}`,
    );
    filterParts.push(
      `${previousAudioLabel}[a${i}]acrossfade=d=${transition.toFixed(3)}:c1=tri:c2=tri${audioOutputLabel}`,
    );

    accumulatedDuration += durations[i] - transition;
    previousLabel = outputLabel;
    previousAudioLabel = audioOutputLabel;
  }

  await runCommand("ffmpeg", [
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    previousLabel,
    "-map",
    previousAudioLabel,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
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
): Promise<void> {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`videoPath가 없습니다: ${videoPath}`);
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error(`audioPath가 없습니다: ${audioPath}`);
  }

  ensureParentDir(outputPath);
  const videoMeta = await probeVideo(videoPath);
  const outputDuration = Math.min(videoMeta.duration, MAX_FINAL_VIDEO_DURATION);
  const extraFilters: string[] = [];

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

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    ...(extraFilters.length > 0
      ? ["-vf", buildVerticalCoverFilter(extraFilters)]
      : []),
    "-filter_complex",
    `[0:a]volume=0.5[a0];[1:a]volume=1.7,apad,atrim=0:${outputDuration}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]`,
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
    "23",
    "-c:a",
    "aac",
    outputPath,
  ]);
}
