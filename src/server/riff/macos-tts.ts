import { spawn } from "child_process";

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

export async function makeTtsWav(text: string, outWavPath: string) {
  const aiffPath = outWavPath.replace(/\.wav$/i, ".aiff");

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
    outWavPath,
  ]);
}