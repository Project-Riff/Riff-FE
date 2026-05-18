import fs from "fs";
import path from "path";
import { Job, JobLog, Stage } from "./types";
import { now } from "./utils";
import { ensureJobDirs } from "./local-paths";

const jobs = new Map<string, Job>();

function normalizeJob(job: Job): Job {
  return {
    ...job,
    logs: Array.isArray(job.logs) ? job.logs : [],
    artifacts: job.artifacts ?? {},
    progress: Number.isFinite(job.progress) ? job.progress : 0,
    updatedAt: job.updatedAt ?? now(),
  };
}

function stripLogs(job: Job): Job {
  const { logs, ...rest } = job;
  return rest;
}

function readJobLogs(logsPath: string, fallbackLogs?: JobLog[]) {
  if (!fs.existsSync(logsPath)) {
    return Array.isArray(fallbackLogs) ? fallbackLogs : [];
  }

  const raw = fs.readFileSync(logsPath, "utf-8").trim();

  if (!raw) {
    return [];
  }

  const logs: JobLog[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    try {
      logs.push(JSON.parse(trimmed) as JobLog);
    } catch (error) {
      console.error("[job-store] readJobLogs parse error:", error);
    }
  }

  return logs;
}

function appendJobLog(logsPath: string, log: JobLog) {
  fs.mkdirSync(path.dirname(logsPath), { recursive: true });
  fs.appendFileSync(logsPath, `${JSON.stringify(log)}\n`, "utf-8");
}

function writeJobLogs(logsPath: string, logs: JobLog[]) {
  fs.mkdirSync(path.dirname(logsPath), { recursive: true });
  const content = logs.map((log) => JSON.stringify(log)).join("\n");
  fs.writeFileSync(logsPath, content ? `${content}\n` : "", "utf-8");
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
    const { statusPath, logsPath } = ensureJobDirs(id);

    if (fs.existsSync(statusPath)) {
      const raw = fs.readFileSync(statusPath, "utf-8");
      const parsed = JSON.parse(raw) as Job;
      const normalized = normalizeJob({
        ...parsed,
        logs: readJobLogs(logsPath, parsed.logs),
      });

      jobs.set(id, normalized);
      return normalized;
    }

    const cached = jobs.get(id);
    return cached ? normalizeJob(cached) : undefined;
  } catch (error) {
    console.error("[job-store] getJob error:", error);

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

  if (!prev) {
    return undefined;
  }

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

    message:
      Object.prototype.hasOwnProperty.call(patch, "message")
        ? patch.message
        : prev.message,

    error:
      Object.prototype.hasOwnProperty.call(patch, "error")
        ? patch.error
        : prev.error,
  });

  if (patch.logs) {
    const { logsPath } = ensureJobDirs(id);
    writeJobLogs(logsPath, next.logs ?? []);
  }

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

  if (!job) {
    return undefined;
  }

  const currentLogs = Array.isArray(job.logs) ? job.logs : [];
  const safeProgress = Math.max(0, Math.min(100, progress));
  const logEntry: JobLog = {
    t: now() - job.createdAt,
    stage,
    progress: safeProgress,
    message,
  };

  const nextLogs = [
    ...currentLogs,
    logEntry,
  ];

  const next: Job = normalizeJob({
    ...job,
    stage,
    progress: safeProgress,
    message,
    updatedAt: now(),
    logs: nextLogs,
  });

  const { logsPath } = ensureJobDirs(id);
  appendJobLog(logsPath, logEntry);

  jobs.set(id, next);
  await persistJob(next);

  return next;
}

async function persistJob(job: Job) {
  const { statusPath } = ensureJobDirs(job.id);
  const normalized = normalizeJob(job);
  const statusOnly = stripLogs(normalized);

  fs.mkdirSync(path.dirname(statusPath), { recursive: true });

  const tempPath = `${statusPath}.tmp`;

  fs.writeFileSync(tempPath, JSON.stringify(statusOnly, null, 2), "utf-8");
  fs.renameSync(tempPath, statusPath);
}
