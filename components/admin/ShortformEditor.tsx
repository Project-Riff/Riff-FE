"use client";

import { ReactNode } from "react";
import {
  ResumeFrom,
  STAGE_LABELS,
  useShortformPipeline,
} from "@/components/admin/useShortformPipeline";

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
  children: ReactNode;
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

export default function ShortformEditor() {
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
                  <option value="full">처음부터 다시 만들기</option>
                  <option value="analysis">기존 분석 결과로 다시 만들기</option>
                  <option value="script">컷은 유지하고 문구만 다시 만들기</option>
                  <option value="title">주소 기준 제목만 다시 적용하기</option>
                  <option value="subtitle-only">부제만 다시 적용하기</option>
                  <option value="subtitle">기존 분석 + 자막 기준으로 다시 만들기</option>
                  <option value="tts">기존 자막 + TTS로 영상만 다시 만들기</option>
                  <option value="body">최종 합성만 다시 하기</option>
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

                {uploadNotice ? (
                  <div className="rounded-2xl border border-[#ff6a1a]/15 bg-[#fff8f3] px-4 py-3 text-xs leading-5 text-[#b5541c]">
                    {uploadNotice}
                  </div>
                ) : null}

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
                    required={
                      resumeFrom === "analysis" ||
                      resumeFrom === "script" ||
                      resumeFrom === "title" ||
                      resumeFrom === "subtitle-only" ||
                      resumeFrom === "subtitle"
                    }
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
                    required={
                      resumeFrom === "tts" ||
                      resumeFrom === "body" ||
                      resumeFrom === "title" ||
                      resumeFrom === "subtitle-only"
                    }
                  />
                  <FilePickCard
                    title="body.mp4"
                    file={bodyFile}
                    onClick={() => bodyRef.current?.click()}
                    required={
                      resumeFrom === "script" ||
                      resumeFrom === "body" ||
                      resumeFrom === "title" ||
                      resumeFrom === "subtitle-only"
                    }
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

              <div className="apple-scroll max-h-[260px] space-y-2 overflow-y-auto pr-2">
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
                      <div className="apple-scroll max-h-[220px] space-y-2 overflow-y-auto pr-2">
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
