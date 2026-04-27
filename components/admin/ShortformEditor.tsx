"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StoreInfo = {
  name: string;
  address: string;
  subtitle: string;
  strengths: string;
  hours: string;
  phone: string;
  instagram: string;
};

type SubtitleItem = {
  start: number;
  end: number;
  text: string;
};

type ResumeFrom = "full" | "analysis" | "subtitle" | "tts" | "body";

type JobResponse = {
  id: string;
  stage: string;
  progress: number;
  message?: string;
  error?: string;
  analysis?: {
    title?: string;
    mood?: string;
    narration?: string;
    bgmTags?: string[];
    segments?: Array<{ start: number; end: number; label?: string }>;
    subtitles?: SubtitleItem[];
  };
  artifacts?: {
    sourceUrl?: string;
    analysisUrl?: string;
    finalUrl?: string;
    subtitleUrl?: string;
    analysisPath?: string;
    subtitlePath?: string;
    ttsPath?: string;
    bodyPath?: string;
  };
  logs?: Array<{
    t: number;
    stage: string;
    progress: number;
    message?: string;
  }>;
};

const STAGE_LABELS: Record<string, string> = {
  queued: "대기열",
  uploading: "업로드 중",
  uploaded: "업로드 완료",
  downloading: "YouTube 다운로드",
  probing: "영상 정보 확인",
  compressing: "압축",
  analyzing: "Gemini 분석",
  cutting: "클립 분리",
  tts: "TTS 생성",
  bgm: "BGM 매칭",
  rendering: "최종 렌더링",
  done: "완료",
  error: "오류",
};

function formatSec(sec: number) {
  return `${sec.toFixed(1)}s`;
}

function fileNameOrEmpty(file: File | null) {
  return file ? file.name : "";
}

function SectionCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.05)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        {desc ? (
          <p className="mt-1 text-xs leading-5 text-neutral-500">{desc}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-[#f8f6f2] px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#ff6a1a]/40 focus:bg-white"
      />
    </label>
  );
}

function FilePickCard({
  title,
  file,
  onClick,
  required = false,
}: {
  title: string;
  file: File | null;
  onClick: () => void;
  required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[#faf8f4] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-neutral-900">{title}</div>
        {required ? (
          <span className="rounded-full border border-[#ff6a1a]/20 bg-[#ff6a1a]/8 px-2 py-0.5 text-[10px] font-semibold text-[#d95d16]">
            필수
          </span>
        ) : (
          <span className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[10px] text-neutral-500">
            선택
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-left text-xs text-neutral-700 transition hover:bg-neutral-50"
      >
        {fileNameOrEmpty(file) || `${title} 선택`}
      </button>
    </div>
  );
}

function getResumeGuide(resumeFrom: ResumeFrom) {
  switch (resumeFrom) {
    case "full":
      return {
        title: "전체 실행",
        desc: "처음부터 전부 수행합니다.",
        required: ["원본 영상"],
        optional: ["매장 정보"],
      };
    case "analysis":
      return {
        title: "analysis.json부터 재개",
        desc: "Gemini 분석은 건너뛰고 분석 결과를 바로 사용합니다.",
        required: ["원본 영상", "analysis.json"],
        optional: ["매장 정보"],
      };
    case "subtitle":
      return {
        title: "subtitles.srt부터 재개",
        desc: "분석과 자막 생성 단계를 건너뜁니다.",
        required: ["원본 영상", "analysis.json 또는 subtitles.srt"],
        optional: ["매장 정보"],
      };
    case "tts":
      return {
        title: "tts.wav부터 재개",
        desc: "분석, 자막, TTS 생성 단계를 건너뜁니다.",
        required: ["원본 영상 또는 body.mp4", "tts.wav", "subtitles.srt"],
        optional: ["analysis.json"],
      };
    case "body":
      return {
        title: "body.mp4부터 재개",
        desc: "마지막 음성/자막 합성 단계만 진행합니다.",
        required: ["body.mp4", "tts.wav", "subtitles.srt"],
        optional: [],
      };
    default:
      return {
        title: "",
        desc: "",
        required: [],
        optional: [],
      };
  }
}

export default function ShortformEditor() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const analysisRef = useRef<HTMLInputElement | null>(null);
  const subtitleRef = useRef<HTMLInputElement | null>(null);
  const ttsRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLInputElement | null>(null);

  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingStoppedRef = useRef(false);

  const [dragOver, setDragOver] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [ttsFile, setTtsFile] = useState<File | null>(null);
  const [bodyFile, setBodyFile] = useState<File | null>(null);

  const [resumeFrom, setResumeFrom] = useState<ResumeFrom>("full");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: "",
    address: "",
    subtitle: "",
    strengths: "",
    hours: "",
    phone: "",
    instagram: "",
  });

  const progress = job?.progress ?? 0;
  const guide = useMemo(() => getResumeGuide(resumeFrom), [resumeFrom]);

  const stageText = useMemo(() => {
    if (!job) return "대기 중";
    const label = STAGE_LABELS[job.stage] || job.stage;
    return job.message ? `${label} · ${job.message}` : label;
  }, [job]);

  const updateStoreField = (key: keyof StoreInfo, value: string) => {
    setStoreInfo((prev) => ({ ...prev, [key]: value }));
  };

  const pickFile = (file?: File | null) => {
    if (!file) return;
    setPickedFile(file);
    setError("");
  };

  const stopPolling = () => {
    pollingStoppedRef.current = true;

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollingStoppedRef.current = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}?ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!res.ok) {
          throw new Error(`job 조회 실패: ${res.status}`);
        }

        const data: JobResponse = await res.json();

        if (pollingStoppedRef.current) return;

        setJob(data);

        if (data.stage === "done" || data.stage === "error") {
          stopPolling();
          return;
        }

        pollingTimeoutRef.current = setTimeout(poll, 1500);
      } catch (e) {
        console.error("pollJob error:", e);

        if (pollingStoppedRef.current) return;

        pollingTimeoutRef.current = setTimeout(poll, 2000);
      }
    };

    void poll();
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const validateBeforeUpload = () => {
    if (resumeFrom === "full" && !pickedFile) {
      return "전체 실행은 원본 영상 파일이 필요합니다.";
    }

    if (resumeFrom === "analysis") {
      if (!pickedFile) return "analysis 재개는 원본 영상이 필요합니다.";
      if (!analysisFile) return "analysis 재개는 analysis.json이 필요합니다.";
    }

    if (resumeFrom === "subtitle") {
      if (!pickedFile) return "subtitle 재개는 원본 영상이 필요합니다.";
      if (!analysisFile && !subtitleFile) {
        return "subtitle 재개는 analysis.json 또는 subtitles.srt 중 하나가 필요합니다.";
      }
    }

    if (resumeFrom === "tts") {
      if (!pickedFile && !bodyFile) {
        return "tts 재개는 원본 영상 또는 body.mp4가 필요합니다.";
      }
      if (!ttsFile) return "tts 재개는 tts.wav가 필요합니다.";
      if (!subtitleFile) return "tts 재개는 subtitles.srt가 필요합니다.";
    }

    if (resumeFrom === "body") {
      if (!bodyFile) return "body 재개는 body.mp4가 필요합니다.";
      if (!ttsFile) return "body 재개는 tts.wav가 필요합니다.";
      if (!subtitleFile) return "body 재개는 subtitles.srt가 필요합니다.";
    }

    return "";
  };

  const handleUpload = async () => {
    const validationMessage = validateBeforeUpload();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setError("");
      setIsUploading(true);
      setJob(null);
      setJobId("");
      stopPolling();

      const formData = new FormData();

      if (pickedFile) formData.append("video", pickedFile);
      if (analysisFile) formData.append("analysis", analysisFile);
      if (subtitleFile) formData.append("subtitle", subtitleFile);
      if (ttsFile) formData.append("tts", ttsFile);
      if (bodyFile) formData.append("body", bodyFile);

      formData.append("resumeFrom", resumeFrom);
      formData.append("storeInfo", JSON.stringify(storeInfo));

      const uploadRes = await fetch("/api/local-upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "로컬 업로드 실패");
      }

      setJobId(uploadData.jobId);

      const startRes = await fetch(`/api/jobs/${uploadData.jobId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeFrom,
        }),
      });

      const startData = await startRes.json().catch(() => ({}));

      if (!startRes.ok) {
        throw new Error(startData.error || "파이프라인 시작 실패");
      }

      startPolling(uploadData.jobId);
    } catch (e) {
      console.error("handleUpload error:", e);
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setIsUploading(false);
    }
  };

  const handleYoutube = async () => {
    setError("YouTube 다운로드 버전은 다음 단계에서 yt-dlp로 붙입니다.");
  };

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ff6a1a]">
                Riff Admin
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-neutral-900 md:text-4xl">
                숏폼 제작 파이프라인
              </h1>
              <p className="mt-2 max-w-[620px] text-sm leading-6 text-neutral-500">
                필요한 중간 산출물을 모두 넣으면 해당 단계부터 바로 이어서 렌더링합니다.
              </p>
            </div>

            <div className="rounded-2xl border border-black/8 bg-[#faf8f4] px-4 py-3 text-sm text-neutral-600">
              <div className="font-medium text-neutral-900">현재 모드</div>
              <div className="mt-1 text-[#ff6a1a]">{guide.title}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-5">
            <SectionCard
              title="시작 모드"
              desc="어디서부터 이어서 시작할지 선택하세요."
            >
              <div className="grid gap-3">
                <select
                  value={resumeFrom}
                  onChange={(e) => setResumeFrom(e.target.value as ResumeFrom)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f8f6f2] px-3 py-3 text-sm text-neutral-900 outline-none transition focus:border-[#ff6a1a]/40"
                >
                  <option value="full">전체 실행</option>
                  <option value="analysis">analysis.json부터 재개</option>
                  <option value="subtitle">subtitles.srt부터 재개</option>
                  <option value="tts">tts.wav부터 재개</option>
                  <option value="body">body.mp4부터 재개</option>
                </select>

                <div className="rounded-2xl border border-[#ff6a1a]/15 bg-[#fff8f3] p-4">
                  <div className="text-xs font-semibold text-[#d95d16]">
                    {guide.title}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {guide.desc}
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-1 text-[11px] font-semibold text-neutral-800">
                        필수 파일
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {guide.required.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[#ff6a1a]/20 bg-[#ff6a1a]/8 px-2 py-0.5 text-[10px] text-[#d95d16]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-[11px] font-semibold text-neutral-800">
                        선택 항목
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {guide.optional.length > 0 ? (
                          guide.optional.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[10px] text-neutral-600"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-neutral-400">없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="파일 업로드"
              desc="선택한 시작 모드에 맞는 파일을 모두 넣어주세요."
            >
              <div className="grid gap-3">
                <div
                  className={`cursor-pointer rounded-[24px] border border-dashed px-4 py-8 text-center transition ${
                    dragOver
                      ? "border-[#ff6a1a] bg-[#fff8f3]"
                      : "border-black/12 bg-[#faf8f4] hover:border-[#ff6a1a]/60 hover:bg-[#fffaf6]"
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />

                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6a1a] text-sm font-black text-white shadow-[0_10px_25px_rgba(255,106,26,0.22)]">
                    V
                  </div>

                  <strong className="block text-sm font-semibold text-neutral-900">
                    {pickedFile ? pickedFile.name : "원본 영상 선택"}
                  </strong>
                  <p className="mt-1 text-xs text-neutral-500">MP4 / MOV / WEBM</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
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

                  <FilePickCard
                    title="analysis.json"
                    file={analysisFile}
                    onClick={() => analysisRef.current?.click()}
                    required={resumeFrom === "analysis" || resumeFrom === "subtitle"}
                  />
                  <FilePickCard
                    title="subtitles.srt"
                    file={subtitleFile}
                    onClick={() => subtitleRef.current?.click()}
                    required={
                      resumeFrom === "subtitle" ||
                      resumeFrom === "tts" ||
                      resumeFrom === "body"
                    }
                  />
                  <FilePickCard
                    title="tts.wav"
                    file={ttsFile}
                    onClick={() => ttsRef.current?.click()}
                    required={resumeFrom === "tts" || resumeFrom === "body"}
                  />
                  <FilePickCard
                    title="body.mp4"
                    file={bodyFile}
                    onClick={() => bodyRef.current?.click()}
                    required={resumeFrom === "body"}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="매장 정보"
              desc="필수는 아니지만 대사/문구 보정용으로 쓸 수 있습니다."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="매장 이름"
                  value={storeInfo.name}
                  onChange={(value) => updateStoreField("name", value)}
                  placeholder="예: 하류식당"
                />
                <Field
                  label="인스타그램"
                  value={storeInfo.instagram}
                  onChange={(value) => updateStoreField("instagram", value)}
                  placeholder="예: @haru_kitchen"
                />
                <Field
                  label="주소"
                  value={storeInfo.address}
                  onChange={(value) => updateStoreField("address", value)}
                  placeholder="예: 수원시 ..."
                />
                <Field
                  label="전화번호"
                  value={storeInfo.phone}
                  onChange={(value) => updateStoreField("phone", value)}
                  placeholder="예: 010-1234-5678"
                />
                <Field
                  label="부제"
                  value={storeInfo.subtitle}
                  onChange={(value) => updateStoreField("subtitle", value)}
                  placeholder="예: 강남역 5분 거리, 유럽이 펼쳐진다"
                />
                <Field
                  label="가게 특장점"
                  value={storeInfo.strengths}
                  onChange={(value) => updateStoreField("strengths", value)}
                  placeholder="예: 로봇 바리스타, 넓은 좌석, 야간 방문"
                />
                <div className="md:col-span-2">
                  <Field
                    label="영업시간"
                    value={storeInfo.hours}
                    onChange={(value) => updateStoreField("hours", value)}
                    placeholder="예: 11:00 - 22:00"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="YouTube 링크" desc="현재는 준비 단계입니다.">
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="YouTube URL 붙여넣기"
                  className="flex-1 rounded-2xl border border-black/10 bg-[#f8f6f2] px-3 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#ff6a1a]/40"
                />
                <button
                  type="button"
                  onClick={handleYoutube}
                  disabled={isUploading || !youtubeUrl.trim()}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-40"
                >
                  YouTube 작업
                </button>
              </div>
            </SectionCard>

            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full rounded-full bg-neutral-900 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:opacity-90 disabled:opacity-40"
            >
              {isUploading ? "처리 중..." : "작업 시작"}
            </button>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <SectionCard
              title="작업 상태"
              desc="현재 단계와 진행률을 확인합니다."
            >
              <div className="rounded-2xl border border-black/8 bg-[#faf8f4] p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                  <span>{stageText}</span>
                  <span className="font-semibold text-neutral-900">{progress}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/6">
                  <div
                    className="h-full rounded-full bg-[#ff6a1a] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 grid gap-2 text-xs text-neutral-600">
                  <div className="rounded-xl bg-white px-3 py-2">
                    <span className="text-neutral-400">Job ID</span>
                    <div className="mt-1 break-all font-mono text-[11px] text-neutral-800">
                      {jobId || "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {job?.logs?.length ? (
                  job.logs.map((log, idx) => (
                    <div
                      key={`${log.t}-${idx}`}
                      className="rounded-2xl border border-black/8 bg-[#faf8f4] px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-neutral-400">
                        <span>{(log.t / 1000).toFixed(1)}s</span>
                        <span>{log.progress}%</span>
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-neutral-900">
                        {STAGE_LABELS[log.stage] || log.stage}
                      </div>
                      {log.message ? (
                        <div className="mt-0.5 text-xs leading-5 text-neutral-600">
                          {log.message}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-black/8 bg-[#faf8f4] px-4 py-6 text-center text-xs text-neutral-400">
                    아직 로그가 없습니다.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="분석 결과"
              desc="분석, 구간, 자막을 확인합니다."
            >
              {job?.analysis ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-black/8 bg-[#faf8f4] p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-[#ff6a1a]/20 bg-[#ff6a1a]/8 px-2 py-0.5 text-[10px] font-semibold text-[#d95d16]">
                        {job.analysis.mood || "mood 없음"}
                      </span>

                      {(job.analysis.bgmTags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[10px] text-neutral-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="mt-3 text-sm font-semibold text-neutral-900">
                      {job.analysis.title || "-"}
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-neutral-600">
                      {job.analysis.narration || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/8 bg-[#faf8f4] p-4">
                    <p className="mb-2 text-xs font-semibold text-neutral-900">
                      선택된 구간
                    </p>

                    {job.analysis.segments?.length ? (
                      <div className="space-y-2">
                        {job.analysis.segments.map((segment, idx) => (
                          <div
                            key={`${segment.start}-${segment.end}-${idx}`}
                            className="rounded-xl border border-black/8 bg-white px-3 py-2.5"
                          >
                            <div className="text-[11px] text-neutral-400">
                              {formatSec(segment.start)} - {formatSec(segment.end)}
                            </div>
                            <div className="mt-0.5 text-xs text-neutral-800">
                              {segment.label || "핵심 장면"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs text-neutral-400">
                        구간 정보가 없습니다.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/8 bg-[#faf8f4] p-4">
                    <p className="mb-2 text-xs font-semibold text-neutral-900">
                      자막 미리보기
                    </p>

                    {job.analysis.subtitles?.length ? (
                      <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                        {job.analysis.subtitles.map((sub, idx) => (
                          <div
                            key={`${sub.start}-${sub.end}-${idx}`}
                            className="rounded-xl border border-black/8 bg-white px-3 py-2.5"
                          >
                            <div className="text-[11px] text-neutral-400">
                              {formatSec(sub.start)} - {formatSec(sub.end)}
                            </div>
                            <div className="mt-0.5 text-xs leading-5 text-neutral-800">
                              {sub.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs text-neutral-400">
                        자막 정보가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-black/8 bg-[#faf8f4] px-4 py-8 text-center text-xs text-neutral-400">
                  아직 분석 결과가 없습니다.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="최종 결과"
              desc="렌더링 완료 시 최종 mp4를 확인합니다."
            >
              {job?.artifacts?.finalUrl ? (
                <video
                  src={job.artifacts.finalUrl}
                  controls
                  className="w-full rounded-[24px] border border-black/8 bg-black"
                />
              ) : (
                <div className="rounded-2xl border border-black/8 bg-[#faf8f4] px-4 py-10 text-center text-xs text-neutral-400">
                  아직 최종 결과물이 없습니다.
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
