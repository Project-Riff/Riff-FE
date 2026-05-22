"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type StoreInfo = {
  name: string;
  address: string;
  subtitle: string;
  strengths: string;
  hours: string;
  phone: string;
  instagram: string;
};

export type SubtitleItem = {
  start: number;
  end: number;
  text: string;
};

export type ResumeFrom =
  | "full"
  | "analysis"
  | "script"
  | "title"
  | "subtitle-only"
  | "subtitle"
  | "tts"
  | "body";

export type JobResponse = {
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

export const STAGE_LABELS: Record<string, string> = {
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

const STREAM_UPLOAD_THRESHOLD_BYTES = 1024 * 1024 * 1024;

export function getResumeGuide(resumeFrom: ResumeFrom) {
  switch (resumeFrom) {
    case "full":
      return {
        title: "처음부터 다시 만들기",
        desc: "컷 편집, 제목/부제, 자막, TTS, 최종 렌더까지 전부 새로 만듭니다.",
        required: ["원본 영상"],
        optional: ["매장 정보"],
      };
    case "analysis":
      return {
        title: "기존 분석 결과로 다시 만들기",
        desc: "이미 만들어진 분석 결과를 그대로 쓰고, 그 뒤 컷 편집/자막/TTS/렌더만 다시 진행합니다.",
        required: ["원본 영상", "analysis.json"],
        optional: ["매장 정보"],
      };
    case "script":
      return {
        title: "컷은 유지하고 문구만 다시 만들기",
        desc: "기존 컷 편집 결과와 body 영상은 그대로 두고, 제목/부제/대본/자막/TTS만 다시 만든 뒤 최종 렌더를 다시 진행합니다.",
        required: ["analysis.json", "body.mp4"],
        optional: ["매장 정보"],
      };
    case "title":
      return {
        title: "주소 기준 제목만 다시 적용하기",
        desc: "컷, 자막, TTS는 유지하고 현재 주소를 기준으로 상단 제목만 다시 계산해 렌더합니다.",
        required: ["analysis.json", "body.mp4", "tts.wav"],
        optional: ["매장 정보"],
      };
    case "subtitle-only":
      return {
        title: "부제만 다시 적용하기",
        desc: "컷, 자막, TTS는 유지하고 상단 부제만 새로 적용해 다시 렌더합니다.",
        required: ["analysis.json", "body.mp4", "tts.wav"],
        optional: ["매장 정보"],
      };
    case "subtitle":
      return {
        title: "기존 분석 + 자막 기준으로 다시 만들기",
        desc: "분석 결과와 자막은 유지하고, 그 뒤 영상 컷팅/TTS/렌더를 다시 진행합니다.",
        required: ["원본 영상", "analysis.json 또는 subtitles.srt"],
        optional: ["매장 정보"],
      };
    case "tts":
      return {
        title: "기존 자막 + TTS로 영상만 다시 만들기",
        desc: "자막과 TTS는 유지하고, 영상 컷 편집과 최종 렌더를 다시 진행합니다.",
        required: ["원본 영상 또는 body.mp4", "tts.wav", "subtitles.srt"],
        optional: ["analysis.json"],
      };
    case "body":
      return {
        title: "최종 합성만 다시 하기",
        desc: "body 영상, TTS, 자막이 모두 준비된 상태에서 디자인 오버레이와 최종 합성만 다시 진행합니다.",
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

export function useShortformPipeline() {
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
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
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

    if (file.size >= STREAM_UPLOAD_THRESHOLD_BYTES) {
      setUploadNotice(
        `대용량 영상(${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB)입니다. 업로드 후 자동으로 압축을 진행합니다. 이 과정은 다소 시간이 걸릴 수 있습니다.`,
      );
    } else {
      setUploadNotice("");
    }
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

    if (resumeFrom === "script") {
      if (!analysisFile) return "script 재개는 analysis.json이 필요합니다.";
      if (!bodyFile) return "script 재개는 body.mp4가 필요합니다.";
    }

    if (resumeFrom === "title") {
      if (!analysisFile) return "title 재개는 analysis.json이 필요합니다.";
      if (!bodyFile) return "title 재개는 body.mp4가 필요합니다.";
      if (!ttsFile) return "title 재개는 tts.wav가 필요합니다.";
      if (!storeInfo.address.trim()) return "title 재개는 주소 입력이 필요합니다.";
    }

    if (resumeFrom === "subtitle-only") {
      if (!analysisFile) return "subtitle-only 재개는 analysis.json이 필요합니다.";
      if (!bodyFile) return "subtitle-only 재개는 body.mp4가 필요합니다.";
      if (!ttsFile) return "subtitle-only 재개는 tts.wav가 필요합니다.";
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

      let uploadRes: Response;

      const shouldUseRawVideoUpload =
        resumeFrom === "full" &&
        !!pickedFile &&
        pickedFile.size >= STREAM_UPLOAD_THRESHOLD_BYTES &&
        !analysisFile &&
        !subtitleFile &&
        !ttsFile &&
        !bodyFile;

      if (shouldUseRawVideoUpload && pickedFile) {
        setUploadNotice(
          "대용량 영상을 업로드 중입니다. 서버에 저장한 뒤 자동 압축을 시작합니다. 완료까지 잠시만 기다려주세요.",
        );

        uploadRes = await fetch("/api/local-upload", {
          method: "POST",
          headers: {
            "Content-Type": pickedFile.type || "application/octet-stream",
            "x-raw-video-upload": "1",
            "x-source-name": encodeURIComponent(pickedFile.name),
            "x-resume-from": resumeFrom,
            "x-store-info": encodeURIComponent(JSON.stringify(storeInfo)),
            "x-file-size": String(pickedFile.size),
          },
          body: pickedFile,
        });
      } else {
        const formData = new FormData();

        if (pickedFile) formData.append("video", pickedFile);
        if (analysisFile) formData.append("analysis", analysisFile);
        if (subtitleFile) formData.append("subtitle", subtitleFile);
        if (ttsFile) formData.append("tts", ttsFile);
        if (bodyFile) formData.append("body", bodyFile);

        formData.append("resumeFrom", resumeFrom);
        formData.append("storeInfo", JSON.stringify(storeInfo));

        uploadRes = await fetch("/api/local-upload", {
          method: "POST",
          body: formData,
        });
      }

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "로컬 업로드 실패");
      }

      setJobId(uploadData.jobId);

      if (uploadData.compressed) {
        setUploadNotice(
          "대용량 원본을 감지해 서버에서 압축본을 생성했습니다. 현재 압축본 기준으로 분석을 이어갑니다.",
        );
      } else {
        setUploadNotice("");
      }

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

  return {
    fileRef,
    analysisRef,
    subtitleRef,
    ttsRef,
    bodyRef,
    dragOver,
    setDragOver,
    pickedFile,
    setPickedFile,
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
    setError,
    uploadNotice,
    isUploading,
    storeInfo,
    progress,
    guide,
    stageText,
    updateStoreField,
    pickFile,
    handleUpload,
    stopPolling,
  };
}
