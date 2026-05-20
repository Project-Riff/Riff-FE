import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { SubtitleItem } from "./types";

const TARGET_AUDIO_DURATION = 19.5;
// ElevenLabs 설정
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
const ELEVENLABS_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const EDGE_VOICE = "ko-KR-SunHiNeural"; // Edge TTS 목소리

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { 
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32"
    });

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
    const p = spawn(cmd, args, { 
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32"
    });

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

function isMissingEdgeTtsModule(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /No module named edge_tts/i.test(error.message);
}

export async function probeAudioDuration(filePath: string) {
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

/**
 * ElevenLabs API를 사용하여 오디오를 생성합니다.
 */
async function fetchElevenLabsAudio(text: string, outPath: string) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error(
      "ELEVENLABS_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
}

/**
 * Edge TTS (Python)를 사용하여 오디오를 생성합니다. (무료)
 */
async function fetchEdgeTtsAudio(text: string, outPath: string) {
  const tempTxtPath = outPath + ".txt";
  fs.writeFileSync(tempTxtPath, text, "utf-8");

  try {
    await run("python", [
      "-m",
      "edge_tts",
      "--file",
      tempTxtPath,
      "--write-media",
      outPath,
      "--voice",
      EDGE_VOICE,
    ]);
  } finally {
    if (fs.existsSync(tempTxtPath)) fs.unlinkSync(tempTxtPath);
  }
}

async function fetchMacOsSayAudio(text: string, outPath: string) {
  const aiffPath = outPath.replace(/\.mp3$/i, ".aiff");

  if (fs.existsSync(aiffPath)) {
    fs.unlinkSync(aiffPath);
  }

  await run("say", [
    "-v",
    "Yuna",
    "-o",
    aiffPath,
    text,
  ]);

  await run("ffmpeg", [
    "-y",
    "-i",
    aiffPath,
    "-ar",
    "44100",
    "-ac",
    "1",
    outPath,
  ]);

  if (fs.existsSync(aiffPath)) {
    fs.unlinkSync(aiffPath);
  }
}

async function createBaseTtsMp3(text: string, outPath: string) {
  if (ELEVENLABS_API_KEY) {
    try {
      await fetchElevenLabsAudio(text, outPath);
      return;
    } catch (error) {
      console.warn(
        `[TTS] ElevenLabs 호출 실패, fallback 경로로 전환합니다: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  try {
    await fetchEdgeTtsAudio(text, outPath);
  } catch (error) {
    if (!isMissingEdgeTtsModule(error)) {
      throw error;
    }

    console.warn(
      "[TTS] edge_tts 모듈이 없어 macOS say 음성으로 대체합니다.",
    );
    await fetchMacOsSayAudio(text, outPath);
  }
}

async function convertMp3ToWav(inputPath: string, outputPath: string) {
  await run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-ar",
    "44100",
    "-ac",
    "1",
    outputPath,
  ]);
}

export async function makeTimedTtsWav(
  subtitles: SubtitleItem[],
  outWavPath: string,
): Promise<SubtitleItem[]> {
  const texts = subtitles.map((item) => item.text.trim()).filter(Boolean);

  if (texts.length === 0) {
    throw new Error("makeTimedTtsWav: 자막 문장이 없습니다.");
  }

  const tempDir = outWavPath.replace(/\.wav$/i, "_chunks");
  fs.mkdirSync(tempDir, { recursive: true });

  const chunkWavPaths: string[] = [];
  const timedSubtitles: SubtitleItem[] = [];
  let cursor = 0;

  try {
    for (let i = 0; i < texts.length; i += 1) {
      const text = texts[i];
      const chunkMp3Path = path.join(tempDir, `chunk_${i + 1}.mp3`);
      const chunkWavPath = path.join(tempDir, `chunk_${i + 1}.wav`);

      await createBaseTtsMp3(text, chunkMp3Path);
      await convertMp3ToWav(chunkMp3Path, chunkWavPath);

      const duration = await probeAudioDuration(chunkWavPath);
      timedSubtitles.push({
        start: cursor,
        end: cursor + duration,
        text,
      });
      cursor += duration;
      chunkWavPaths.push(chunkWavPath);
    }

    const listPath = path.join(tempDir, "concat_list.txt");
    fs.writeFileSync(
      listPath,
      chunkWavPaths
        .map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`)
        .join("\n"),
      "utf-8",
    );

    await run("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-ar",
      "44100",
      "-ac",
      "1",
      outWavPath,
    ]);

    return timedSubtitles;
  } finally {
    if (fs.existsSync(tempDir)) {
      for (const fileName of fs.readdirSync(tempDir)) {
        fs.unlinkSync(path.join(tempDir, fileName));
      }
      fs.rmdirSync(tempDir);
    }
  }
}

export async function measureSubtitleTimings(
  subtitles: SubtitleItem[],
): Promise<SubtitleItem[]> {
  const texts = subtitles.map((item) => item.text.trim()).filter(Boolean);

  if (texts.length === 0) {
    throw new Error("measureSubtitleTimings: 자막 문장이 없습니다.");
  }

  const tempDir = path.join(
    process.cwd(),
    "storage",
    "tmp-subtitle-timings",
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  fs.mkdirSync(tempDir, { recursive: true });

  const timedSubtitles: SubtitleItem[] = [];
  let cursor = 0;

  try {
    for (let i = 0; i < texts.length; i += 1) {
      const text = texts[i];
      const chunkMp3Path = path.join(tempDir, `chunk_${i + 1}.mp3`);
      const chunkWavPath = path.join(tempDir, `chunk_${i + 1}.wav`);

      await createBaseTtsMp3(text, chunkMp3Path);
      await convertMp3ToWav(chunkMp3Path, chunkWavPath);

      const duration = await probeAudioDuration(chunkWavPath);
      timedSubtitles.push({
        start: cursor,
        end: cursor + duration,
        text,
      });
      cursor += duration;
    }

    return timedSubtitles;
  } finally {
    if (fs.existsSync(tempDir)) {
      for (const fileName of fs.readdirSync(tempDir)) {
        fs.unlinkSync(path.join(tempDir, fileName));
      }
      fs.rmdirSync(tempDir);
    }
  }
}

export async function makeTtsWav(text: string, outWavPath: string) {
  const mp3Path = outWavPath.replace(/\.wav$/i, ".mp3");
  const rawWavPath = outWavPath.replace(/\.wav$/i, "_raw.wav");
  const fixedWavPath = outWavPath.replace(/\.wav$/i, "_fixed.wav");

  // 기존 임시 파일 삭제
  [mp3Path, rawWavPath, fixedWavPath, outWavPath].forEach(path => {
    if (fs.existsSync(path)) fs.unlinkSync(path);
  });

  // 1. ElevenLabs 우선, 실패 시 Edge/macOS fallback
  await createBaseTtsMp3(text, mp3Path);

  // 2. MP3를 표준 WAV 포맷으로 변환
  await convertMp3ToWav(mp3Path, rawWavPath);

  const duration = await probeAudioDuration(rawWavPath);

  // 3. 목표 시간(19.5초)보다 길 경우 배속 조절
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

  // 임시 파일 정리
  [mp3Path, rawWavPath, fixedWavPath].forEach(path => {
    if (fs.existsSync(path)) fs.unlinkSync(path);
  });
}
