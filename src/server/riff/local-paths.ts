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

    sourcePath: path.join(jobRoot, "source.mp4"),
    analysisPath: path.join(jobRoot, "analysis.json"),
    subtitlePath: path.join(jobRoot, "subtitles.srt"),
    ttsPath: path.join(jobRoot, "tts.wav"),
    bodyPath: path.join(jobRoot, "body.mp4"),

    finalPath: path.join(publicDir, "final.mp4"),
    finalUrl: `/riff-jobs/${jobId}/final.mp4`,
  };
}