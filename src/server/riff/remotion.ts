import { spawn } from "child_process";
import fs from "fs";
import path from "path";

type RemotionOverlayInput = {
  videoSrc: string;
  heroTitle: string;
  heroSubtitle?: string;
  durationInFrames?: number;
};

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
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
        resolve();
        return;
      }

      reject(
        new Error(
          `Remotion render failed (code=${code})\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    });
  });
}

export async function renderRemotionOverlay(
  input: RemotionOverlayInput,
  outputPath: string,
) {
  const isLocalFilePath =
    input.videoSrc.startsWith("/") && !input.videoSrc.startsWith("/riff-jobs/");

  if (isLocalFilePath && !fs.existsSync(input.videoSrc)) {
    throw new Error(`Remotion input video가 없습니다: ${input.videoSrc}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await run("npx", [
    "remotion",
    "render",
    "remotion/index.ts",
    "SeoulSwing",
    outputPath,
    "--props",
    JSON.stringify(input),
  ]);
}
