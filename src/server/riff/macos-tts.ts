import { spawn } from "child_process";
import fs from "fs";

const TARGET_AUDIO_DURATION = 29.5;

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";
    p.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} failed (${code})\n${stderr}`));
    });
  });
}

function runCapture(cmd: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (d) => {
      stdout += d.toString();
    });

    p.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    p.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${cmd} failed (${code})\n${stderr}`));
    });
  });
}

async function probeAudioDuration(filePath: string) {
  const output = await runCapture("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  const duration = Number(output);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`TTS 길이 분석 실패: ${filePath}`);
  }

  return duration;
}

function buildAtempoFilter(speed: number) {
  const filters: string[] = [];
  let remain = speed;

  while (remain > 2.0) {
    filters.push("atempo=2.0");
    remain /= 2.0;
  }

  while (remain < 0.5) {
    filters.push("atempo=0.5");
    remain /= 0.5;
  }

  filters.push(`atempo=${remain.toFixed(4)}`);

  return filters.join(",");
}

export async function makeTtsWav(text: string, outWavPath: string) {
  const aiffPath = outWavPath.replace(/\.wav$/i, ".aiff");
  const rawWavPath = outWavPath.replace(/\.wav$/i, "_raw.wav");
  const fixedWavPath = outWavPath.replace(/\.wav$/i, "_fixed.wav");

  if (fs.existsSync(aiffPath)) fs.unlinkSync(aiffPath);
  if (fs.existsSync(rawWavPath)) fs.unlinkSync(rawWavPath);
  if (fs.existsSync(fixedWavPath)) fs.unlinkSync(fixedWavPath);
  if (fs.existsSync(outWavPath)) fs.unlinkSync(outWavPath);

  await run("say", ["-v", "Yuna", "-o", aiffPath, text]);

  await run("ffmpeg", [
    "-y",
    "-i",
    aiffPath,
    "-ar",
    "44100",
    "-ac",
    "1",
    rawWavPath,
  ]);

  const duration = await probeAudioDuration(rawWavPath);

  if (duration > TARGET_AUDIO_DURATION) {
    const speed = duration / TARGET_AUDIO_DURATION;
    const atempo = buildAtempoFilter(speed);

    await run("ffmpeg", [
      "-y",
      "-i",
      rawWavPath,
      "-filter:a",
      atempo,
      "-ar",
      "44100",
      "-ac",
      "1",
      fixedWavPath,
    ]);

    fs.renameSync(fixedWavPath, outWavPath);
  } else {
    fs.renameSync(rawWavPath, outWavPath);
  }

  if (fs.existsSync(aiffPath)) fs.unlinkSync(aiffPath);
  if (fs.existsSync(rawWavPath)) fs.unlinkSync(rawWavPath);
  if (fs.existsSync(fixedWavPath)) fs.unlinkSync(fixedWavPath);
}