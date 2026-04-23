import fs from "fs";
import { SubtitleItem } from "./types";

function pad(num: number, size = 2) {
  return String(num).padStart(size, "0");
}

export function toSrtTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const milliseconds = Math.floor((safe - Math.floor(safe)) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

export function writeSrtFile(
  subtitles: SubtitleItem[],
  outputPath: string,
) {
  const normalized = subtitles
    .filter((item) => item.text.trim() && item.end > item.start)
    .sort((a, b) => a.start - b.start);

  const content = normalized
    .map((item, idx) => {
      return [
        String(idx + 1),
        `${toSrtTime(item.start)} --> ${toSrtTime(item.end)}`,
        item.text.trim(),
        "",
      ].join("\n");
    })
    .join("\n");

  fs.writeFileSync(outputPath, content, "utf-8");
}