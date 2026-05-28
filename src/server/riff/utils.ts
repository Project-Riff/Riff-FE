import { randomBytes } from "crypto";
import { StoreInfo } from "./types";

export function createJobId() {
  return randomBytes(8).toString("hex");
}

export function now() {
  return Date.now();
}

export function sanitizeFilename(name: string) {
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop() : "mp4";
  const base = parts.join(".");

  const safeBase = base
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-가-힣]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const safeExt = (ext || "mp4").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return `${safeBase || "video"}.${safeExt || "mp4"}`;
}

export function readStoreInfo(src: unknown): StoreInfo | undefined {
  if (!src || typeof src !== "object") return undefined;

  const s = src as Record<string, unknown>;

  const get = (key: string) => {
    const value = s[key];
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  const info: StoreInfo = {
    address: get("address"),
    subtitle: get("subtitle"),
    strengths: get("strengths"),
    thumbnailTitle: get("thumbnailTitle"),
  };

  return Object.values(info).some(Boolean) ? info : undefined;
}