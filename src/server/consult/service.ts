import { createSupabaseServerClient } from "@/lib/supabase-server";

export type ConsultPayload = {
  businessNumber: string;
  businessLocation: string;
  name: string;
  phone: string;
  email: string;
  restaurantInfo: string;
  requestNote: string;
};

const CONSULT_TABLE = "consults";
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const FIELD_LIMITS = {
  businessNumber: 32,
  businessLocation: 120,
  name: 40,
  phone: 16,
  email: 120,
  restaurantInfo: 2000,
  requestNote: 2000,
} as const;

export class ConsultSubmissionError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ConsultSubmissionError";
    this.status = status;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string) {
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim());
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone.trim();
}

export function normalizeConsultPayload(
  payload: Partial<ConsultPayload>,
): ConsultPayload {
  return {
    businessNumber: payload.businessNumber?.trim() ?? "",
    businessLocation: payload.businessLocation?.trim() ?? "",
    name: payload.name?.trim() ?? "",
    phone: normalizePhone(payload.phone ?? ""),
    email: payload.email?.trim().toLowerCase() ?? "",
    restaurantInfo: payload.restaurantInfo?.trim() ?? "",
    requestNote: payload.requestNote?.trim() ?? "",
  };
}

function assertMaxLength(value: string, limit: number, message: string) {
  if (value.length > limit) {
    throw new ConsultSubmissionError(message, 400);
  }
}

export function validateConsultPayload(payload: ConsultPayload) {
  if (
    !payload.businessNumber ||
    !payload.businessLocation ||
    !payload.name ||
    !payload.phone ||
    !payload.email ||
    !payload.restaurantInfo
  ) {
    throw new ConsultSubmissionError("필수 입력 항목을 확인해주세요.", 400);
  }

  if (!isValidPhone(payload.phone)) {
    throw new ConsultSubmissionError("연락처 형식을 확인해주세요.", 400);
  }

  if (!isValidEmail(payload.email)) {
    throw new ConsultSubmissionError("이메일 형식을 확인해주세요.", 400);
  }

  assertMaxLength(
    payload.businessNumber,
    FIELD_LIMITS.businessNumber,
    "사업자번호 길이를 확인해주세요.",
  );
  assertMaxLength(
    payload.businessLocation,
    FIELD_LIMITS.businessLocation,
    "사업장위치 길이를 확인해주세요.",
  );
  assertMaxLength(payload.name, FIELD_LIMITS.name, "이름 길이를 확인해주세요.");
  assertMaxLength(payload.phone, FIELD_LIMITS.phone, "연락처 길이를 확인해주세요.");
  assertMaxLength(payload.email, FIELD_LIMITS.email, "이메일 길이를 확인해주세요.");
  assertMaxLength(
    payload.restaurantInfo,
    FIELD_LIMITS.restaurantInfo,
    "음식점 정보가 너무 깁니다.",
  );
  assertMaxLength(
    payload.requestNote,
    FIELD_LIMITS.requestNote,
    "요청사항이 너무 깁니다.",
  );
}

async function assertNoDuplicateConsult(payload: ConsultPayload) {
  const supabase = createSupabaseServerClient();
  const duplicateSince = new Date(
    Date.now() - DUPLICATE_WINDOW_MS,
  ).toISOString();

  const { data, error } = await supabase
    .from(CONSULT_TABLE)
    .select("id, created_at")
    .eq("email", payload.email)
    .eq("phone", payload.phone)
    .gte("created_at", duplicateSince)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[consult] duplicate check error:", error);
    throw new ConsultSubmissionError("문의 확인 중 오류가 발생했습니다.", 500);
  }

  if (data) {
    throw new ConsultSubmissionError(
      "동일한 문의가 최근에 접수되었습니다. 잠시 후 다시 시도해주세요.",
      409,
    );
  }
}

async function insertConsult(payload: ConsultPayload) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from(CONSULT_TABLE).insert({
    business_number: payload.businessNumber,
    business_location: payload.businessLocation,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    restaurant_info: payload.restaurantInfo,
    request_note: payload.requestNote || null,
  });

  if (error) {
    console.error("[consult] supabase insert error:", error);
    throw new ConsultSubmissionError("문의 저장 중 오류가 발생했습니다.", 500);
  }
}

export async function submitConsult(payload: Partial<ConsultPayload>) {
  const normalizedPayload = normalizeConsultPayload(payload);

  validateConsultPayload(normalizedPayload);
  await assertNoDuplicateConsult(normalizedPayload);
  await insertConsult(normalizedPayload);

  return normalizedPayload;
}
