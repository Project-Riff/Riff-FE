import fs from "fs";
import { AnalysisSegment } from "./types";
import { SFX_PRESETS } from "./sfx-presets";

export type SfxCue = {
  presetId: string;
  filePath: string;
  startSec: number;
  volume: number;
  trimToSec: number;
};

export type SfxCueDiagnostic = {
  presetId: string;
  matchedKeyword: string;
  shotType: AnalysisSegment["shotType"];
  label: string;
  startSec: number;
  volume: number;
  trimToSec: number;
};

function matchPreset(segment: AnalysisSegment) {
  const label = segment.label.toLowerCase();

  for (const preset of SFX_PRESETS) {
    if (!preset.shotTypes.includes(segment.shotType)) {
      continue;
    }

    const matchedKeyword = preset.keywords.find((keyword) =>
      label.includes(keyword),
    );

    if (matchedKeyword) {
      return {
        preset,
        matchedKeyword,
      };
    }
  }

  return undefined;
}

export function buildSfxCues(segments: AnalysisSegment[]) {
  const cues: SfxCue[] = [];
  const diagnostics: SfxCueDiagnostic[] = [];
  const usedPresetIds = new Set<string>();
  let timelineSec = 0;

  for (const segment of segments) {
    const duration = Math.max(0, segment.end - segment.start);
    const matched = matchPreset(segment);
    const preset = matched?.preset;

    if (
      preset &&
      duration >= 1.0 &&
      !usedPresetIds.has(preset.id) &&
      fs.existsSync(preset.filePath) &&
      cues.length < 3
    ) {
      cues.push({
        presetId: preset.id,
        filePath: preset.filePath,
        startSec: Math.max(0, timelineSec + preset.offsetSec),
        volume: preset.volume,
        trimToSec: Math.min(preset.trimToSec, Math.max(0.6, duration - 0.1)),
      });
      diagnostics.push({
        presetId: preset.id,
        matchedKeyword: matched?.matchedKeyword ?? "",
        shotType: segment.shotType,
        label: segment.label,
        startSec: Math.max(0, timelineSec + preset.offsetSec),
        volume: preset.volume,
        trimToSec: Math.min(preset.trimToSec, Math.max(0.6, duration - 0.1)),
      });
      usedPresetIds.add(preset.id);
    }

    timelineSec += duration;
  }

  return {
    cues,
    diagnostics,
  };
}
