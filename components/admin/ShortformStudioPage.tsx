"use client";

import {
  ResumeFrom,
  STAGE_LABELS,
  useShortformPipeline,
} from "@/components/admin/useShortformPipeline";
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  FileVideo2,
  Film,
  LayoutPanelLeft,
  Play,
  Sparkles,
  Subtitles,
  Wand2,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";

function formatLogTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type PipelineVisualStatus = "done" | "active" | "idle";

const pipelineStages = [
  {
    key: "source",
    title: "Prepare Source",
    subtitle: "업로드 · 압축 · 정보 확인",
    accent: "from-sky-500 to-cyan-400",
  },
  {
    key: "stable-cuts",
    title: "Stable Chunks",
    subtitle: "안정 구간 추출",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    key: "hooks",
    title: "Analyze Cuts",
    subtitle: "Gemini 컷 선택",
    accent: "from-fuchsia-500 to-indigo-500",
  },
  {
    key: "body",
    title: "Build Body",
    subtitle: "클립 컷팅 · 바디 생성",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    key: "script",
    title: "Write Script",
    subtitle: "컷 기반 문구 생성",
    accent: "from-amber-500 to-orange-400",
  },
  {
    key: "sync",
    title: "Sync Voice",
    subtitle: "TTS · 자막 타이밍",
    accent: "from-rose-500 to-pink-500",
  },
  {
    key: "final",
    title: "Render Final",
    subtitle: "오버레이 · 최종 합성",
    accent: "from-slate-700 to-slate-500",
  },
] as const;

const stageNodePoints = [
  { x: 154, y: 306 },
  { x: 236, y: 96 },
  { x: 378, y: 326 },
  { x: 466, y: 82 },
  { x: 610, y: 302 },
  { x: 692, y: 102 },
  { x: 846, y: 214 },
] as const;

const orderedMainSegments = [
  {
    d: "M 154 306 C 138 236, 176 138, 236 96",
    width: 4.8,
  },
  {
    d: "M 236 96 C 266 196, 314 274, 378 326",
    width: 4.4,
  },
  {
    d: "M 378 326 C 405 244, 424 138, 466 82",
    width: 4.8,
  },
  {
    d: "M 466 82 C 506 146, 548 244, 610 302",
    width: 4.6,
  },
  {
    d: "M 610 302 C 622 230, 654 150, 692 102",
    width: 4.3,
  },
  {
    d: "M 692 102 C 758 112, 809 150, 846 214",
    width: 4.5,
  },
] as const;

const orderedSupportSegments = [
  [
    {
      d: "M 154 306 C 196 268, 208 175, 236 96",
      width: 2.3,
      opacity: 0.58,
      glow: "pipelineGlow",
    },
    {
      d: "M 154 306 C 178 252, 199 181, 223 129 C 227 118, 231 108, 236 96",
      width: 1.7,
      opacity: 0.46,
      glow: "softBranchGlow",
    },
    {
      d: "M 154 306 C 165 250, 182 185, 205 140 C 214 122, 224 107, 236 96",
      width: 1.4,
      opacity: 0.38,
      glow: "softBranchGlow",
    },
  ],
  [
    {
      d: "M 236 96 C 274 176, 312 280, 378 326",
      width: 2.3,
      opacity: 0.58,
      glow: "pipelineGlow",
    },
    {
      d: "M 236 96 C 280 154, 317 246, 360 301 C 367 310, 372 318, 378 326",
      width: 1.7,
      opacity: 0.46,
      glow: "softBranchGlow",
    },
    {
      d: "M 258 112 C 303 180, 319 239, 355 289 C 364 301, 370 313, 378 326",
      width: 1.4,
      opacity: 0.38,
      glow: "softBranchGlow",
    },
  ],
  [
    {
      d: "M 378 326 C 416 258, 429 144, 466 82",
      width: 2.3,
      opacity: 0.58,
      glow: "pipelineGlow",
    },
    {
      d: "M 378 326 C 417 282, 438 160, 457 107 C 460 99, 463 90, 466 82",
      width: 1.7,
      opacity: 0.48,
      glow: "softBranchGlow",
    },
    {
      d: "M 394 313 C 429 255, 440 169, 454 111 C 458 98, 462 89, 466 82",
      width: 1.4,
      opacity: 0.38,
      glow: "softBranchGlow",
    },
  ],
  [
    {
      d: "M 466 82 C 524 152, 554 254, 610 302",
      width: 2.1,
      opacity: 0.5,
      glow: "pipelineGlow",
    },
    {
      d: "M 466 82 C 504 132, 538 221, 585 285 C 594 296, 602 300, 610 302",
      width: 1.8,
      opacity: 0.48,
      glow: "softBranchGlow",
    },
    {
      d: "M 489 110 C 530 165, 555 244, 600 294",
      width: 1.2,
      opacity: 0.28,
      glow: "softBranchGlow",
    },
  ],
  [
    {
      d: "M 610 302 C 634 232, 652 146, 692 102",
      width: 2.1,
      opacity: 0.5,
      glow: "pipelineGlow",
    },
    {
      d: "M 610 302 C 632 249, 647 171, 679 121 C 684 113, 688 107, 692 102",
      width: 1.6,
      opacity: 0.45,
      glow: "softBranchGlow",
    },
    {
      d: "M 629 282 C 647 233, 661 159, 684 119",
      width: 1.2,
      opacity: 0.28,
      glow: "softBranchGlow",
    },
  ],
  [
    {
      d: "M 692 102 C 741 113, 800 146, 846 214",
      width: 1.6,
      opacity: 0.45,
      glow: "softBranchGlow",
    },
    {
      d: "M 720 124 C 766 138, 811 167, 838 202",
      width: 1.2,
      opacity: 0.3,
      glow: "softBranchGlow",
    },
  ],
] as const;

function formatSegmentTime(sec?: number) {
  if (typeof sec !== "number" || Number.isNaN(sec)) return "-";
  return `${sec.toFixed(1)}s`;
}

function resolvePipelineStep(stage?: string, message?: string) {
  const normalizedMessage = message ?? "";

  if (!stage || stage === "queued") return 0;

  if (
    stage === "uploading" ||
    stage === "uploaded" ||
    stage === "downloading" ||
    stage === "compressing"
  ) {
    return 1;
  }

  if (stage === "probing") {
    if (normalizedMessage.includes("안정 구간")) return 2;
    return 1;
  }

  if (stage === "analyzing") {
    if (normalizedMessage.includes("문구 생성")) return 5;
    return 3;
  }

  if (stage === "cutting") return 4;
  if (stage === "tts") return 6;

  if (stage === "rendering") {
    return 7;
  }

  if (stage === "done") return 7;
  if (stage === "error") return 7;

  return 0;
}

function deriveStageStatuses(
  stage?: string,
  message?: string,
): PipelineVisualStatus[] {
  if (!stage || stage === "queued") {
    return pipelineStages.map(() => "idle");
  }

  const step = resolvePipelineStep(stage, message);
  const isDone = stage === "done";

  return pipelineStages.map((_, index) => {
    const order = index + 1;
    if (isDone) return "done";
    if (order < step) return "done";
    if (order === step) return "active";
    return "idle";
  });
}

function StageBadge({ status }: { status: PipelineVisualStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e6] px-2 py-0.5 text-[10px] font-semibold text-[#d95d16]">
        <Sparkles className="h-3 w-3" />
        Running
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
      <CircleDashed className="h-3 w-3" />
      Waiting
    </span>
  );
}

function StageNode({
  index,
  nodeKey,
  title,
  status,
  accent,
  selected,
  onClick,
}: {
  index: number;
  nodeKey: (typeof pipelineStages)[number]["key"];
  title: string;
  subtitle: string;
  status: PipelineVisualStatus;
  accent: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const active = status === "active";
  const done = status === "done";
  const Icon =
    nodeKey === "source"
      ? FileVideo2
      : nodeKey === "stable-cuts"
        ? Film
        : nodeKey === "hooks"
          ? Sparkles
          : nodeKey === "body"
            ? LayoutPanelLeft
            : nodeKey === "script"
              ? Wand2
              : nodeKey === "sync"
                ? Subtitles
                : Play;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[128px] rounded-[24px] border-2 px-2 pb-3.5 pt-4 text-center transition ${
        active
          ? "stage-active-glow border-[#ff7a2f] bg-gradient-to-br from-[#fff5ec] to-white"
          : done
            ? "border-[#ffd8bc] bg-[#fff8f3] shadow-[0_8px_18px_rgba(255,122,47,0.10)]"
            : "border-slate-200/80 bg-white shadow-[0_4px_10px_rgba(15,23,42,0.04)]"
      } ${selected ? "ring-4 ring-[#ffe7d7]" : ""} hover:-translate-y-0.5`}
    >
      {active && (
        <>
          <span className="stage-active-ring pointer-events-none absolute -inset-1.5 rounded-[28px] border-2 border-[#ff7a2f]" />
          <span className="stage-active-ring-delay pointer-events-none absolute -inset-1.5 rounded-[28px] border-2 border-[#ffb98f]" />
          <span className="stage-active-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]" />
        </>
      )}

      <div
        className={`absolute -left-2.5 -top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold shadow-md ${
          active
            ? "stage-active-index bg-[#ff7a2f] text-white"
            : done
              ? "bg-[#ff7a2f] text-white"
              : "border-2 border-slate-200 bg-white text-slate-400"
        }`}
      >
        {index}
      </div>

      <div
        className={`relative mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          active
            ? `bg-gradient-to-br ${accent} stage-active-icon text-white shadow-[0_12px_24px_rgba(255,122,47,0.5)]`
            : done
              ? "border border-[#ffd8bc] bg-white text-[#ff7a2f]"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon className="h-7 w-7" />
        {active && (
          <span className="stage-active-icon-spark pointer-events-none absolute inset-0 rounded-2xl" />
        )}
      </div>

      <h3
        className={`relative text-[13px] font-bold leading-tight tracking-tight ${
          active
            ? "text-slate-900"
            : done
              ? "text-slate-700"
              : "text-slate-400"
        }`}
      >
        {title}
      </h3>

      <div
        className={`relative mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
          active
            ? "stage-active-chip bg-[#ff7a2f] text-white"
            : done
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {active && (
          <span className="stage-active-dot block h-1.5 w-1.5 rounded-full bg-white" />
        )}
        {active ? "진행 중" : done ? "완료" : "대기"}
      </div>
    </button>
  );
}

export default function ShortformStudioPage() {
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<
    number | null
  >(null);
  const [captionCopied, setCaptionCopied] = useState(false);
  const logScrollRef = useRef<HTMLDivElement | null>(null);

  const {
    fileRef,
    analysisRef,
    subtitleRef,
    ttsRef,
    bodyRef,
    pickedFile,
    analysisFile,
    setAnalysisFile,
    subtitleFile,
    setSubtitleFile,
    ttsFile,
    setTtsFile,
    bodyFile,
    setBodyFile,
    resumeFrom,
    setResumeFrom,
    jobId,
    job,
    error,
    uploadNotice,
    isUploading,
    storeInfo,
    progress,
    stageText,
    updateStoreField,
    pickFile,
    handleUpload,
  } = useShortformPipeline();

  const needsAnalysis = ["analysis", "script", "title", "subtitle-only", "subtitle"].includes(resumeFrom);
  const needsSubtitle = ["subtitle", "tts", "body"].includes(resumeFrom);
  const needsTts = ["title", "subtitle-only", "tts", "body"].includes(resumeFrom);
  const needsBody = ["script", "title", "subtitle-only", "tts", "body"].includes(resumeFrom);

  const pipelineStatuses = deriveStageStatuses(job?.stage, job?.message);
  const currentStep = resolvePipelineStep(job?.stage, job?.message);
  const pipelinePercent = progress;
  const sweepStep =
    currentStep <= 0 ? 1 : Math.min(currentStep, stageNodePoints.length);
  const sweepEndX = stageNodePoints[sweepStep - 1].x + 320;
  const sweepStartX = -620;
  const sweepDistancePx = sweepEndX - sweepStartX;
  const waveCount = 2;
  const waveTravelSpeedPxPerSec = 138;
  const waveTravelDurationSec = Number(
    (sweepDistancePx / waveTravelSpeedPxPerSec).toFixed(2),
  );
  const waveStartGapSec = Number(
    (waveTravelDurationSec / waveCount).toFixed(2),
  );

  const jobLogs = job?.logs ?? [];

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [jobLogs.length]);

  return (
    <main className="min-h-screen bg-white px-5 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-[1540px]">
        <div className="relative">
          <div className="min-h-[calc(100vh-80px)]">
            <section className="flex min-w-0 flex-col px-1">
              <div className="relative flex-1 overflow-hidden rounded-[36px] border-2 border-slate-200 bg-white px-6 py-7 shadow-[0_18px_44px_rgba(24,29,49,0.06)]">
                <div className="p-1">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-bold tracking-[-0.02em] text-slate-900">
                      Pipeline
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[28px] font-extrabold leading-none tracking-tight text-[#ff7a2f] tabular-nums">
                        {pipelinePercent}
                      </span>
                      <span className="text-sm font-bold text-[#ff7a2f]">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="relative overflow-hidden rounded-[28px] border-2 border-slate-200 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.99),rgba(255,252,248,0.96)_56%,rgba(252,248,243,0.88)_100%)] px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                      <div
                        className="pipeline-progress-fill pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                        style={{ width: `${pipelinePercent}%` }}
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 z-[1] w-[3px] -translate-x-1/2 bg-[#ff7a2f] shadow-[0_0_14px_rgba(255,122,47,0.85)] transition-[left] duration-700 ease-out"
                        style={{ left: `${pipelinePercent}%`, opacity: pipelinePercent > 0 && pipelinePercent < 100 ? 1 : 0 }}
                      />
                      <div className="relative z-10 flex w-full items-center overflow-x-auto px-3 pb-3 pt-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {pipelineStages.map((stage, idx) => {
                          const isLast = idx === pipelineStages.length - 1;
                          const status = pipelineStatuses[idx];
                          const nextStatus = isLast
                            ? undefined
                            : pipelineStatuses[idx + 1];
                          const connectorDone = status === "done";
                          const connectorActive =
                            status === "done" && nextStatus === "active";
                          return (
                            <Fragment key={stage.key}>
                              <div className="shrink-0">
                                <StageNode
                                  index={idx + 1}
                                  nodeKey={stage.key}
                                  title={stage.title}
                                  subtitle={stage.subtitle}
                                  accent={stage.accent}
                                  status={status}
                                />
                              </div>
                              {!isLast && (
                                <div className="flex min-w-[36px] flex-1 items-center gap-1.5 self-center px-2">
                                  <div
                                    className={`h-[5px] flex-1 rounded-full ${
                                      connectorActive
                                        ? "connector-active-flow"
                                        : connectorDone
                                          ? "bg-[#ff7a2f]"
                                          : "bg-slate-200"
                                    }`}
                                  />
                                  <ChevronRight
                                    className={`h-5 w-5 shrink-0 ${
                                      connectorActive
                                        ? "connector-active-arrow text-[#ff7a2f]"
                                        : connectorDone
                                          ? "text-[#ff7a2f]"
                                          : "text-slate-300"
                                    }`}
                                  />
                                </div>
                              )}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
                      <div className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => pickFile(e.target.files?.[0])}
                        />
                        <input
                          ref={analysisRef}
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(e) => setAnalysisFile(e.target.files?.[0] ?? null)}
                        />
                        <input
                          ref={subtitleRef}
                          type="file"
                          accept=".srt,.vtt,.txt"
                          className="hidden"
                          onChange={(e) => setSubtitleFile(e.target.files?.[0] ?? null)}
                        />
                        <input
                          ref={ttsRef}
                          type="file"
                          accept=".wav,audio/wav"
                          className="hidden"
                          onChange={(e) => setTtsFile(e.target.files?.[0] ?? null)}
                        />
                        <input
                          ref={bodyRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => setBodyFile(e.target.files?.[0] ?? null)}
                        />

                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d99567]">
                            Input Console
                          </div>
                          <select
                            value={resumeFrom}
                            onChange={(e) =>
                              setResumeFrom(e.target.value as ResumeFrom)
                            }
                            className="max-w-[230px] truncate rounded-lg border border-[#ffd8bc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#d95d16] outline-none transition focus:border-[#ff7a2f]"
                          >
                            <option value="full">처음부터 다시 만들기</option>
                            <option value="analysis">
                              기존 분석 결과로 다시 만들기
                            </option>
                            <option value="script">
                              컷은 유지하고 문구만 다시 만들기
                            </option>
                            <option value="title">
                              주소 기준 제목만 다시 적용하기
                            </option>
                            <option value="subtitle-only">
                              부제만 다시 적용하기
                            </option>
                            <option value="subtitle">
                              기존 분석 + 자막 기준으로 다시 만들기
                            </option>
                            <option value="tts">
                              기존 자막 + TTS로 영상만 다시 만들기
                            </option>
                            <option value="body">최종 합성만 다시 하기</option>
                          </select>
                        </div>

                        {error ? (
                          <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700">
                            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              !
                            </span>
                            <span className="flex-1">{error}</span>
                          </div>
                        ) : null}

                        {uploadNotice ? (
                          <div className="mb-2 rounded-xl border border-[#ffd8bc] bg-[#fff8f3] px-3 py-2 text-[11px] leading-[16px] text-[#b5541c]">
                            {uploadNotice}
                          </div>
                        ) : null}

                        <div className="grid gap-2">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-2.5 rounded-xl border-2 border-[#ff7a2f] bg-gradient-to-br from-[#fff5ec] via-white to-white px-3 py-2 text-left text-xs font-semibold text-[#d95d16] shadow-[0_8px_18px_rgba(255,122,47,0.14)] transition hover:-translate-y-0.5"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff7a2f] text-white">
                              <FileVideo2 className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {pickedFile?.name || "원본 영상 업로드"}
                            </span>
                          </button>

                          <div className="rounded-xl border border-[#ffd8bc] bg-[#fffaf6] p-2">
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d95d16]">
                              매장 정보
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                value={storeInfo.address}
                                onChange={(e) =>
                                  updateStoreField("address", e.target.value)
                                }
                                placeholder="주소"
                                className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#ffcfb0]"
                              />
                              <input
                                value={storeInfo.subtitle}
                                onChange={(e) =>
                                  updateStoreField("subtitle", e.target.value)
                                }
                                placeholder="부제"
                                className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#ffcfb0]"
                              />
                              <input
                                value={storeInfo.strengths}
                                onChange={(e) =>
                                  updateStoreField("strengths", e.target.value)
                                }
                                placeholder="가게 특장점"
                                className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#ffcfb0]"
                              />
                              <input
                                value={storeInfo.thumbnailTitle || ""}
                                onChange={(e) =>
                                  updateStoreField(
                                    "thumbnailTitle",
                                    e.target.value,
                                  )
                                }
                                placeholder="썸네일 제목 (공란 시 AI)"
                                className="w-full rounded-lg border border-black/8 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#ffcfb0]"
                              />
                            </div>
                          </div>

                          {(needsAnalysis ||
                            needsSubtitle ||
                            needsTts ||
                            needsBody) && (
                            <div className="rounded-xl border border-dashed border-[#ffd8bc] bg-[#fffaf6] p-2">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d95d16]">
                                재실행 파일
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {needsAnalysis && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      analysisRef.current?.click()
                                    }
                                    className="truncate rounded-lg border border-dashed border-[#ffd8bc] bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-[#d95d16] hover:bg-[#fffaf6]"
                                  >
                                    {analysisFile?.name || "analysis.json"}
                                  </button>
                                )}
                                {needsSubtitle && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      subtitleRef.current?.click()
                                    }
                                    className="truncate rounded-lg border border-dashed border-[#ffd8bc] bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-[#d95d16] hover:bg-[#fffaf6]"
                                  >
                                    {subtitleFile?.name || "subtitles.srt"}
                                  </button>
                                )}
                                {needsTts && (
                                  <button
                                    type="button"
                                    onClick={() => ttsRef.current?.click()}
                                    className="truncate rounded-lg border border-dashed border-[#ffd8bc] bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-[#d95d16] hover:bg-[#fffaf6]"
                                  >
                                    {ttsFile?.name || "tts.wav"}
                                  </button>
                                )}
                                {needsBody && (
                                  <button
                                    type="button"
                                    onClick={() => bodyRef.current?.click()}
                                    className="truncate rounded-lg border border-dashed border-[#ffd8bc] bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-[#d95d16] hover:bg-[#fffaf6]"
                                  >
                                    {bodyFile?.name || "body.mp4"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#ff7a2f] to-[#ff5e15] px-3 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(255,122,47,0.28)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isUploading ? (
                              <>
                                <Sparkles className="h-4 w-4 animate-pulse" />
                                처리 중...
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5 fill-white" />
                                작업 시작
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d99567]">
                              Latest Job
                            </div>
                            {job && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e6] px-2 py-0.5 text-[10px] font-bold text-[#d95d16]">
                                <span className="block h-1.5 w-1.5 rounded-full bg-[#ff7a2f] stage-active-dot" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400">
                            {jobLogs.length > 0 ? `${jobLogs.length}건` : "-"}
                          </div>
                        </div>

                        <div className="mb-2 flex items-baseline gap-1.5 text-xs">
                          <span className="font-mono font-semibold text-slate-900">
                            {jobId ? `#${jobId}` : "-"}
                          </span>
                          <span className="truncate text-[#d95d16]">
                            {job
                              ? `${stageText} · ${progress}%`
                              : "아직 실행된 작업이 없습니다"}
                          </span>
                        </div>

                        <div
                          ref={logScrollRef}
                          className="flex-1 space-y-1.5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ff7a2f]"
                          style={{ maxHeight: 320 }}
                        >
                          {jobLogs.length === 0 ? (
                            <div className="flex h-[160px] items-center justify-center text-[11px] leading-5 text-slate-300">
                              작업을 시작하면 로그가 기록됩니다
                            </div>
                          ) : (
                            jobLogs.map((log, i) => {
                              const isError = log.stage === "error";
                              const isDone = log.stage === "done";
                              const stageLabel =
                                STAGE_LABELS[log.stage] || log.stage;
                              const dotColor = isError
                                ? "bg-red-500"
                                : isDone
                                  ? "bg-emerald-500"
                                  : "bg-[#ff7a2f]";
                              const stageColor = isError
                                ? "text-red-600"
                                : isDone
                                  ? "text-emerald-700"
                                  : "text-slate-800";
                              return (
                                <div
                                  key={`${log.t}-${i}`}
                                  className="flex gap-2 rounded-lg px-1.5 py-1 hover:bg-[#fffaf6]"
                                >
                                  <span
                                    className={`mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span
                                        className={`truncate text-[11px] font-semibold ${stageColor}`}
                                      >
                                        {stageLabel}
                                      </span>
                                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-400">
                                        {formatLogTime(log.t)} · {log.progress}%
                                      </span>
                                    </div>
                                    {log.message && (
                                      <div className="mt-0.5 text-[10.5px] leading-[15px] text-slate-500">
                                        {log.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[30px] border-2 border-slate-200 bg-white px-5 py-6 shadow-[0_18px_44px_rgba(24,29,49,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-lg font-bold tracking-[-0.02em] text-slate-900">
                    Result Preview
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Final
                  </div>
                </div>

                {job?.artifacts?.finalUrl ? (
                  <div className="mx-auto max-w-[1200px]">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-[24px] border-2 border-slate-200 bg-white p-4 shadow-[0_12px_24px_rgba(32,36,61,0.05)]">
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                          아웃풋 영상
                        </div>
                        <a
                          href={job.artifacts.finalUrl}
                          download={`${job.artifacts.menuName || jobId}.mp4`}
                          className="rounded-xl border border-[#ffd8bc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#d95d16] transition hover:bg-[#fffaf6]"
                        >
                          다운로드
                        </a>
                      </div>
                      <div className="mx-auto max-w-[280px] overflow-hidden rounded-[18px] border border-black/8 bg-black">
                        <video
                          key={job.artifacts.finalUrl}
                          src={job.artifacts.finalUrl}
                          controls
                          playsInline
                          className="w-full bg-black"
                        />
                      </div>
                      <a
                        href={job.artifacts.finalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center rounded-xl border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50"
                      >
                        새 창에서 보기
                      </a>
                    </div>

                    {job?.artifacts?.thumbnailUrl ? (() => {
                      const candidates =
                        job.artifacts.thumbnailCandidates &&
                        job.artifacts.thumbnailCandidates.length > 0
                          ? job.artifacts.thumbnailCandidates
                          : [
                              {
                                index: 0,
                                url: job.artifacts.thumbnailUrl,
                                path: "",
                              },
                            ];

                      const preferredIndex =
                        typeof job.artifacts.thumbnailPreferredIndex ===
                        "number"
                          ? job.artifacts.thumbnailPreferredIndex
                          : candidates[0].index;

                      const activeIndex =
                        selectedThumbnailIndex !== null &&
                        candidates.some(
                          (c) => c.index === selectedThumbnailIndex,
                        )
                          ? selectedThumbnailIndex
                          : preferredIndex;

                      const activeCandidate =
                        candidates.find((c) => c.index === activeIndex) ??
                        candidates[0];

                      return (
                        <div className="rounded-[24px] border-2 border-slate-200 bg-white p-4 shadow-[0_12px_24px_rgba(32,36,61,0.05)]">
                          <div className="mb-2.5 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">
                              썸네일
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-[11px] text-slate-400">
                                {candidates.length}개
                              </div>
                              <a
                                href={activeCandidate.url}
                                download={`${job.artifacts.menuName || jobId}.jpg`}
                                className="rounded-xl border border-[#ffd8bc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#d95d16] transition hover:bg-[#fffaf6]"
                              >
                                다운로드
                              </a>
                            </div>
                          </div>
                          <div className="relative mx-auto mb-2.5 aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[18px] border border-black/8 bg-[#faf8f5]">
                            <img
                              key={activeCandidate.url}
                              src={activeCandidate.url}
                              className="w-full h-full object-cover"
                              alt="썸네일 미리보기"
                            />
                          </div>
                          {candidates.length > 1 && (
                            <div className="mx-auto grid max-w-[280px] grid-cols-5 gap-1.5">
                              {candidates.map((c) => {
                                const isActive = c.index === activeIndex;
                                const isPreferred =
                                  c.index === preferredIndex;
                                return (
                                  <button
                                    key={c.index}
                                    type="button"
                                    onClick={() =>
                                      setSelectedThumbnailIndex(c.index)
                                    }
                                    className={`relative aspect-[9/16] overflow-hidden rounded-lg border-2 transition ${
                                      isActive
                                        ? "border-[#ff7a2f] shadow-[0_6px_14px_rgba(255,122,47,0.25)]"
                                        : "border-transparent opacity-80 hover:opacity-100 hover:border-[#ffd8bc]"
                                    }`}
                                  >
                                    <img
                                      src={c.url}
                                      className="w-full h-full object-cover"
                                      alt={`후보 ${c.index + 1}`}
                                    />
                                    {isPreferred && !isActive && (
                                      <span className="absolute left-0.5 top-0.5 rounded bg-black/55 px-1 py-px text-[8px] font-semibold text-white">
                                        추천
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-[#faf8f5] p-4 text-center text-sm text-slate-400">
                        썸네일이 아직 생성되지 않았습니다
                      </div>
                    )}

                    {job?.artifacts?.instagramCaption ? (
                      <div className="flex flex-col rounded-[24px] border-2 border-slate-200 bg-white p-4 shadow-[0_12px_24px_rgba(32,36,61,0.05)]">
                        <div className="mb-2.5 flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900">
                            인스타 본문
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  job.artifacts!.instagramCaption!,
                                );
                                setCaptionCopied(true);
                                setTimeout(
                                  () => setCaptionCopied(false),
                                  1800,
                                );
                              } catch (err) {
                                console.error("clipboard error:", err);
                              }
                            }}
                            className="rounded-xl border border-[#ffd8bc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#d95d16] transition hover:bg-[#fffaf6]"
                          >
                            {captionCopied ? "복사됨" : "본문 복사"}
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto rounded-[18px] border border-black/8 bg-[#faf8f5] px-3.5 py-3">
                          <pre className="whitespace-pre-wrap break-words font-[inherit] text-[12.5px] leading-6 text-slate-700">
                            {job.artifacts.instagramCaption}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-[#faf8f5] p-4 text-center text-sm text-slate-400">
                        인스타 본문이 아직 생성되지 않았습니다
                      </div>
                    )}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-[1200px]">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="mx-auto flex aspect-[9/16] w-full max-w-[280px] items-center justify-center rounded-[22px] border-2 border-dashed border-slate-200 bg-[#faf8f5] px-6 text-center text-sm leading-6 text-slate-400">
                        아웃풋 영상이
                        <br />여기에 표시됩니다
                      </div>
                      <div className="mx-auto flex aspect-[9/16] w-full max-w-[280px] items-center justify-center rounded-[22px] border-2 border-dashed border-slate-200 bg-[#faf8f5] px-6 text-center text-sm leading-6 text-slate-400">
                        썸네일이
                        <br />여기에 표시됩니다
                      </div>
                      <div className="mx-auto flex aspect-[9/16] w-full max-w-[280px] items-center justify-center rounded-[22px] border-2 border-dashed border-slate-200 bg-[#faf8f5] px-6 text-center text-sm leading-6 text-slate-400">
                        인스타 본문이
                        <br />여기에 표시됩니다
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>

      <style jsx>{`
        .stage-active-glow {
          animation: stage-glow 1.6s ease-in-out infinite;
        }

        .stage-active-ring {
          animation: stage-ring-ping 1.8s ease-out infinite;
          opacity: 0;
        }

        .stage-active-ring-delay {
          animation: stage-ring-ping 1.8s ease-out 0.9s infinite;
          opacity: 0;
        }

        .stage-active-icon {
          animation: stage-icon-bounce 1.1s ease-in-out infinite;
        }

        .stage-active-icon-spark {
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 70%
          );
          background-size: 220% 100%;
          mix-blend-mode: overlay;
          animation: stage-icon-sheen 1.8s ease-in-out infinite;
        }

        .stage-active-chip {
          animation: stage-chip-pulse 1.3s ease-in-out infinite;
        }

        .stage-active-dot {
          animation: stage-dot-blink 0.9s ease-in-out infinite;
        }

        .stage-active-index {
          animation: stage-index-pulse 1.4s ease-in-out infinite;
        }

        .stage-active-sweep {
          background: linear-gradient(
            115deg,
            transparent 35%,
            rgba(255, 122, 47, 0.18) 50%,
            transparent 65%
          );
          background-size: 220% 100%;
          animation: stage-sweep 2.2s linear infinite;
        }

        .connector-active-flow {
          background-image: linear-gradient(
            90deg,
            #ffd8bc 0%,
            #ff7a2f 30%,
            #ffffff 50%,
            #ff7a2f 70%,
            #ffd8bc 100%
          );
          background-size: 220% 100%;
          animation: connector-flow 1.1s linear infinite;
          box-shadow: 0 0 12px rgba(255, 122, 47, 0.45);
        }

        .connector-active-arrow {
          animation: connector-arrow 1.1s ease-in-out infinite;
          filter: drop-shadow(0 0 4px rgba(255, 122, 47, 0.6));
        }

        @keyframes stage-glow {
          0%,
          100% {
            box-shadow:
              0 14px 28px rgba(255, 122, 47, 0.32),
              0 0 0 0 rgba(255, 122, 47, 0.55);
          }
          50% {
            box-shadow:
              0 24px 46px rgba(255, 122, 47, 0.55),
              0 0 0 10px rgba(255, 122, 47, 0.18);
          }
        }

        @keyframes stage-ring-ping {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          80% {
            transform: scale(1.28);
            opacity: 0;
          }
          100% {
            transform: scale(1.28);
            opacity: 0;
          }
        }

        @keyframes stage-icon-bounce {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.16) rotate(-4deg);
          }
        }

        @keyframes stage-icon-sheen {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @keyframes stage-chip-pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 4px 10px rgba(255, 122, 47, 0.3);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 6px 16px rgba(255, 122, 47, 0.55);
          }
        }

        @keyframes stage-dot-blink {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.7);
          }
        }

        @keyframes stage-index-pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 4px 10px rgba(255, 122, 47, 0.35);
          }
          50% {
            transform: scale(1.12);
            box-shadow: 0 6px 16px rgba(255, 122, 47, 0.6);
          }
        }

        @keyframes stage-sweep {
          0% {
            background-position: 130% 0;
          }
          100% {
            background-position: -130% 0;
          }
        }

        .pipeline-progress-fill {
          background-image: linear-gradient(
            90deg,
            rgba(255, 122, 47, 0.55) 0%,
            rgba(255, 138, 70, 0.5) 70%,
            rgba(255, 165, 110, 0.42) 100%
          );
          border-right: 2px solid rgba(255, 122, 47, 0.9);
          box-shadow: 0 0 18px rgba(255, 122, 47, 0.35) inset;
        }

        .pipeline-progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.35) 50%,
            transparent 100%
          );
          background-size: 220% 100%;
          animation: pipeline-shine 2.2s linear infinite;
          mix-blend-mode: overlay;
        }

        @keyframes pipeline-shine {
          0% {
            background-position: 130% 0;
          }
          100% {
            background-position: -130% 0;
          }
        }

        @keyframes connector-flow {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }

        @keyframes connector-arrow {
          0%,
          100% {
            transform: translateX(0);
            opacity: 0.85;
          }
          50% {
            transform: translateX(3px);
            opacity: 1;
          }
        }

        .pipeline-wave-active {
          opacity: 0.94;
          animation: none;
        }

        .pipeline-wave-done {
          opacity: 0.58;
          animation: none;
        }

        .done-border-light {
          box-shadow:
            0 0 0 1px rgba(255, 214, 188, 0.7),
            0 0 18px rgba(255, 122, 47, 0.14),
            0 0 38px rgba(255, 185, 143, 0.1),
            inset 0 0 18px rgba(255, 216, 188, 0.18);
        }

        .active-starfield {
          background:
            radial-gradient(
              circle at 18% 24%,
              rgba(255, 122, 47, 0.92) 0,
              rgba(255, 122, 47, 0.92) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 70% 16%,
              rgba(255, 190, 153, 0.85) 0,
              rgba(255, 190, 153, 0.85) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 42% 54%,
              rgba(255, 122, 47, 0.78) 0,
              rgba(255, 122, 47, 0.78) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 82% 64%,
              rgba(255, 210, 186, 0.82) 0,
              rgba(255, 210, 186, 0.82) 1px,
              transparent 2px
            ),
            radial-gradient(
              circle at 26% 82%,
              rgba(255, 122, 47, 0.72) 0,
              rgba(255, 122, 47, 0.72) 1px,
              transparent 2px
            );
          background-size: 140% 180%;
          mix-blend-mode: screen;
          opacity: 0.52;
          animation: active-stars 2.8s linear infinite;
        }

        .done-shimmer {
          background: linear-gradient(
            115deg,
            transparent 18%,
            rgba(255, 255, 255, 0.38) 33%,
            rgba(255, 195, 150, 0.2) 46%,
            transparent 62%
          );
          background-size: 220% 100%;
          animation: done-sheen 3.2s ease-in-out infinite;
        }

        .done-sparkle {
          animation: sparkle-pop 2.1s ease-in-out infinite;
        }

        .done-sparkle-delayed {
          animation: sparkle-pop 2.1s ease-in-out infinite 0.8s;
        }

        @keyframes pipeline-glow {
          0%,
          100% {
            opacity: 0.66;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes done-sheen {
          0% {
            background-position: 140% 0;
            opacity: 0.15;
          }
          25% {
            opacity: 0.38;
          }
          55% {
            background-position: -20% 0;
            opacity: 0.25;
          }
          100% {
            background-position: -60% 0;
            opacity: 0.12;
          }
        }

        @keyframes sparkle-pop {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.35);
            opacity: 1;
          }
        }

        @keyframes active-stars {
          0% {
            background-position:
              0% 0%,
              100% 0%,
              30% 40%,
              70% 30%,
              20% 100%;
          }
          100% {
            background-position:
              18% 120%,
              82% 125%,
              46% 154%,
              66% 138%,
              32% 190%;
          }
        }
      `}</style>
    </main>
  );
}
