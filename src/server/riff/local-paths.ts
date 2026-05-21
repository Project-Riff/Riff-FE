import fs from "fs";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "jobs");
const PUBLIC_ROOT = path.join(process.cwd(), "public", "riff-jobs");

export function ensureJobDirs(jobId: string) {
  const jobRoot = path.join(STORAGE_ROOT, jobId);
  const clipsDir = path.join(jobRoot, "clips");
  const publicDir = path.join(PUBLIC_ROOT, jobId);

  fs.mkdirSync(jobRoot, { recursive: true });
  fs.mkdirSync(clipsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  return {
    jobRoot,
    clipsDir,
    publicDir,

    statusPath: path.join(jobRoot, "status.json"),
    logsPath: path.join(jobRoot, "logs.jsonl"),

    sourcePath: path.join(jobRoot, "source.mp4"),
    sourceOriginalPath: path.join(jobRoot, "source-original.mp4"),
    compressedPath: path.join(jobRoot, "source-compressed.mp4"),
    sceneChunksPath: path.join(jobRoot, "scene-chunks.json"),
    cutsRawPath: path.join(jobRoot, "cuts-raw.txt"),
    cutsParsedPath: path.join(jobRoot, "cuts-parsed.json"),
    analysisPath: path.join(jobRoot, "analysis.json"),
    subtitlePath: path.join(jobRoot, "subtitles.srt"),
    ttsPath: path.join(jobRoot, "tts.wav"),
    bodyPath: path.join(jobRoot, "body.mp4"),
    overlayPath: path.join(jobRoot, "overlay.mp4"),
    overlaySourcePath: path.join(publicDir, "overlay-source.mp4"),
    overlaySourceUrl: `/riff-jobs/${jobId}/overlay-source.mp4`,

    finalPath: path.join(publicDir, "final.mp4"),
    finalUrl: `/riff-jobs/${jobId}/final.mp4`,
  };
}
