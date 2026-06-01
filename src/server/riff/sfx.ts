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

type PresetMatch = {
  preset: (typeof SFX_PRESETS)[number];
  matchedKeyword: string;
  score: number;
};

function matchPresets(segment: AnalysisSegment): PresetMatch[] {
  const label = segment.label.toLowerCase();
  const matches: PresetMatch[] = [];

  for (const preset of SFX_PRESETS) {
    if (!preset.shotTypes.includes(segment.shotType)) {
      continue;
    }

    const matchedKeyword = preset.keywords.find((keyword) =>
      label.includes(keyword),
    );

    if (matchedKeyword) {
      matches.push({
        preset,
        matchedKeyword,
        score: matchedKeyword.length,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function getFallbackPreset(segment: AnalysisSegment, blockedPresetId?: string) {
  return SFX_PRESETS.filter((preset) => {
    return (
      preset.shotTypes.includes(segment.shotType) &&
      preset.id !== blockedPresetId &&
      fs.existsSync(preset.filePath)
    );
  }).sort((a, b) => (b.fallbackWeight ?? 0) - (a.fallbackWeight ?? 0))[0];
}

export function buildSfxCues(segments: AnalysisSegment[]) {
  const cues: SfxCue[] = [];
  const diagnostics: SfxCueDiagnostic[] = [];
  let timelineSec = 0;
  let lastPresetId: string | undefined;
  const targetCueCount = Math.max(
    1,
    Math.min(segments.length, Math.floor(segments.length / 2)),
  );

  for (const segment of segments) {
    const duration = Math.max(0, segment.end - segment.start);
    const matches = matchPresets(segment);
    const chosenMatch = matches.find(({ preset }) => preset.id !== lastPresetId);
    const preset =
      chosenMatch?.preset ?? getFallbackPreset(segment, lastPresetId);
    const matchedKeyword = chosenMatch?.matchedKeyword ?? "";

    if (
      preset &&
      duration >= 1.0 &&
      fs.existsSync(preset.filePath) &&
      cues.length < targetCueCount
    ) {
      const startSec = Math.max(0, timelineSec + preset.offsetSec);
      const trimToSec = Math.min(
        preset.trimToSec,
        Math.max(0.6, duration - 0.1),
      );

      cues.push({
        presetId: preset.id,
        filePath: preset.filePath,
        startSec,
        volume: preset.volume,
        trimToSec,
      });
      diagnostics.push({
        presetId: preset.id,
        matchedKeyword,
        shotType: segment.shotType,
        label: segment.label,
        startSec,
        volume: preset.volume,
        trimToSec,
      });
      lastPresetId = preset.id;
    }

    timelineSec += duration;
  }

  return {
    cues,
    diagnostics,
  };
}
