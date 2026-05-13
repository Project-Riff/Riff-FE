import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { AnalysisSegment } from "./types";

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

  const inputArgs = clipPaths.flatMap((clipPath) => ["-i", clipPath]);
  const filterParts: string[] = [];

  for (let i = 0; i < clipPaths.length; i += 1) {
    const duration = durations[i];
    const startTrim = i === 0 ? 0 : Math.min(CLIP_EDGE_TRIM, duration / 8);
    const endTrim =
      i === clipPaths.length - 1 ? 0 : Math.min(CLIP_EDGE_TRIM, duration / 8);
    const trimmedEnd = Math.max(startTrim + 0.1, duration - endTrim);

    filterParts.push(
      `[${i}:v]trim=start=${startTrim.toFixed(3)}:end=${trimmedEnd.toFixed(3)},setpts=PTS-STARTPTS,scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=increase,crop=${TARGET_WIDTH}:${TARGET_HEIGHT},fps=60,format=yuv420p[v${i}]`,
    );
    filterParts.push(
      `[${i}:a]atrim=start=${startTrim.toFixed(3)}:end=${trimmedEnd.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000[a${i}]`,
    );
  }

  const concatInputs = clipPaths.map((_, i) => `[v${i}][a${i}]`).join("");
  filterParts.push(
    `${concatInputs}concat=n=${clipPaths.length}:v=1:a=1[vout][aout]`,
  );

  await runCommand("ffmpeg", [
    "-y",
    ...inputArgs,
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    "[vout]",
    "-map",
    "[aout]",
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
  const outputDuration = videoMeta.duration;
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
    `[0:a]volume=0.8[a0];[1:a]volume=2.6,apad,atrim=0:${outputDuration}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]`,
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
