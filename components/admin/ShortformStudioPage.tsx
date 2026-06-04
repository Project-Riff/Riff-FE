"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Clipboard,
  Download,
  FileJson,
  FileText,
  FileVideo2,
  Film,
  Image as ImageIcon,
  Loader2,
  Mic2,
  Play,
  Upload,
  Volume2,
} from "lucide-react";
import Lottie from "lottie-react";
import { useState } from "react";
import {
  ResumeFrom,
  STAGE_LABELS,
  useShortformPipeline,
} from "@/components/admin/useShortformPipeline";
import loadingAnimation from "@/public/lottie/loading.json";

const resumeOptions: Array<{ value: ResumeFrom; label: string }> = [
  { value: "full", label: "처음부터" },
  { value: "analysis", label: "분석부터" },
  { value: "script", label: "문구만" },
  { value: "title", label: "제목만" },
  { value: "subtitle-only", label: "부제만" },
  { value: "subtitle", label: "자막부터" },
  { value: "tts", label: "TTS부터" },
  { value: "body", label: "합성만" },
];

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#777]">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[12px] border border-[#ededed] bg-white px-3 text-[13px] text-[#111] outline-none transition placeholder:text-[#c2c2c2] focus:border-[#ffcfb0] focus:bg-[#fffaf6]"
      />
    </label>
  );
}

function FileButton({
  label,
  fileName,
  icon: Icon,
  onClick,
  required,
}: {
  label: string;
  fileName?: string;
  icon: typeof FileVideo2;
  onClick: () => void;
  required?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 min-w-0 items-center gap-2 rounded-[12px] border border-dashed border-[#ffd8bc] bg-[#fffaf6] px-3 text-left text-[12px] font-medium text-[#b5541c] transition hover:bg-[#fff4ed]"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{fileName || label}</span>
      {required && (
        <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[9px] text-[#ff7a2f]">
          필수
        </span>
      )}
    </button>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[16px] border border-[#f0f0f0] bg-white p-4",
        className,
      ].join(" ")}
    >
      <h2 className="mb-3 shrink-0 font-[var(--font-serif)] text-[18px] tracking-[-0.02em] text-[#111]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ShortformStudioPage() {
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<
    number | null
  >(null);
  const [isThumbnailPickerOpen, setIsThumbnailPickerOpen] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  const {
    fileRef,
    analysisRef,
    subtitleRef,
    ttsRef,
    bodyRef,
    dragOver,
    setDragOver,
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

  const needsAnalysis = [
    "analysis",
    "script",
    "title",
    "subtitle-only",
    "subtitle",
  ].includes(resumeFrom);

  const needsSubtitle = ["subtitle", "tts", "body"].includes(resumeFrom);
  const needsTts = ["title", "subtitle-only", "tts", "body"].includes(resumeFrom);
  const needsBody = ["script", "title", "subtitle-only", "tts", "body"].includes(
    resumeFrom,
  );

  const jobLogs = job?.logs ?? [];
  const finalUrl = job?.artifacts?.finalUrl;
  const latestLog = jobLogs[jobLogs.length - 1];

  const latestLogStatus =
    latestLog?.stage === "done"
      ? "완료"
      : latestLog?.stage === "error"
        ? "오류"
        : "진행 중";

  const thumbnailCandidates =
    job?.artifacts?.thumbnailCandidates &&
    job.artifacts.thumbnailCandidates.length > 0
      ? job.artifacts.thumbnailCandidates
      : job?.artifacts?.thumbnailUrl
        ? [{ index: 0, url: job.artifacts.thumbnailUrl, path: "" }]
        : [];

  const preferredThumbnailIndex =
    typeof job?.artifacts?.thumbnailPreferredIndex === "number"
      ? job.artifacts.thumbnailPreferredIndex
      : thumbnailCandidates[0]?.index;

  const activeThumbnailIndex =
    selectedThumbnailIndex !== null &&
    thumbnailCandidates.some((item) => item.index === selectedThumbnailIndex)
      ? selectedThumbnailIndex
      : preferredThumbnailIndex;

  const activeThumbnail =
    thumbnailCandidates.find((item) => item.index === activeThumbnailIndex) ??
    thumbnailCandidates[0];

  const currentStage = job?.stage ?? "";

  const bodyDone =
    Boolean(job?.artifacts?.bodyPath || job?.artifacts?.finalUrl) ||
    ["tts", "bgm", "rendering", "done"].includes(currentStage) ||
    progress >= 65;

  const subtitleDone =
    bodyDone &&
    (Boolean(job?.artifacts?.subtitlePath || job?.artifacts?.subtitleUrl) ||
      Boolean(job?.analysis?.subtitles?.length) ||
      ["bgm", "rendering", "done"].includes(currentStage) ||
      progress >= 78);

  const completedItems = [
    {
      label: "컷분석완료",
      done: Boolean(job?.analysis?.segments?.length) || progress >= 45,
    },
    {
      label: "body 영상 준비 완료",
      done: bodyDone,
    },
    {
      label: "자막 동기화 완료",
      done: subtitleDone,
    },
    {
      label: "인스타그램 본문 생성 완료",
      done: Boolean(job?.artifacts?.instagramCaption) || currentStage === "done",
    },
  ];

  return (
    <main className="studio-scroll bg-white px-5 py-5 text-[#111] md:px-7 md:py-6 xl:h-screen xl:overflow-hidden">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => pickFile(event.target.files?.[0])}
      />
      <input
        ref={analysisRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => setAnalysisFile(event.target.files?.[0] ?? null)}
      />
      <input
        ref={subtitleRef}
        type="file"
        accept=".srt,.vtt,.txt"
        className="hidden"
        onChange={(event) => setSubtitleFile(event.target.files?.[0] ?? null)}
      />
      <input
        ref={ttsRef}
        type="file"
        accept=".wav,audio/wav"
        className="hidden"
        onChange={(event) => setTtsFile(event.target.files?.[0] ?? null)}
      />
      <input
        ref={bodyRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => setBodyFile(event.target.files?.[0] ?? null)}
      />

      <div className="mx-auto w-full max-w-[1440px] xl:h-full xl:max-w-none">
        <div className="grid gap-3 xl:h-full xl:grid-cols-[315px_minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid min-h-0 gap-3 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
            <Panel title="매장 정보">
              <div className="grid gap-3">
                <Field
                  label="주소"
                  value={storeInfo.address}
                  placeholder="예: 서울 성수동"
                  onChange={(value) => updateStoreField("address", value)}
                />
                <Field
                  label="부제"
                  value={storeInfo.subtitle}
                  placeholder="짧은 소개"
                  onChange={(value) => updateStoreField("subtitle", value)}
                />
                <Field
                  label="특장점"
                  value={storeInfo.strengths}
                  placeholder="메뉴, 분위기, 강점"
                  onChange={(value) => updateStoreField("strengths", value)}
                />
                <Field
                  label="썸네일"
                  value={storeInfo.thumbnailTitle || ""}
                  placeholder="비워두면 자동"
                  onChange={(value) =>
                    updateStoreField("thumbnailTitle", value)
                  }
                />
              </div>
            </Panel>

            <Panel
              title="작업 설정"
              className="studio-scroll flex min-h-0 flex-col xl:overflow-y-auto"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div>
                  <div className="mb-1.5 text-[11px] font-medium text-[#777]">
                    시작 위치
                  </div>
                  <select
                    value={resumeFrom}
                    onChange={(event) =>
                      setResumeFrom(event.target.value as ResumeFrom)
                    }
                    className="h-10 w-full rounded-[12px] border border-[#ededed] bg-white px-3 text-[13px] text-[#111] outline-none transition focus:border-[#ffcfb0] focus:bg-[#fffaf6]"
                  >
                    {resumeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#999]">
                    {guide.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    pickFile(event.dataTransfer.files?.[0]);
                  }}
                  className={[
                    "flex min-h-[82px] items-center gap-3 rounded-[14px] border border-dashed p-3 text-left transition",
                    dragOver
                      ? "border-[#ff7a2f] bg-[#fff4ed]"
                      : "border-[#ffd8bc] bg-[#fffaf6] hover:bg-[#fff4ed]",
                  ].join(" ")}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#ff7a2f]">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[#111]">
                      {pickedFile?.name || "원본 영상"}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#999]">
                      MP4 / MOV / WEBM
                    </span>
                  </span>
                </button>

                {(needsAnalysis || needsSubtitle || needsTts || needsBody) && (
                  <div className="grid gap-2">
                    {needsAnalysis && (
                      <FileButton
                        label="analysis.json"
                        fileName={analysisFile?.name}
                        icon={FileJson}
                        onClick={() => analysisRef.current?.click()}
                        required
                      />
                    )}
                    {needsSubtitle && (
                      <FileButton
                        label="subtitles.srt"
                        fileName={subtitleFile?.name}
                        icon={FileText}
                        onClick={() => subtitleRef.current?.click()}
                        required
                      />
                    )}
                    {needsTts && (
                      <FileButton
                        label="tts.wav"
                        fileName={ttsFile?.name}
                        icon={Mic2}
                        onClick={() => ttsRef.current?.click()}
                        required
                      />
                    )}
                    {needsBody && (
                      <FileButton
                        label="body.mp4"
                        fileName={bodyFile?.name}
                        icon={FileVideo2}
                        onClick={() => bodyRef.current?.click()}
                        required
                      />
                    )}
                  </div>
                )}

                {uploadNotice && (
                  <div className="rounded-[12px] border border-[#ffd8bc] bg-[#fffaf6] px-3 py-2 text-[11px] leading-5 text-[#b5541c]">
                    {uploadNotice}
                  </div>
                )}

                {error && (
                  <div className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] leading-5 text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="mt-auto flex h-11 items-center justify-center gap-2 rounded-full bg-[#ff7a2f] px-4 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(255,122,47,0.22)] transition hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      처리 중
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      작업 시작
                    </>
                  )}
                </button>
              </div>
            </Panel>
          </div>

          <div className="grid min-h-0 gap-3 xl:h-full xl:grid-rows-[270px_minmax(0,1fr)]">
<Panel
  title="진행 상황"
  className="flex min-h-0 flex-col overflow-hidden"
>
  <div className="grid min-h-0 flex-1 items-stretch gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_240px]">
    <div className="min-w-0 overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#111]">
            {job ? stageText : "대기 중"}
          </p>

          <p className="mt-1 truncate font-mono text-[11px] text-[#999]">
            {jobId ? `#${jobId}` : "작업 없음"}
          </p>
        </div>

        <span className="shrink-0 text-[24px] font-semibold tracking-[-0.04em] text-[#ff7a2f]">
          {progress}
          <span className="text-[13px]">%</span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#f3f3f3]">
        <div
          className="h-full rounded-full bg-[#ff7a2f] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {completedItems.map((item, index) => (
          <div
            key={item.label}
            className={[
              "flex h-11 items-center gap-2 rounded-[12px] border px-3 transition",
              item.done
                ? "border-[#ffd8bc] bg-[#fffaf6] text-[#111]"
                : "border-[#f0f0f0] bg-[#fafafa] text-[#aaa]",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                item.done
                  ? "bg-[#ff7a2f] text-white"
                  : "bg-white text-[#c9c9c9]",
              ].join(" ")}
            >
              {item.done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                index + 1
              )}
            </span>

            <span className="min-w-0 truncate text-[12px] font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="flex h-[176px] min-h-0 overflow-hidden rounded-[14px] border border-[#f0f0f0] bg-[#fafafa] px-4 py-3">
      {latestLog ? (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          <div
            className={[
              "mx-auto flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden transition",
              latestLog.stage === "done" ||
              latestLog.stage === "error"
                ? "opacity-55 grayscale"
                : "opacity-100",
            ].join(" ")}
          >
            <Lottie
              animationData={loadingAnimation}
              loop={
                latestLog.stage !== "done" &&
                latestLog.stage !== "error"
              }
              autoplay={
                latestLog.stage !== "done" &&
                latestLog.stage !== "error"
              }
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div
            key={`${latestLog.t}-${latestLog.stage}-${latestLog.message}`}
            className="mt-auto min-h-0 rounded-[12px] bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className={[
                  "truncate text-[12px] font-semibold",
                  latestLog.stage === "error"
                    ? "text-red-600"
                    : latestLog.stage === "done"
                      ? "text-emerald-600"
                      : "text-[#ff7a2f]",
                ].join(" ")}
              >
                {STAGE_LABELS[latestLog.stage] || latestLog.stage}
              </span>

              <span
                className={[
                  "shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold",
                  latestLog.stage === "error"
                    ? "bg-red-50 text-red-600"
                    : latestLog.stage === "done"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[#fff0e6] text-[#ff7a2f]",
                ].join(" ")}
              >
                {latestLogStatus}
              </span>
            </div>

            <p className="text-[12px] leading-5 text-[#666] break-keep">
              {latestLog.message ||
                `${STAGE_LABELS[latestLog.stage] || "작업"} ${latestLogStatus}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden text-[12px] text-[#aaa]">
          <div className="mb-2 h-[82px] w-[82px] shrink-0 overflow-hidden opacity-45 grayscale">
            <Lottie
              animationData={loadingAnimation}
              loop={false}
              autoplay={false}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          대기 중
        </div>
      )}
    </div>
  </div>
</Panel>

            <div className="grid min-h-0 gap-3 md:grid-cols-2">
              <Panel
                title="썸네일"
                className="flex h-[360px] min-h-0 flex-col sm:h-[420px] lg:h-[480px] xl:h-auto"
              >
                {activeThumbnail ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[14px] bg-[#fafafa]">
                      <img
                        key={activeThumbnail.url}
                        src={activeThumbnail.url}
                        alt="썸네일"
                        className="h-full max-h-full rounded-[12px] object-contain"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {thumbnailCandidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsThumbnailPickerOpen(true)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#fff0e6] px-3 text-[12px] font-medium text-[#ff7a2f]"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          후보 선택
                        </button>
                      )}

                      <a
                        href={activeThumbnail.url}
                        download={`${job?.artifacts?.menuName || jobId}.jpg`}
                        className={[
                          "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#ededed] px-3 text-[12px] font-medium text-[#111]",
                          thumbnailCandidates.length > 1 ? "" : "col-span-2",
                        ].join(" ")}
                      >
                        <Download className="h-3.5 w-3.5" />
                        저장
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#ededed] bg-[#fafafa] text-[12px] text-[#aaa]">
                    <ImageIcon className="mb-2 h-5 w-5" />
                    결과 없음
                  </div>
                )}
              </Panel>

              <Panel
                title="본문"
                className="flex h-[360px] min-h-0 flex-col sm:h-[420px] lg:h-[480px] xl:h-auto"
              >
                {job?.artifacts?.instagramCaption ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <pre className="studio-scroll min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words rounded-[14px] border border-[#f0f0f0] bg-[#fafafa] p-3 font-[inherit] text-[12px] leading-5 text-[#555]">
                      {job.artifacts.instagramCaption}
                    </pre>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            job.artifacts!.instagramCaption!,
                          );
                          setCaptionCopied(true);
                          setTimeout(() => setCaptionCopied(false), 1600);
                        } catch (copyError) {
                          console.error("clipboard error:", copyError);
                        }
                      }}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[#ededed] px-3 text-[12px] font-medium text-[#111]"
                    >
                      {captionCopied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Clipboard className="h-3.5 w-3.5" />
                      )}
                      {captionCopied ? "복사됨" : "복사"}
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#ededed] bg-[#fafafa] text-[12px] text-[#aaa]">
                    <Volume2 className="mb-2 h-5 w-5" />
                    결과 없음
                  </div>
                )}
              </Panel>
            </div>
          </div>

          <div className="flex min-h-0 justify-center xl:h-full xl:items-center">
            <Panel
              title="영상"
              className="flex h-[420px] min-h-0 w-full max-w-[440px] flex-col sm:h-[500px] lg:h-[560px] xl:h-[620px] xl:max-h-[calc(100vh-80px)] xl:max-w-none"
            >
              {finalUrl ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[14px] bg-black">
                    <video
                      key={finalUrl}
                      src={finalUrl}
                      controls
                      playsInline
                      className="h-full max-h-full max-w-full bg-black object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={finalUrl}
                      download={`${job?.artifacts?.menuName || jobId}.mp4`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#111] px-3 text-[12px] font-medium text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      저장
                    </a>

                    <a
                      href={finalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#ededed] px-3 text-[12px] font-medium text-[#111]"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      보기
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#ededed] bg-[#fafafa] text-[12px] text-[#aaa]">
                  <Film className="mb-2 h-5 w-5" />
                  결과 없음
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>

      {isThumbnailPickerOpen && thumbnailCandidates.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 py-6 backdrop-blur-sm">
          <div className="w-full max-w-[760px] rounded-[20px] bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-[var(--font-serif)] text-[20px] tracking-[-0.02em] text-[#111]">
                썸네일 선택
              </h2>

              <button
                type="button"
                onClick={() => setIsThumbnailPickerOpen(false)}
                className="h-9 rounded-full border border-[#ededed] px-4 text-[12px] font-medium text-[#555] transition hover:bg-[#fafafa]"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {thumbnailCandidates.map((candidate) => (
                <button
                  key={candidate.index}
                  type="button"
                  onClick={() => {
                    setSelectedThumbnailIndex(candidate.index);
                    setIsThumbnailPickerOpen(false);
                  }}
                  className={[
                    "group overflow-hidden rounded-[14px] border-2 bg-[#fafafa] p-1 transition hover:-translate-y-0.5",
                    candidate.index === activeThumbnailIndex
                      ? "border-[#ff7a2f]"
                      : "border-transparent hover:border-[#ffcfb0]",
                  ].join(" ")}
                >
                  <img
                    src={candidate.url}
                    alt=""
                    className="aspect-[9/16] w-full rounded-[10px] object-cover"
                  />
                  <span className="mt-2 block text-[11px] font-medium text-[#777]">
                    {candidate.index + 1}번
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
