import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  FileVideo2,
  Film,
  LayoutPanelLeft,
  Mic2,
  Minus,
  Play,
  Plus,
  Settings2,
  Sparkles,
  Subtitles,
  Wand2,
} from "lucide-react";

const pipelineStages = [
  {
    title: "Upload Source",
    subtitle: "원본 업로드",
    status: "done",
    accent: "from-sky-500 to-cyan-400",
  },
  {
    title: "Detect Stable Cuts",
    subtitle: "안정 구간 추출",
    status: "done",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    title: "Select Hooks",
    subtitle: "후킹 컷 선택",
    status: "active",
    accent: "from-fuchsia-500 to-indigo-500",
  },
  {
    title: "Build Body",
    subtitle: "바디 영상 조합",
    status: "idle",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    title: "Generate Script",
    subtitle: "대본 생성",
    status: "idle",
    accent: "from-amber-500 to-orange-400",
  },
  {
    title: "Sync TTS/Subtitles",
    subtitle: "싱크 보정",
    status: "idle",
    accent: "from-rose-500 to-pink-500",
  },
  {
    title: "Final Render",
    subtitle: "최종 렌더",
    status: "idle",
    accent: "from-slate-700 to-slate-500",
  },
] as const;

const sideMenu = [
  { label: "Overview", icon: LayoutPanelLeft, active: true },
  { label: "Shortform Jobs", icon: Film },
  { label: "Script Lab", icon: Wand2 },
  { label: "Audio Sync", icon: Mic2 },
  { label: "Assets", icon: FileVideo2 },
  { label: "Alerts", icon: Bell },
  { label: "Settings", icon: Settings2 },
];

const diagnostics = [
  ["Timing Mode", "Character boundary"],
  ["Subtitle Rule", "24 chars max"],
  ["TTS Source", "Narration one-take"],
  ["Body Deadline", "18.4s / target"],
  ["Retry Policy", "Cuts only x2"],
];

const files = [
  "원본 영상 업로드",
  "analysis.json 선택",
  "subtitles.srt 선택",
  "tts.wav 선택",
  "body.mp4 선택",
];

function StageBadge({ status }: { status: (typeof pipelineStages)[number]["status"] }) {
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
  title,
  subtitle,
  status,
  accent,
}: (typeof pipelineStages)[number] & { index: number }) {
  const active = status === "active";
  const done = status === "done";
  const Icon =
    title === "Upload Source"
      ? FileVideo2
      : title === "Detect Stable Cuts"
        ? Film
        : title === "Select Hooks"
          ? Sparkles
          : title === "Build Body"
            ? LayoutPanelLeft
            : title === "Generate Script"
              ? Wand2
              : title === "Sync TTS/Subtitles"
                ? Subtitles
                : Play;

  return (
    <div
      className={`relative w-[96px] rounded-[26px] border bg-white/82 px-3 py-3 text-center shadow-[0_16px_36px_rgba(0,0,0,0.06)] backdrop-blur-2xl ${
        active
          ? "border-[#ffcfb0] shadow-[0_20px_40px_rgba(255,122,47,0.14)] ring-4 ring-[#fff2e7]"
          : done
            ? "border-black/8"
            : "border-slate-100/90"
      }`}
    >
      <div className="absolute left-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#ffd8bc] bg-white/95 text-[10px] font-semibold text-[#ff7a2f] shadow-[0_5px_10px_rgba(255,122,47,0.10)]">
        {index}
      </div>

      <div
        className={`mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[15px] bg-gradient-to-br ${accent} p-[1px] shadow-[0_10px_18px_rgba(255,122,47,0.10)]`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white text-slate-900">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[9px] font-semibold leading-3.5 tracking-[-0.03em] text-slate-900">
          {title}
        </h3>
        <p className="text-[8px] font-medium leading-3 text-slate-400">{subtitle}</p>
      </div>

      <div className="mt-2.5 flex justify-center">
        <StageBadge status={status} />
      </div>
    </div>
  );
}

export default function AdminDesignPreviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,122,47,0.05),transparent_24%),linear-gradient(180deg,#fbfaf8_0%,#f3f1ec_100%)] px-5 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-[1540px]">
        <div className="overflow-hidden rounded-[34px] border border-black/5 bg-white/75 shadow-[0_30px_90px_rgba(24,29,49,0.12)] backdrop-blur-xl">
          <div className="border-b border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,250,248,0.92))] px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Admin</span>
                  <ChevronRight className="h-4 w-4" />
                  <span>Shortform Studio</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    RIFF Shortform Pipeline
                  </h1>
                  <span className="rounded-full bg-[#fff0e6] px-3 py-1 text-xs font-semibold text-[#d95d16]">
                    Live canvas preview
                  </span>
                </div>
                <p className="mt-2 max-w-[760px] text-sm leading-6 text-slate-500">
                  업로드부터 컷 선택, 바디 생성, 대본/TTS 싱크, 최종 렌더까지 한 화면에서
                  흐름을 확인하는 어드민 시안입니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                  Preview
                </button>
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                  Retry Stage
                </button>
                <button className="rounded-2xl bg-[#ff7a2f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,122,47,0.22)]">
                  Render Final
                </button>
              </div>
            </div>
          </div>

          <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_330px]">
            <aside className="border-r border-black/6 bg-[linear-gradient(180deg,#fcfbf8_0%,#f7f4ef_100%)] px-4 py-5">
              <div className="mb-6 rounded-[22px] bg-[linear-gradient(135deg,#fff9f4_0%,#ffffff_100%)] px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff7a2f]">
                  Control Room
                </div>
                <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                  Admin Board
                </div>
              </div>

              <nav className="space-y-1.5">
                {sideMenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                        item.active
                          ? "bg-[#fff3ea] font-semibold text-[#d95d16]"
                          : "text-slate-500 hover:bg-white"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.label}
                    </div>
                  );
                })}
              </nav>
            </aside>

            <section className="flex min-w-0 flex-col border-r border-black/6">
              <div className="border-b border-black/6 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Pipeline Canvas
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Shortform production board
                    </div>
                  </div>
                  <div className="rounded-2xl border border-black/6 bg-white px-3 py-2 text-sm text-slate-500">
                    Active stage: <span className="font-semibold text-slate-900">Select Hooks</span>
                  </div>
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(255,122,47,0.06),transparent_20%),radial-gradient(circle_at_80%_18%,rgba(255,186,143,0.08),transparent_18%),linear-gradient(180deg,#fdfcf9_0%,#fbfaf8_45%,#faf9f6_100%)] px-5 py-6">
                <div className="rounded-[30px] border border-white/80 bg-white/70 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Pipeline at a glance
                    </div>
                    <div className="text-xs text-slate-500">123 / 4 / 765</div>
                  </div>

                  <div className="grid gap-3">
                    <div className="relative h-[402px] overflow-hidden rounded-[34px] border border-white/80 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.99),rgba(255,252,248,0.96)_56%,rgba(252,248,243,0.88)_100%)]">
                      <div className="absolute left-3 top-4 z-20 flex flex-col gap-2 rounded-[20px] border border-white/80 bg-white/82 p-2 shadow-[0_12px_28px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                        {[
                          <Sparkles key="spark" className="h-4 w-4" />,
                          <LayoutPanelLeft key="hand" className="h-4 w-4" />,
                          <Plus key="plus" className="h-4 w-4" />,
                          <Minus key="minus" className="h-4 w-4" />,
                        ].map((icon, index) => (
                          <div
                            key={index}
                            className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                              index === 0
                                ? "bg-[linear-gradient(135deg,#fff2e8_0%,#fff8f3_100%)] text-[#ff7a2f]"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            {icon}
                          </div>
                        ))}
                      </div>

                      <svg
                        viewBox="0 0 1000 402"
                        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient id="pipelineLine" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f0ede8" stopOpacity="0.92" />
                            <stop offset="58%" stopColor="#ffb98f" stopOpacity="0.88" />
                            <stop offset="100%" stopColor="#ff7a2f" stopOpacity="0.88" />
                          </linearGradient>
                          <filter id="pipelineGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="7.2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="softBranchGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="4.8" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="ambientGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="14" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        <path
                          d="M 248 92
                             C 307 44, 390 129, 462 84"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="5.3"
                          strokeLinecap="round"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 462 84
                             C 528 42, 589 132, 648 94"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="5.1"
                          strokeLinecap="round"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 648 94
                             C 724 83, 801 138, 828 208"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 828 208
                             C 781 288, 679 262, 593 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="4.1"
                          strokeLinecap="round"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 593 309
                             C 545 349, 447 285, 379 321"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="4.1"
                          strokeLinecap="round"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 379 321
                             C 301 356, 257 271, 190 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="4.1"
                          strokeLinecap="round"
                          filter="url(#pipelineGlow)"
                        />

                        <path
                          d="M 248 92
                             C 214 152, 218 219, 190 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          opacity="0.66"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 462 84
                             C 452 144, 432 217, 379 321"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          opacity="0.64"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 648 94
                             C 669 150, 636 230, 593 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          opacity="0.64"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 462 84
                             C 577 126, 668 113, 828 208"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          opacity="0.56"
                          filter="url(#pipelineGlow)"
                        />
                        <path
                          d="M 379 321
                             C 521 301, 674 248, 828 208"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          opacity="0.54"
                          filter="url(#pipelineGlow)"
                        />

                        <path
                          d="M 248 92
                             C 282 120, 320 125, 364 161
                             C 393 184, 424 193, 462 191"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          opacity="0.46"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 462 84
                             C 492 116, 533 116, 576 153
                             C 609 182, 630 194, 648 193"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          opacity="0.46"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 648 94
                             C 687 130, 716 145, 752 188
                             C 777 217, 797 227, 828 208"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          opacity="0.48"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 828 208
                             C 783 213, 746 223, 707 243
                             C 666 263, 633 290, 593 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          opacity="0.48"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 593 309
                             C 552 280, 504 279, 462 295
                             C 428 307, 402 317, 379 321"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          opacity="0.45"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 379 321
                             C 340 291, 300 282, 258 291
                             C 226 298, 203 309, 190 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          opacity="0.45"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 248 92
                             C 221 112, 213 128, 210 153
                             C 207 178, 204 201, 195 223"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          opacity="0.38"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 195 223
                             C 184 249, 184 276, 190 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          opacity="0.36"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 462 84
                             C 448 104, 444 125, 444 149
                             C 444 180, 425 216, 404 248"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          opacity="0.38"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 404 248
                             C 392 271, 384 295, 379 321"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          opacity="0.36"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 648 94
                             C 653 116, 649 137, 642 161
                             C 632 192, 621 222, 599 259"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          opacity="0.38"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 599 259
                             C 590 278, 591 293, 593 309"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          opacity="0.36"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 462 84
                             C 434 101, 416 115, 389 128
                             C 356 144, 321 150, 248 153"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          opacity="0.28"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 648 94
                             C 616 105, 587 112, 555 111
                             C 520 110, 490 100, 462 84"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          opacity="0.28"
                          filter="url(#softBranchGlow)"
                        />
                        <path
                          d="M 828 208
                             C 790 194, 754 188, 716 191
                             C 678 194, 639 199, 604 213"
                          fill="none"
                          stroke="url(#pipelineLine)"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          opacity="0.3"
                          filter="url(#softBranchGlow)"
                        />

                        {[
                          [236, 96],
                          [466, 82],
                          [692, 102],
                          [846, 214],
                          [154, 306],
                          [378, 326],
                          [610, 302],
                        ].map(([cx, cy], index) => (
                          <g key={`${cx}-${cy}`}>
                            <circle cx={cx} cy={cy} r="10" fill="#fff" stroke="#efe7dc" strokeWidth="3" />
                            <circle
                              cx={cx}
                              cy={cy}
                              r="4.5"
                              fill={
                                index === 3
                                  ? "#ff7a2f"
                                  : index <= 3
                                    ? "#f1d9c7"
                                    : "#c7b19d"
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
                        <StageNode index={2} {...pipelineStages[1]} />
                      </div>
                      <div className="absolute left-[41.9%] top-[5.1%] z-10">
                        <StageNode index={4} {...pipelineStages[3]} />
                      </div>
                      <div className="absolute left-[64.5%] top-[9.8%] z-10">
                        <StageNode index={6} {...pipelineStages[5]} />
                      </div>
                      <div className="absolute left-[80.1%] top-[38.4%] z-10">
                        <StageNode index={7} {...pipelineStages[6]} />
                      </div>
                      <div className="absolute left-[10.1%] top-[60.7%] z-10">
                        <StageNode index={1} {...pipelineStages[0]} />
                      </div>
                      <div className="absolute left-[33.7%] top-[66.8%] z-10">
                        <StageNode index={3} {...pipelineStages[2]} />
                      </div>
                      <div className="absolute left-[57.2%] top-[59.6%] z-10">
                        <StageNode index={5} {...pipelineStages[4]} />
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl border border-black/6 bg-[#faf8f5] px-4 py-3">
                      <div className="text-sm text-slate-500">
                        Active stage: <span className="font-semibold text-slate-900">Select Hooks</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Progress: <span className="font-semibold text-slate-900">47%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-black/6 bg-[linear-gradient(180deg,#fbfaf8_0%,#f5f3ee_100%)] px-5 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Input Console
                    </div>
                    <div className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      하단에서 바로 작업 생성
                    </div>
                  </div>

                  <Link
                    href="/admin/create-shortform"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    기존 에디터 열기
                  </Link>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_0.95fr]">
                  <div className="rounded-[24px] border border-black/6 bg-white p-4 shadow-[0_14px_30px_rgba(32,36,61,0.05)]">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Start Mode
                    </div>
                    <div className="rounded-2xl border border-black/6 bg-[#f8f7f4] px-3 py-3 text-sm text-slate-700">
                      컷은 유지하고 문구만 다시 만들기
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["원본 영상", "analysis.json", "body.mp4", "tts.wav"].map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-[#ffd8bc] bg-white px-2.5 py-1 text-[11px] font-medium text-[#d95d16]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-4 shadow-[0_14px_30px_rgba(32,36,61,0.05)]">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Upload & Metadata
                    </div>
                    <div className="grid gap-2">
                      {files.map((file) => (
                        <div
                          key={file}
                          className="rounded-2xl border border-dashed border-black/10 bg-[#faf8f5] px-3 py-3 text-sm text-slate-500"
                        >
                          {file}
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-black/8 bg-[#faf8f5] px-3 py-3 text-sm text-slate-500">
                          매장 이름
                        </div>
                        <div className="rounded-2xl border border-black/8 bg-[#faf8f5] px-3 py-3 text-sm text-slate-500">
                          주소
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-4 shadow-[0_14px_30px_rgba(32,36,61,0.05)]">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Action Panel
                    </div>
                    <div className="space-y-3">
                      <button className="w-full rounded-2xl border border-[#ffd8bc] bg-white px-4 py-3 text-sm font-semibold text-[#d95d16] shadow-[0_16px_32px_rgba(255,122,47,0.08)]">
                        작업 시작
                      </button>
                      <div className="rounded-2xl border border-black/6 bg-[#faf8f5] px-3 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d99567]">
                          Latest Job
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-900">
                          #91cc5387ff75264c
                        </div>
                        <div className="mt-1 text-xs text-[#d95d16]">
                          Hook selection running · 47%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="bg-[linear-gradient(180deg,#fcfbf8_0%,#f7f4ef_100%)] px-5 py-5">
              <div className="rounded-[26px] border border-black/6 bg-white p-5 shadow-[0_18px_40px_rgba(32,36,61,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Selected Stage
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      Select Hooks
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      음식 훅 후보 선별과 랭킹 조정 단계
                    </div>
                  </div>
                  <StageBadge status="active" />
                </div>

                <div className="mt-6 space-y-3">
                  {diagnostics.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-black/6 bg-[#faf8f5] px-3 py-3"
                    >
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-indigo-100 bg-[linear-gradient(180deg,#f7f7ff_0%,#f2f0ff_100%)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock3 className="h-4 w-4 text-indigo-500" />
                    Live diagnostics
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <div>• 청크 경계 근처 hook 후보 3개 비교 중</div>
                    <div>• 내부 컷은 quality threshold 미달 시 제외 예정</div>
                    <div>• body 기준 TTS deadline 재계산 대기</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
