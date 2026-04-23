import fs from "fs";
import { getJob, patchJob, pushJobLog } from "./job-store";
import { ensureJobDirs } from "./local-paths";
import {
  probeVideo,
  cutSegments,
  normalizeClipsTo30s,
  concatClips,
  extendVideoToDuration,
  muxVideoWithAudioAndSubtitles,
} from "./ffmpeg";
import { analyzeVideoWithGemini } from "./gemini";
import { makeTtsWav } from "./macos-tts";
import { writeSrtFile } from "./srt";
import { AnalysisResult, ResumeFrom } from "./types";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function shouldSkipAnalysis(resumeFrom?: ResumeFrom) {
  return (
    resumeFrom === "analysis" ||
    resumeFrom === "subtitle" ||
    resumeFrom === "tts" ||
    resumeFrom === "body"
  );
}

function shouldSkipSubtitle(resumeFrom?: ResumeFrom) {
  return (
    resumeFrom === "subtitle" ||
    resumeFrom === "tts" ||
    resumeFrom === "body"
  );
}

function shouldSkipTts(resumeFrom?: ResumeFrom) {
  return resumeFrom === "tts" || resumeFrom === "body";
}

function shouldSkipBody(resumeFrom?: ResumeFrom) {
  return resumeFrom === "body";
}

function buildTtsScript(analysis: AnalysisResult) {
  if (analysis.subtitles?.length) {
    return analysis.subtitles
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join(" ");
  }

  return analysis.narration || "이 장면이 가장 눈길을 끄는 핵심 포인트입니다.";
}

function getSubtitleEnd(analysis: AnalysisResult) {
  if (!analysis.subtitles?.length) return 0;
  return Math.max(...analysis.subtitles.map((item) => item.end));
}

function clearGeneratedArtifacts(paths: ReturnType<typeof ensureJobDirs>) {
  const filesToDelete = [
    paths.analysisPath,
    paths.subtitlePath,
    paths.ttsPath,
    paths.bodyPath,
    paths.bodyPath.replace(/\.mp4$/, "_padded.mp4"),
    paths.finalPath,
  ];

  for (const filePath of filesToDelete) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  if (fs.existsSync(paths.clipsDir)) {
    for (const fileName of fs.readdirSync(paths.clipsDir)) {
      const clipPath = `${paths.clipsDir}/${fileName}`;
      if (fs.existsSync(clipPath)) {
        fs.unlinkSync(clipPath);
      }
    }
  }
}

export async function runRealPipeline(jobId: string) {
  try {
    console.log(`[Pipeline] start job=${jobId}`);

    const job = await getJob(jobId);
    console.log(`[Pipeline] getJob done job=${jobId}`);

    if (!job) throw new Error("job not found");
    if (!job.sourcePath && job.resumeFrom !== "body") {
      throw new Error("sourcePath가 없습니다.");
    }

    const paths = ensureJobDirs(jobId);
    console.log(`[Pipeline] ensureJobDirs done`, paths);

    const resumeFrom = job.resumeFrom ?? "full";
    const subtitlePath = job.artifacts?.subtitlePath ?? paths.subtitlePath;

    if (resumeFrom === "full") {
      clearGeneratedArtifacts(paths);
      console.log("[Pipeline] full mode artifact reset done");
    }

    if (resumeFrom !== "body") {
      await patchJob(jobId, {
        stage: "probing",
        progress: 10,
        message: "영상 정보 확인",
        error: undefined,
      });

      await pushJobLog(jobId, "probing", 10, "영상 정보 확인");
    }

    const meta =
      resumeFrom !== "body" && job.sourcePath
        ? await probeVideo(job.sourcePath)
        : undefined;

    if (meta) {
      await patchJob(jobId, {
        stage: "probing",
        progress: 15,
        message: `길이 ${meta.duration.toFixed(1)}초 확인`,
        error: undefined,
      });

      await pushJobLog(
        jobId,
        "probing",
        15,
        `길이 ${meta.duration.toFixed(1)}초 확인`,
      );
    }

    let analysis: AnalysisResult;

    const existingAnalysisPath =
      job.artifacts?.analysisPath && fs.existsSync(job.artifacts.analysisPath)
        ? job.artifacts.analysisPath
        : fs.existsSync(paths.analysisPath)
          ? paths.analysisPath
          : undefined;

    if (shouldSkipAnalysis(resumeFrom)) {
      if (!existingAnalysisPath) {
        throw new Error(
          `resumeFrom=${resumeFrom} 이지만 analysis.json이 없습니다.`,
        );
      }

      await patchJob(jobId, {
        stage: "analyzing",
        progress: 20,
        message: "기존 분석 결과 불러오는 중",
        error: undefined,
      });

      await pushJobLog(jobId, "analyzing", 20, "기존 분석 결과 불러오는 중");

      analysis = readJsonFile<AnalysisResult>(existingAnalysisPath);
    } else {
      if (!job.sourcePath || !meta) {
        throw new Error("Gemini 분석을 위해 sourcePath가 필요합니다.");
      }

      await patchJob(jobId, {
        stage: "analyzing",
        progress: 20,
        message: "Gemini 전체 영상 업로드 시작",
        error: undefined,
      });

      await pushJobLog(jobId, "analyzing", 20, "Gemini 전체 영상 업로드 시작");

      analysis = await analyzeVideoWithGemini(job.sourcePath, meta.duration);

      fs.writeFileSync(
        paths.analysisPath,
        JSON.stringify(analysis, null, 2),
        "utf-8",
      );
      console.log(`[Pipeline] write analysis file done path=${paths.analysisPath}`);
    }

    if (!shouldSkipSubtitle(resumeFrom)) {
      writeSrtFile(analysis.subtitles, subtitlePath);
      console.log(`[Pipeline] writeSrtFile done path=${subtitlePath}`);
    } else {
      console.log(
        `[Pipeline] subtitle step skipped or reused path=${subtitlePath}`,
      );
    }

    await patchJob(jobId, {
      stage: "analyzing",
      progress: 55,
      message: "분석 결과 준비 완료",
      analysis,
      artifacts: {
        ...job.artifacts,
        analysisPath: paths.analysisPath,
        subtitlePath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "analyzing", 55, "분석 결과 준비 완료");

    let clipPaths =
      job.artifacts?.clipPaths && job.artifacts.clipPaths.length > 0
        ? job.artifacts.clipPaths.filter((clipPath) => fs.existsSync(clipPath))
        : [];

    if (resumeFrom !== "body") {
      await patchJob(jobId, {
        stage: "cutting",
        progress: 68,
        message: "핵심 구간 컷팅 중",
        analysis,
        artifacts: {
          ...job.artifacts,
          analysisPath: paths.analysisPath,
          subtitlePath,
        },
        error: undefined,
      });

      await pushJobLog(jobId, "cutting", 68, "핵심 구간 컷팅 중");

      if (!job.sourcePath) {
        throw new Error("clip 생성에는 sourcePath가 필요합니다.");
      }

      // full 모드에서는 무조건 새 clip 생성
      if (resumeFrom === "full" || clipPaths.length === 0) {
        const rawClipPaths = await cutSegments(
          job.sourcePath,
          analysis.segments,
          paths.clipsDir,
        );
        console.log(`[Pipeline] cutSegments done`, rawClipPaths);

        clipPaths = await normalizeClipsTo30s(rawClipPaths, paths.clipsDir);
        console.log(`[Pipeline] normalizeClipsTo30s done`, clipPaths);
      }
    }

    await patchJob(jobId, {
      stage: "tts",
      progress: 80,
      message: "TTS 생성 중",
      analysis,
      artifacts: {
        ...job.artifacts,
        analysisPath: paths.analysisPath,
        clipPaths,
        subtitlePath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "tts", 80, "TTS 생성 중");

    const ttsScript = buildTtsScript(analysis);

    if (!shouldSkipTts(resumeFrom) || !fs.existsSync(paths.ttsPath)) {
      await makeTtsWav(ttsScript, paths.ttsPath);
      console.log(`[Pipeline] makeTtsWav done path=${paths.ttsPath}`);
    } else {
      console.log(`[Pipeline] tts step skipped or reused path=${paths.ttsPath}`);
    }

    await patchJob(jobId, {
      stage: "rendering",
      progress: 90,
      message: "클립 합치기",
      analysis,
      artifacts: {
        ...job.artifacts,
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "rendering", 90, "클립 합치기");

    if (!shouldSkipBody(resumeFrom) || !fs.existsSync(paths.bodyPath)) {
      await concatClips(clipPaths, paths.bodyPath);
      console.log(`[Pipeline] concatClips done path=${paths.bodyPath}`);
    } else {
      console.log(`[Pipeline] body step skipped or reused path=${paths.bodyPath}`);
    }

    const subtitleEnd = getSubtitleEnd(analysis);
    const ttsMeta = await probeVideo(paths.ttsPath);
    const bodyMeta = await probeVideo(paths.bodyPath);

    const targetDuration = Math.max(30, subtitleEnd, ttsMeta.duration, bodyMeta.duration);
    const paddedBodyPath = paths.bodyPath.replace(/\.mp4$/, "_padded.mp4");

    if (bodyMeta.duration < targetDuration - 0.05) {
      await extendVideoToDuration(paths.bodyPath, paddedBodyPath, targetDuration);
      console.log(
        `[Pipeline] body extended ${bodyMeta.duration.toFixed(2)}s -> ${targetDuration.toFixed(2)}s`,
      );
    } else {
      if (paths.bodyPath !== paddedBodyPath) {
        fs.copyFileSync(paths.bodyPath, paddedBodyPath);
      }
    }

    await patchJob(jobId, {
      stage: "rendering",
      progress: 95,
      message: "음성 및 자막 합성",
      analysis,
      artifacts: {
        ...job.artifacts,
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
        bodyPath: paddedBodyPath,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "rendering", 95, "음성 및 자막 합성");

    await muxVideoWithAudioAndSubtitles(
      paddedBodyPath,
      paths.ttsPath,
      subtitlePath,
      paths.finalPath,
    );
    console.log(
      `[Pipeline] muxVideoWithAudioAndSubtitles done path=${paths.finalPath}`,
    );

    await patchJob(jobId, {
      stage: "done",
      progress: 100,
      message: "완료",
      analysis,
      artifacts: {
        ...job.artifacts,
        analysisPath: paths.analysisPath,
        clipPaths,
        ttsPath: paths.ttsPath,
        subtitlePath,
        bodyPath: paddedBodyPath,
        finalPath: paths.finalPath,
        finalUrl: paths.finalUrl,
      },
      error: undefined,
    });

    await pushJobLog(jobId, "done", 100, "완료");
  } catch (error) {
    const message = errorMessage(error);

    console.error(`[Pipeline] job ${jobId} 실패:`, error);

    try {
      await patchJob(jobId, {
        stage: "error",
        progress: 100,
        message: `실패: ${message}`,
        error: message,
      });

      await pushJobLog(jobId, "error", 100, `실패: ${message}`);
    } catch (patchError) {
      console.error("[Pipeline] 실패 상태 기록 중 추가 오류:", patchError);
    }

    throw error;
  }
}