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
export const TARGET_WIDTH = 1080;
export const TARGET_HEIGHT = 1920;

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
      "-an",
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
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    outputPath,
  ]);
}

async function getTotalDuration(videoPaths: string[]) {
  let total = 0;

  for (const videoPath of videoPaths) {
    const meta = await probeVideo(videoPath);
    total += meta.duration;
  }

  return total;
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

  const normalized: string[] = [];

  for (let i = 0; i < clipPaths.length; i += 1) {
    const inputPath = clipPaths[i];
    const outputPath = path.join(outputDir, `clip_norm_${i + 1}.mp4`);

    let targetDuration =
      (durations[i] / totalDuration) * FINAL_VIDEO_DURATION;

    if (i === clipPaths.length - 1) {
      const used = normalized.length > 0 ? await getTotalDuration(normalized) : 0;
      targetDuration = Math.max(0.1, FINAL_VIDEO_DURATION - used);
    }

    await retimeClipToDuration(inputPath, outputPath, targetDuration);
    normalized.push(outputPath);
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

  const listPath = path.join(path.dirname(outputPath), "concat_list.txt");
  const content = clipPaths
    .map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`)
    .join("\n");

  fs.writeFileSync(listPath, content, "utf-8");

  try {
    await runCommand("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-vf",
      buildVerticalCoverFilter(),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-an",
      outputPath,
    ]);
  } finally {
    if (fs.existsSync(listPath)) {
      fs.unlinkSync(listPath);
    }
  }
}

export async function extendVideoToDuration(
  inputPath: string,
  outputPath: string,
  targetDuration: number,
): Promise<void> {
  const meta = await probeVideo(inputPath);

  if (meta.duration >= targetDuration - 0.05) {
    if (inputPath !== outputPath) {
      ensureParentDir(outputPath);
      fs.copyFileSync(inputPath, outputPath);
    }
    return;
  }

  throw new Error(
    `extendVideoToDuration은 정지 화면 연장을 만들 수 있어 비활성화했습니다. 현재=${meta.duration.toFixed(
      2,
    )}s, target=${targetDuration}s`,
  );
}

export async function muxVideoWithAudioAndSubtitles(
  videoPath: string,
  audioPath: string,
  subtitlePath: string,
  outputPath: string,
): Promise<void> {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`videoPath가 없습니다: ${videoPath}`);
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error(`audioPath가 없습니다: ${audioPath}`);
  }

  if (!fs.existsSync(subtitlePath)) {
    throw new Error(`subtitlePath가 없습니다: ${subtitlePath}`);
  }

  const subtitlesAvailable = await hasSubtitlesFilter();

  if (!subtitlesAvailable) {
    throw new Error(
      "현재 ffmpeg 빌드에 subtitles 필터가 없습니다. ffmpeg를 libass 포함 빌드로 다시 설치해야 합니다.",
    );
  }

  ensureParentDir(outputPath);

  const escapedSubtitlePath = escapeSubtitlePathForFfmpeg(subtitlePath);

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-vf",
    buildVerticalCoverFilter([
      `subtitles=filename='${escapedSubtitlePath}'`,
    ]),
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-t",
    String(FINAL_VIDEO_DURATION),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-af",
    `apad,atrim=0:${FINAL_VIDEO_DURATION}`,
    "-c:a",
    "aac",
    outputPath,
  ]);
}
