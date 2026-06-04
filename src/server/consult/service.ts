import { createSupabaseServerClient } from "@/lib/supabase-server";

export type ConsultPayload = {
  businessNumber: string;
  businessLocation: string;
  name: string;
  phone: string;
  email: string;
  referrer: string;
  restaurantInfo: string;
  requestNote: string;
};

export type ConsultListItem = {
  id: number;
  businessNumber: string;
  businessLocation: string;
  name: string;
  phone: string;
  email: string;
  referrer: string;
  restaurantInfo: string;
  requestNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ListConsultsParams = {
  page?: number;
  pageSize?: number;
  query?: string;
};

export type ListConsultsResult = {
  items: ConsultListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    today: number;
    weekly: number;
  };
};

export type DeleteConsultResult = {
  id: number;
};

type ConsultRow = {
  id: number | null;
  business_number: string | null;
  business_location: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  referrer: string | null;
  restaurant_info: string | null;
  request_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const CONSULT_TABLE = "consults";
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const CONSULT_SELECT_FIELDS =
  "id, business_number, business_location, name, phone, email, referrer, restaurant_info, request_note, created_at, updated_at";

const FIELD_LIMITS = {
  businessNumber: 32,
  businessLocation: 120,
  name: 40,
  phone: 16,
  email: 120,
  referrer: 80,
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
    referrer: payload.referrer?.trim() ?? "",
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
    payload.referrer,
    FIELD_LIMITS.referrer,
    "추천인 길이를 확인해주세요.",
  );
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
  return assertNoDuplicateConsultForPayload(payload);
}

async function assertNoDuplicateConsultForPayload(
  payload: ConsultPayload,
  excludedId?: number,
) {
  const supabase = createSupabaseServerClient();
  const duplicateSince = new Date(
    Date.now() - DUPLICATE_WINDOW_MS,
  ).toISOString();

  let query = supabase
    .from(CONSULT_TABLE)
    .select("id, created_at")
    .eq("email", payload.email)
    .eq("phone", payload.phone)
    .is("deleted_at", null)
    .gte("created_at", duplicateSince)
    .order("created_at", { ascending: false })
    .limit(5);

  if (typeof excludedId === "number") {
    query = query.neq("id", excludedId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[consult] duplicate check error:", error);
    throw new ConsultSubmissionError("문의 확인 중 오류가 발생했습니다.", 500);
  }

  if ((data ?? []).length > 0) {
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
    referrer: payload.referrer || null,
    restaurant_info: payload.restaurantInfo,
    request_note: payload.requestNote || null,
  });

  if (error) {
    console.error("[consult] supabase insert error:", error);
    throw new ConsultSubmissionError("문의 저장 중 오류가 발생했습니다.", 500);
  }
}

function assertValidConsultId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ConsultSubmissionError("유효한 문의 ID가 아닙니다.", 400);
  }
}

function mapConsultRow(item: ConsultRow): ConsultListItem {
  return {
    id: Number(item.id ?? 0),
    businessNumber: String(item.business_number ?? ""),
    businessLocation: String(item.business_location ?? ""),
    name: String(item.name ?? ""),
    phone: String(item.phone ?? ""),
    email: String(item.email ?? ""),
    referrer: String(item.referrer ?? ""),
    restaurantInfo: String(item.restaurant_info ?? ""),
    requestNote: String(item.request_note ?? ""),
    createdAt: String(item.created_at ?? ""),
    updatedAt: String(item.updated_at ?? ""),
  };
}

async function assertConsultExists(id: number) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(CONSULT_TABLE)
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[consult] existence check error:", error);
    throw new ConsultSubmissionError("문의 조회 중 오류가 발생했습니다.", 500);
  }

  if (!data) {
    throw new ConsultSubmissionError("해당 문의를 찾을 수 없습니다.", 404);
  }
}

export async function submitConsult(payload: Partial<ConsultPayload>) {
  const normalizedPayload = normalizeConsultPayload(payload);

  validateConsultPayload(normalizedPayload);
  await assertNoDuplicateConsult(normalizedPayload);
  await insertConsult(normalizedPayload);

  return normalizedPayload;
}

export async function updateConsult(
  id: number,
  payload: Partial<ConsultPayload>,
): Promise<ConsultListItem> {
  assertValidConsultId(id);
  await assertConsultExists(id);

  const normalizedPayload = normalizeConsultPayload(payload);

  validateConsultPayload(normalizedPayload);
  await assertNoDuplicateConsultForPayload(normalizedPayload, id);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(CONSULT_TABLE)
    .update({
      business_number: normalizedPayload.businessNumber,
      business_location: normalizedPayload.businessLocation,
      name: normalizedPayload.name,
      phone: normalizedPayload.phone,
      email: normalizedPayload.email,
      referrer: normalizedPayload.referrer || null,
      restaurant_info: normalizedPayload.restaurantInfo,
      request_note: normalizedPayload.requestNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select(CONSULT_SELECT_FIELDS)
    .single();

  if (error) {
    console.error("[consult] update error:", error);
    throw new ConsultSubmissionError("문의 수정 중 오류가 발생했습니다.", 500);
  }

  return mapConsultRow(data as ConsultRow);
}

export async function deleteConsult(id: number): Promise<DeleteConsultResult> {
  assertValidConsultId(id);
  await assertConsultExists(id);

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(CONSULT_TABLE)
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[consult] delete error:", error);
    throw new ConsultSubmissionError("문의 삭제 중 오류가 발생했습니다.", 500);
  }

  return { id };
}

function normalizeListParams(params: ListConsultsParams) {
  const page =
    Number.isFinite(params.page) && (params.page ?? 0) > 0
      ? Math.floor(params.page as number)
      : 1;
  const pageSize =
    Number.isFinite(params.pageSize) && (params.pageSize ?? 0) > 0
      ? Math.min(Math.floor(params.pageSize as number), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  const query = params.query?.trim() ?? "";

  return {
    page,
    pageSize,
    query,
  };
}

function buildSearchFilter(query: string) {
  const escaped = query.replace(/[%_,]/g, "");

  return [
    `business_location.ilike.%${escaped}%`,
    `name.ilike.%${escaped}%`,
    `phone.ilike.%${escaped}%`,
    `email.ilike.%${escaped}%`,
    `business_number.ilike.%${escaped}%`,
  ].join(",");
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function sevenDaysAgo() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function countConsultsSince(isoDate: string) {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from(CONSULT_TABLE)
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", isoDate);

  if (error) {
    console.error("[consult] count error:", error);
    throw new ConsultSubmissionError("문의 목록 집계 중 오류가 발생했습니다.", 500);
  }

  return count ?? 0;
}

export async function listConsults(
  params: ListConsultsParams = {},
): Promise<ListConsultsResult> {
  const { page, pageSize, query } = normalizeListParams(params);
  const supabase = createSupabaseServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabase
    .from(CONSULT_TABLE)
    .select(CONSULT_SELECT_FIELDS, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    queryBuilder = queryBuilder.or(buildSearchFilter(query));
  }

  const [{ data, count, error }, total, today, weekly] = await Promise.all([
    queryBuilder,
    countConsultsSince("1970-01-01T00:00:00.000Z"),
    countConsultsSince(startOfToday()),
    countConsultsSince(sevenDaysAgo()),
  ]);

  if (error) {
    console.error("[consult] list query error:", error);
    throw new ConsultSubmissionError("문의 목록 조회 중 오류가 발생했습니다.", 500);
  }

  const items: ConsultListItem[] = (data ?? []).map((item) =>
    mapConsultRow(item as ConsultRow),
  );

  const totalCount = count ?? 0;

  return {
    items,
    pagination: {
      page,
      pageSize,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
    stats: {
      total,
      today,
      weekly,
    },
  };
}
