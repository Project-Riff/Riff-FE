export type Stage =
  | "queued"
  | "uploaded"
  | "probing"
  | "analyzing"
  | "cutting"
  | "tts"
  | "rendering"
  | "done"
  | "error";

export type ResumeFrom =
  | "full"
  | "analysis"
  | "script"
  | "title"
  | "subtitle-only"
  | "subtitle"
  | "tts"
  | "body";

export type AnalysisMood = "energetic" | "cozy" | "premium" | "cute";

export interface StoreInfo {
  name?: string;
  address?: string;
  subtitle?: string;
  strengths?: string;
  hours?: string;
  phone?: string;
  instagram?: string;
}

export interface Segment {
  start: number;
  end: number;
  label?: string;
}

export type AnalysisShotType =
  | "food_hook"
  | "location"
  | "interior"
  | "food_detail"
  | "ending";

export type AnalysisSegment = {
  start: number;
  end: number;
  label: string;
  shotType: AnalysisShotType;
};

export type SubtitleItem = {
  start: number;
  end: number;
  text: string;
};

export type AnalysisResult = {
  title: string;
  heroTitle?: string;
  heroSubtitle?: string;
  mood: AnalysisMood;
  narration: string;
  bgmTags: string[];
  segments: AnalysisSegment[];
  subtitles: SubtitleItem[];
};

export interface JobLog {
  t: number;
  stage: Stage;
  progress: number;
  message?: string;
}

export interface JobArtifacts {
  sourcePath?: string;
  sourceUrl?: string;
  analysisPath?: string;
  subtitlePath?: string;
  clipPaths?: string[];
  ttsPath?: string;
  bodyPath?: string;
  overlayPath?: string;
  finalPath?: string;
  finalUrl?: string;
}

export interface Job {
  id: string;
  createdAt: number;
  updatedAt: number;

  stage: Stage;
  progress: number;
  message?: string;
  error?: string;
  sourceName?: string;

  sourcePath?: string;
  sourceUrl?: string;

  storeInfo?: StoreInfo;

  analysis?: AnalysisResult;
  artifacts?: JobArtifacts;
  logs?: JobLog[];

  // 나중에 중간 단계부터 재개할 때 사용
  resumeFrom?: ResumeFrom;
}
