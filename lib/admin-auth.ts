/**
 * 관리자 세션 쿠키.
 *
 * 예전에는 쿠키 값이 고정 문자열("authorized")이라 누구나 쿠키를 직접 만들어 넣으면
 * 관리자로 통과됐다. 이제 "만료시각.서명" 형태로 만들고, 서명은 ADMIN_SECRET_KEY로
 * HMAC-SHA256 한 값이라 비밀키를 모르면 위조할 수 없다.
 *
 * middleware(Edge)와 API 라우트(Node) 양쪽에서 쓰므로 Web Crypto만 사용한다.
 */

export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 4;

export function getAdminCookieName() {
  return process.env.ADMIN_COOKIE_NAME || "admin_auth";
}

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** 길이가 같은 문자열을 끝까지 비교해 비교 시간으로 값을 추측하지 못하게 한다. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let diff = 0;

  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}

export async function createAdminSessionValue() {
  const secret = process.env.ADMIN_SECRET_KEY;

  if (!secret) {
    throw new Error("ADMIN_SECRET_KEY가 설정되지 않았습니다.");
  }

  const expiresAt = String(Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000);

  return `${expiresAt}.${await sign(expiresAt, secret)}`;
}

export async function verifyAdminSessionValue(value?: string | null) {
  const secret = process.env.ADMIN_SECRET_KEY;

  if (!secret || !value) return false;

  const [expiresAt, signature, ...rest] = value.split(".");

  if (!expiresAt || !signature || rest.length > 0) return false;

  const expiresAtMs = Number(expiresAt);

  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) return false;

  return safeEqual(signature, await sign(expiresAt, secret));
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");

    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

/** API 라우트 안에서 요청이 로그인한 관리자에게서 왔는지 확인한다. */
export async function isAdminRequest(request: Request) {
  return verifyAdminSessionValue(
    readCookie(request.headers.get("cookie"), getAdminCookieName()),
  );
}
