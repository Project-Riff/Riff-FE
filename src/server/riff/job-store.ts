import fs from "fs";
import { Job, Stage } from "./types";
import { now } from "./utils";
import { ensureJobDirs } from "./local-paths";

const jobs = new Map<string, Job>();

function normalizeJob(job: Job): Job {
  return {
    ...job,
    logs: Array.isArray(job.logs) ? job.logs : [],
    artifacts: job.artifacts ?? {},
  };
}

export function listJobs() {
  const all: Job[] = [];

  for (const job of jobs.values()) {
    all.push(normalizeJob(job));
  }

  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getJob(id: string) {
  try {
    const { statusPath } = ensureJobDirs(id);

    // 디스크 값 우선
    if (fs.existsSync(statusPath)) {
      const raw = fs.readFileSync(statusPath, "utf-8");
      const job = JSON.parse(raw) as Job;
      const normalized = normalizeJob(job);

      jobs.set(id, normalized);
      return normalized;
    }

    const cached = jobs.get(id);
    if (cached) return normalizeJob(cached);

    return undefined;
  } catch (error) {
    console.error("getJob error:", error);

    const cached = jobs.get(id);
    return cached ? normalizeJob(cached) : undefined;
  }
}

export async function saveJob(job: Job) {
  const normalized = normalizeJob(job);

  jobs.set(normalized.id, normalized);
  await persistJob(normalized);
  return normalized;
}

export async function patchJob(id: string, patch: Partial<Job>) {
  const prev = await getJob(id);
  if (!prev) return undefined;

  const next: Job = normalizeJob({
    ...prev,
    ...patch,
    updatedAt: now(),
    artifacts: {
      ...(prev.artifacts ?? {}),
      ...(patch.artifacts ?? {}),
    },
    analysis: patch.analysis ?? prev.analysis,
    logs: patch.logs ?? prev.logs ?? [],
    storeInfo: patch.storeInfo ?? prev.storeInfo,
    resumeFrom: patch.resumeFrom ?? prev.resumeFrom,
  });

  jobs.set(id, next);
  await persistJob(next);
  return next;
}

export async function pushJobLog(
  id: string,
  stage: Stage,
  progress: number,
  message?: string,
) {
  const job = await getJob(id);
  if (!job) return undefined;

  const currentLogs = Array.isArray(job.logs) ? job.logs : [];

  const nextLogs = [
    ...currentLogs,
    {
      t: now() - job.createdAt,
      stage,
      progress,
      message,
    },
  ];

  const next: Job = normalizeJob({
    ...job,
    stage,
    progress,
    message,
    updatedAt: now(),
    logs: nextLogs,
  });

  jobs.set(id, next);
  await persistJob(next);
  return next;
}

async function persistJob(job: Job) {
  const { statusPath } = ensureJobDirs(job.id);
  const normalized = normalizeJob(job);

  fs.writeFileSync(statusPath, JSON.stringify(normalized, null, 2), "utf-8");
}