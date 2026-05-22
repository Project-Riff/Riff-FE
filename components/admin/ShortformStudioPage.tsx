"use client";

import {
  ResumeFrom,
  useShortformPipeline,
} from "@/components/admin/useShortformPipeline";
import {
  CheckCircle2,
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
import { useState } from "react";

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
  subtitle,
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
      className={`relative w-[96px] rounded-[26px] border px-3 py-3 text-center shadow-[0_10px_24px_rgba(0,0,0,0.035)] backdrop-blur-2xl ${
        active
          ? "border-[#ffcfb0] bg-white/92 shadow-[0_16px_34px_rgba(255,122,47,0.12)] ring-2 ring-[#fff2e7]"
          : done
            ? "border-[#ffd8bc] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f3_100%)] shadow-[0_14px_28px_rgba(255,122,47,0.08)] done-border-light"
            : "border-slate-100/90 bg-white/80"
      } ${selected ? "ring-2 ring-[#ffe7d7] shadow-[0_16px_30px_rgba(255,122,47,0.10)]" : ""} transition hover:-translate-y-0.5 hover:border-[#ffd8bc]`}
    >
      {done ? (
        <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(255,122,47,0.12),transparent_52%)]" />
      ) : null}
      {active ? (
        <>
          <div className="pointer-events-none absolute inset-[-8px] rounded-[30px] border border-[#ffd9bf] opacity-70" />
          <div className="active-starfield pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]" />
        </>
      ) : null}
      {done ? (
        <>
          <div className="done-shimmer pointer-events-none absolute inset-0 rounded-[26px]" />
          <div className="pointer-events-none absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[#ff7a2f] shadow-[0_0_12px_rgba(255,122,47,0.9)] done-sparkle" />
          <div className="pointer-events-none absolute bottom-3 left-4 h-1 w-1 rounded-full bg-[#ffb98f] shadow-[0_0_10px_rgba(255,185,143,0.9)] done-sparkle-delayed" />
        </>
      ) : null}

      <div className="absolute left-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#ffd8bc] bg-white/95 text-[10px] font-semibold text-[#ff7a2f] shadow-[0_5px_10px_rgba(255,122,47,0.10)]">
        {index}
      </div>

      <div
        className={`mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[15px] bg-gradient-to-br ${accent} p-[1px] shadow-[0_10px_18px_rgba(255,122,47,0.10)] ${active ? "animate-pulse" : ""}`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white text-slate-900">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-[9px] font-semibold leading-3.5 tracking-[-0.03em] text-slate-900">
          {title}
        </h3>
        <p className="text-[8px] font-medium leading-3 text-slate-400">
          {subtitle}
        </p>
      </div>

      <div className="mt-2.5 flex justify-center">
        <StageBadge status={status} />
      </div>
    </button>
  );
}

export default function ShortformStudioPage() {
  const [showStoreFields, setShowStoreFields] = useState(false);
  const [selectedStageKey, setSelectedStageKey] = useState<
    (typeof pipelineStages)[number]["key"] | null
  >(null);

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
    guide,
    stageText,
    updateStoreField,
    pickFile,
    handleUpload,
  } = useShortformPipeline();

  const pipelineStatuses = deriveStageStatuses(job?.stage, job?.message);
  const currentStep = resolvePipelineStep(job?.stage, job?.message);
  const currentStage = pipelineStages[currentStep - 1] ?? pipelineStages[0];
  const pipelinePercent = progress;
  const effectiveSelectedStageKey = selectedStageKey ?? currentStage.key;
  const selectedStageIndex = pipelineStages.findIndex(
    (stage) => stage.key === effectiveSelectedStageKey,
  );
  const selectedStage =
    pipelineStages[selectedStageIndex] ?? pipelineStages[0];
  const selectedStageStatus =
    pipelineStatuses[selectedStageIndex] ?? ("idle" as PipelineVisualStatus);
  const selectedSegments = job?.analysis?.segments ?? [];
  const generatedTitle = job?.analysis?.title?.trim() ?? "";
  const generatedNarration = job?.analysis?.narration?.trim() ?? "";
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

  return (
    <main className="min-h-screen bg-white px-5 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-[1540px]">
        <div className="relative">
          <div className="px-2 pb-1 pt-2">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mt-1">
                  <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
                    Shortform Studio
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-2"></div>
            </div>
          </div>

          <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 gap-10 xl:items-start xl:grid-cols-[minmax(0,1fr)_280px]">
            <section className="flex min-w-0 flex-col px-1">
              <div className="relative flex-1 overflow-hidden rounded-[36px] bg-white px-6 py-7 shadow-[0_18px_44px_rgba(24,29,49,0.04)]">
                <div className="p-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Pipeline at a glance
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="relative h-[402px] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.99),rgba(255,252,248,0.96)_56%,rgba(252,248,243,0.88)_100%)]">
                      <div className="absolute inset-0 -translate-y-[3%]">
                        <svg
                          viewBox="0 0 1000 402"
                          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient
                              id="pipelineLine"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor="#f0ede8"
                                stopOpacity="0.92"
                              />
                              <stop
                                offset="58%"
                                stopColor="#ffb98f"
                                stopOpacity="0.88"
                              />
                              <stop
                                offset="100%"
                                stopColor="#ff7a2f"
                                stopOpacity="0.88"
                              />
                            </linearGradient>
                            <linearGradient
                              id="pipelineWaveTemplate"
                              gradientUnits="userSpaceOnUse"
                              x1="0"
                              y1="0"
                              x2="560"
                              y2="0"
                            >
                              <stop
                                offset="0%"
                                stopColor="rgba(255,122,47,0)"
                              />
                              <stop
                                offset="18%"
                                stopColor="rgba(255,214,188,0.05)"
                              />
                              <stop
                                offset="34%"
                                stopColor="rgba(255,214,188,0.12)"
                              />
                              <stop
                                offset="48%"
                                stopColor="rgba(255,185,143,0.26)"
                              />
                              <stop
                                offset="58%"
                                stopColor="rgba(255,122,47,0.86)"
                              />
                              <stop
                                offset="70%"
                                stopColor="rgba(255,185,143,0.24)"
                              />
                              <stop
                                offset="84%"
                                stopColor="rgba(255,214,188,0.1)"
                              />
                              <stop
                                offset="100%"
                                stopColor="rgba(255,122,47,0)"
                              />
                            </linearGradient>
                            {Array.from({ length: waveCount }).map(
                              (_, waveIndex) => (
                                <linearGradient
                                  key={`pipelineWaveSweep-${waveIndex}`}
                                  id={`pipelineWaveSweep-${waveIndex}`}
                                  href="#pipelineWaveTemplate"
                                  gradientUnits="userSpaceOnUse"
                                  x1="0"
                                  y1="0"
                                  x2="560"
                                  y2="0"
                                >
                                  <animateTransform
                                    attributeName="gradientTransform"
                                    type="translate"
                                    from={`${sweepStartX} 0`}
                                    to={`${sweepEndX} 0`}
                                    dur={`${waveTravelDurationSec}s`}
                                    begin={`${waveIndex * waveStartGapSec}s`}
                                    repeatCount="indefinite"
                                  />
                                </linearGradient>
                              ),
                            )}
                            <filter
                              id="pipelineGlow"
                              x="-20%"
                              y="-20%"
                              width="140%"
                              height="140%"
                            >
                              <feGaussianBlur
                                stdDeviation="7.2"
                                result="blur"
                              />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            <filter
                              id="softBranchGlow"
                              x="-30%"
                              y="-30%"
                              width="160%"
                              height="160%"
                            >
                              <feGaussianBlur
                                stdDeviation="4.8"
                                result="blur"
                              />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            <filter
                              id="ambientGlow"
                              x="-30%"
                              y="-30%"
                              width="160%"
                              height="160%"
                            >
                              <feGaussianBlur stdDeviation="14" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {orderedMainSegments.map((path, index) => {
                            const leftStatus = pipelineStatuses[index];
                            const rightStatus = pipelineStatuses[index + 1];
                            const segmentStatus =
                              leftStatus === "done" && rightStatus === "done"
                                ? "done"
                                : leftStatus === "done" &&
                                    rightStatus === "active"
                                  ? "active"
                                  : "idle";

                            return (
                              <g key={`main-${index}`}>
                                <path
                                  d={path.d}
                                  fill="none"
                                  stroke="url(#pipelineLine)"
                                  strokeWidth={path.width}
                                  strokeLinecap="round"
                                  opacity={
                                    segmentStatus === "idle" ? 0.42 : 0.92
                                  }
                                  filter="url(#pipelineGlow)"
                                />
                                {segmentStatus !== "idle" ? (
                                  <>
                                    {Array.from({ length: waveCount }).map(
                                      (_, waveIndex) => (
                                        <path
                                          key={`wave-${index}-${waveIndex}`}
                                          d={path.d}
                                          fill="none"
                                          stroke={`url(#pipelineWaveSweep-${waveIndex})`}
                                          strokeWidth={path.width + 0.42}
                                          strokeLinecap="round"
                                          className={
                                            segmentStatus === "done"
                                              ? "pipeline-wave-done"
                                              : "pipeline-wave-active"
                                          }
                                          filter="url(#pipelineGlow)"
                                        />
                                      ),
                                    )}
                                  </>
                                ) : null}
                                <path
                                  d={path.d}
                                  fill="none"
                                  stroke="rgba(255,255,255,0.72)"
                                  strokeWidth={Math.max(1, path.width - 2.6)}
                                  strokeLinecap="round"
                                  opacity={
                                    segmentStatus === "idle" ? 0.18 : 0.28
                                  }
                                />
                              </g>
                            );
                          })}
                          {orderedSupportSegments.map((segment, index) => {
                            return (
                              <g key={`support-${index}`}>
                                {segment.map((path, subIndex) => (
                                  <path
                                    key={`support-${index}-${subIndex}`}
                                    d={path.d}
                                    fill="none"
                                    stroke="url(#pipelineLine)"
                                    strokeWidth={path.width}
                                    strokeLinecap="round"
                                    opacity={path.opacity}
                                    filter={`url(#${path.glow})`}
                                  />
                                ))}
                              </g>
                            );
                          })}

                          {stageNodePoints.map(({ x: cx, y: cy }, index) => (
                            <g key={`${cx}-${cy}`}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r="10"
                                fill="#fff"
                                stroke={
                                  pipelineStatuses[index] === "idle"
                                    ? "#efe7dc"
                                    : "#ffd7bc"
                                }
                                strokeWidth="3"
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r="4.5"
                                fill={
                                  pipelineStatuses[index] === "active"
                                    ? "#ff7a2f"
                                    : pipelineStatuses[index] === "done"
                                      ? "#ffb98f"
                                      : "#d9cdc1"
                                }
                                className={
                                  pipelineStatuses[index] === "active"
                                    ? "animate-pulse"
                                    : ""
                                }
                              />
                            </g>
                          ))}

                          {[
                            [332, 68],
                            [549, 108],
                            [744, 132],
                            [720, 281],
                            [501, 292],
                            [285, 342],
                            [208, 198],
                            [432, 192],
                          ].map(([cx, cy], index) => (
                            <circle
                              key={`spark-${index}`}
                              cx={cx}
                              cy={cy}
                              r="3.5"
                              fill={index % 2 === 0 ? "#ffd1ab" : "#ffb98f"}
                              opacity="0.72"
                              filter="url(#ambientGlow)"
                            />
                          ))}
                        </svg>

                        <div className="absolute left-[18.7%] top-[8.5%] z-10">
                          <StageNode
                            index={2}
                            nodeKey={pipelineStages[1].key}
                            title={pipelineStages[1].title}
                            subtitle={pipelineStages[1].subtitle}
                            accent={pipelineStages[1].accent}
                            status={pipelineStatuses[1]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[1].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[1].key)
                            }
                          />
                        </div>
                        <div className="absolute left-[41.9%] top-[5.1%] z-10">
                          <StageNode
                            index={4}
                            nodeKey={pipelineStages[3].key}
                            title={pipelineStages[3].title}
                            subtitle={pipelineStages[3].subtitle}
                            accent={pipelineStages[3].accent}
                            status={pipelineStatuses[3]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[3].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[3].key)
                            }
                          />
                        </div>
                        <div className="absolute left-[64.5%] top-[9.8%] z-10">
                          <StageNode
                            index={6}
                            nodeKey={pipelineStages[5].key}
                            title={pipelineStages[5].title}
                            subtitle={pipelineStages[5].subtitle}
                            accent={pipelineStages[5].accent}
                            status={pipelineStatuses[5]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[5].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[5].key)
                            }
                          />
                        </div>
                        <div className="absolute left-[80.1%] top-[38.4%] z-10">
                          <StageNode
                            index={7}
                            nodeKey={pipelineStages[6].key}
                            title={pipelineStages[6].title}
                            subtitle={pipelineStages[6].subtitle}
                            accent={pipelineStages[6].accent}
                            status={pipelineStatuses[6]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[6].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[6].key)
                            }
                          />
                        </div>
                        <div className="absolute left-[10.1%] top-[60.7%] z-10">
                          <StageNode
                            index={1}
                            nodeKey={pipelineStages[0].key}
                            title={pipelineStages[0].title}
                            subtitle={pipelineStages[0].subtitle}
                            accent={pipelineStages[0].accent}
                            status={pipelineStatuses[0]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[0].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[0].key)
                            }
                          />
                        </div>
                        <div className="absolute left-[33.7%] top-[66.8%] z-10">
                          <StageNode
                            index={3}
                            nodeKey={pipelineStages[2].key}
                            title={pipelineStages[2].title}
                            subtitle={pipelineStages[2].subtitle}
                            accent={pipelineStages[2].accent}
                            status={pipelineStatuses[2]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[2].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[2].key)
                            }
                          />
                        </div>
                        <div className="absolute left-[57.2%] top-[59.6%] z-10">
                          <StageNode
                            index={5}
                            nodeKey={pipelineStages[4].key}
                            title={pipelineStages[4].title}
                            subtitle={pipelineStages[4].subtitle}
                            accent={pipelineStages[4].accent}
                            status={pipelineStatuses[4]}
                            selected={
                              effectiveSelectedStageKey === pipelineStages[4].key
                            }
                            onClick={() =>
                              setSelectedStageKey(pipelineStages[4].key)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl bg-[#faf9f6] px-4 py-3">
                      <div className="text-sm text-slate-500">
                        Active stage:{" "}
                        <span className="font-semibold text-slate-900">
                          {currentStage.title}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Progress:{" "}
                        <span className="font-semibold text-slate-900">
                          {pipelinePercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[30px] bg-white px-5 py-6 shadow-[0_18px_44px_rgba(24,29,49,0.04)]">
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

                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Input Console
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      하단에서 바로 작업 생성
                    </div>
                  </div>

                </div>

                <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_0.82fr_0.95fr]">
                  <div className="rounded-[24px] bg-white/92 p-5 shadow-[0_12px_24px_rgba(32,36,61,0.035)]">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Start Mode
                    </div>
                    <select
                      value={resumeFrom}
                      onChange={(e) =>
                        setResumeFrom(e.target.value as ResumeFrom)
                      }
                      className="w-full rounded-2xl border border-black/6 bg-[#f8f7f4] px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ffcfb0] focus:bg-white"
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
                    <div className="mt-4 rounded-2xl bg-[#fffaf6] px-3 py-3 text-xs leading-5 text-[#b5541c]">
                      {guide.desc}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {guide.required.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-[#ffd8bc] bg-white px-2.5 py-1 text-[11px] font-medium text-[#d95d16]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-white/92 p-5 shadow-[0_12px_24px_rgba(32,36,61,0.035)]">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Upload & Metadata
                    </div>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="rounded-2xl border border-dashed border-black/10 bg-[#faf8f5] px-3 py-3 text-left text-sm text-slate-500"
                      >
                        {pickedFile?.name || "원본 영상 업로드"}
                      </button>
                      <button
                        type="button"
                        onClick={() => analysisRef.current?.click()}
                        className="rounded-2xl border border-dashed border-black/10 bg-[#faf8f5] px-3 py-3 text-left text-sm text-slate-500"
                      >
                        {analysisFile?.name || "analysis.json 선택"}
                      </button>
                      <button
                        type="button"
                        onClick={() => subtitleRef.current?.click()}
                        className="rounded-2xl border border-dashed border-black/10 bg-[#faf8f5] px-3 py-3 text-left text-sm text-slate-500"
                      >
                        {subtitleFile?.name || "subtitles.srt 선택"}
                      </button>
                      <button
                        type="button"
                        onClick={() => ttsRef.current?.click()}
                        className="rounded-2xl border border-dashed border-black/10 bg-[#faf8f5] px-3 py-3 text-left text-sm text-slate-500"
                      >
                        {ttsFile?.name || "tts.wav 선택"}
                      </button>
                      <button
                        type="button"
                        onClick={() => bodyRef.current?.click()}
                        className="rounded-2xl border border-dashed border-black/10 bg-[#faf8f5] px-3 py-3 text-left text-sm text-slate-500"
                      >
                        {bodyFile?.name || "body.mp4 선택"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowStoreFields((prev) => !prev)}
                        className="rounded-2xl border border-[#ffd8bc] bg-white px-3 py-3 text-left text-sm font-medium text-[#d95d16] transition hover:bg-[#fffaf6]"
                      >
                        {showStoreFields
                          ? "매장 정보 입력 닫기"
                          : "매장 정보 입력"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-white/92 p-5 shadow-[0_12px_24px_rgba(32,36,61,0.035)]">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Action Panel
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full rounded-2xl border border-[#ffd8bc] bg-white px-4 py-3 text-sm font-semibold text-[#d95d16] shadow-[0_16px_32px_rgba(255,122,47,0.08)] disabled:opacity-50"
                      >
                        {isUploading ? "처리 중..." : "작업 시작"}
                      </button>
                      <div className="rounded-2xl bg-[#faf8f5] px-3 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d99567]">
                          Latest Job
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-900">
                          {jobId ? `#${jobId}` : "-"}
                        </div>
                        <div className="mt-1 text-xs text-[#d95d16]">
                          {job
                            ? `${stageText} · ${progress}%`
                            : "아직 실행된 작업이 없습니다"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-white/92 p-5 shadow-[0_12px_24px_rgba(32,36,61,0.035)]">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        Result Preview
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                        Final
                      </div>
                    </div>

                    {job?.artifacts?.finalUrl ? (
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-[22px] border border-black/8 bg-black">
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
                          className="inline-flex items-center rounded-2xl border border-[#ffd8bc] bg-white px-3 py-2 text-sm font-medium text-[#d95d16] transition hover:bg-[#fffaf6]"
                        >
                          새 창에서 보기
                        </a>
                      </div>
                    ) : (
                      <div className="flex aspect-[9/16] w-full items-center justify-center rounded-[22px] border border-dashed border-black/10 bg-[#faf8f5] px-6 text-center text-sm leading-6 text-slate-400">
                        최종 렌더가 완료되면
                        <br />이 영역에 영상이 표시됩니다
                      </div>
                    )}
                  </div>
                </div>

                {uploadNotice ? (
                  <div className="mt-4 rounded-2xl border border-[#ffd8bc] bg-[#fff8f3] px-4 py-3 text-xs leading-5 text-[#b5541c]">
                    {uploadNotice}
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                    {error}
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="self-start px-3 py-6 xl:sticky xl:top-6 xl:pt-[78px]">
              <div className="flex h-[720px] min-h-0 flex-col overflow-hidden rounded-[28px] bg-white/72 px-1">
                <div className="border-l border-[#f1e8df] pl-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Selected Stage
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <h2 className="text-[30px] font-semibold tracking-[-0.05em] text-slate-950">
                      {selectedStage.title}
                    </h2>
                    <StageBadge status={selectedStageStatus} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedStage.subtitle}
                  </p>
                </div>

                <div className="mt-8 flex min-h-0 flex-1 flex-col border-l border-[#f6eee7] pl-5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    <Clock3 className="h-3.5 w-3.5 text-[#ff7a2f]" />
                    Diagnostics
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                        Current
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {stageText}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                        Progress
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {pipelinePercent}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                        Latest status
                      </div>
                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        {job?.message ?? "아직 실행 전"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 h-0 min-h-0 flex-1 overflow-y-auto pr-2">
                    {effectiveSelectedStageKey === "hooks" ? (
                      <div className="pb-2 pt-2">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                          Selected Segments
                        </div>
                        {selectedSegments.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            {selectedSegments.map((segment, index) => (
                              <div
                                key={`${segment.start}-${segment.end}-${index}`}
                                className="rounded-2xl bg-[#faf8f5] px-3 py-3"
                              >
                                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d99567]">
                                  {formatSegmentTime(segment.start)} -{" "}
                                  {formatSegmentTime(segment.end)}
                                </div>
                                <div className="mt-1 text-sm leading-6 text-slate-700">
                                  {segment.label ?? "선택된 구간"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm leading-6 text-slate-400">
                            컷 분석이 완료되면 선택된 구간이 표시됩니다.
                          </div>
                        )}
                      </div>
                    ) : null}
                    {effectiveSelectedStageKey === "script" ? (
                      <div className="pb-2 pt-2">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                          Generated Script
                        </div>
                        {generatedTitle || generatedNarration ? (
                          <div className="mt-3 rounded-2xl bg-[#faf8f5] px-4 py-4">
                            {generatedTitle ? (
                              <div className="text-sm font-semibold text-slate-900">
                                {generatedTitle}
                              </div>
                            ) : null}
                            <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                              {generatedNarration || "아직 생성된 대본이 없습니다."}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm leading-6 text-slate-400">
                            문구 생성이 완료되면 제목과 대본이 표시됩니다.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showStoreFields ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,17,17,0.28)] px-4 backdrop-blur-[6px]">
          <div className="w-full max-w-[760px] rounded-[32px] border border-black/6 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d99567]">
                  Store Metadata
                </div>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  매장 정보 입력
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  기존 영상 생성 페이지에서 쓰는 매장 정보 필드를 그대로
                  입력합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowStoreFields(false)}
                className="rounded-2xl border border-black/8 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <input
                value={storeInfo.name}
                onChange={(e) => updateStoreField("name", e.target.value)}
                placeholder="매장 이름"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
              />
              <input
                value={storeInfo.instagram}
                onChange={(e) => updateStoreField("instagram", e.target.value)}
                placeholder="인스타그램"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
              />
              <input
                value={storeInfo.address}
                onChange={(e) => updateStoreField("address", e.target.value)}
                placeholder="주소"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
              />
              <input
                value={storeInfo.phone}
                onChange={(e) => updateStoreField("phone", e.target.value)}
                placeholder="전화번호"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
              />
              <input
                value={storeInfo.subtitle}
                onChange={(e) => updateStoreField("subtitle", e.target.value)}
                placeholder="부제"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
              />
              <input
                value={storeInfo.strengths}
                onChange={(e) => updateStoreField("strengths", e.target.value)}
                placeholder="가게 특장점"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
              />
              <div className="md:col-span-2">
                <input
                  value={storeInfo.hours}
                  onChange={(e) => updateStoreField("hours", e.target.value)}
                  placeholder="영업시간"
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#ffcfb0]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStoreFields(false)}
                className="rounded-2xl bg-[#ff7a2f] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(255,122,47,0.18)]"
              >
                입력 완료
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
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
