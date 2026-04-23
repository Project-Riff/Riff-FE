import { Stage } from "./types";

export const STAGE_LABELS: Record<Stage, string> = {
  queued: "대기열",
  uploaded: "업로드 완료",
  probing: "영상 정보 확인",
  analyzing: "Gemini 분석",
  cutting: "클립 분리",
  tts: "TTS 생성",
  rendering: "최종 렌더링",
  done: "완료",
  error: "오류",
};