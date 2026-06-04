"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ToastAlert from "@/components/ui/ToastAlert";
import type {
  ConsultPayload,
  ConsultListItem,
  ListConsultsResult,
} from "@/src/server/consult/service";

const PAGE_SIZE = 10;

type DashboardData = ListConsultsResult;
type EditFormState = ConsultPayload;

const emptyEditForm: EditFormState = {
  businessNumber: "",
  businessLocation: "",
  name: "",
  phone: "",
  email: "",
  referrer: "",
  restaurantInfo: "",
  requestNote: "",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function CustomerListDashboard() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<ConsultListItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConsultListItem | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeout = window.setTimeout(() => {
      setToastMessage("");
    }, 2500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastMessage]);

  async function fetchConsults(options?: { nextPage?: number }) {
    const targetPage = options?.nextPage ?? page;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const searchParams = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });

      if (trimmedQuery) {
        searchParams.set("query", trimmedQuery);
      }

      const response = await fetch(`/api/admin/consults?${searchParams.toString()}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as DashboardData & { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "고객 리스트를 불러오지 못했습니다.");
      }

      setData(result);
    } catch (error) {
      console.error("[admin/list] fetch error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "고객 리스트를 불러오지 못했습니다.",
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchConsults();
  }, [page, trimmedQuery]);

  function openCustomerModal(customer: ConsultListItem) {
    setSelectedCustomer(customer);
    setIsEditMode(false);
    setEditErrorMessage("");
    setEditForm({
      businessNumber: customer.businessNumber,
      businessLocation: customer.businessLocation,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      referrer: customer.referrer,
      restaurantInfo: customer.restaurantInfo,
      requestNote: customer.requestNote,
    });
  }

  function closeCustomerModal() {
    setSelectedCustomer(null);
    setIsEditMode(false);
    setEditForm(emptyEditForm);
    setEditErrorMessage("");
    setIsSaving(false);
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteErrorMessage("");
    setIsDeleting(false);
  }

  function updateEditField<K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setEditErrorMessage("");
  }

  async function handleSave() {
    if (!selectedCustomer || !isEditMode) return;

    setIsSaving(true);
    setEditErrorMessage("");

    try {
      const response = await fetch(`/api/admin/consults/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });
      const result = (await response.json()) as {
        error?: string;
        item?: ConsultListItem;
      };

      if (!response.ok) {
        throw new Error(result.error || "고객 문의 수정 중 오류가 발생했습니다.");
      }

      if (result.item) {
        setSelectedCustomer(result.item);
        setEditForm({
          businessNumber: result.item.businessNumber,
          businessLocation: result.item.businessLocation,
          name: result.item.name,
          phone: result.item.phone,
          email: result.item.email,
          referrer: result.item.referrer,
          restaurantInfo: result.item.restaurantInfo,
          requestNote: result.item.requestNote,
        });
      }
      setIsEditMode(false);
      setEditErrorMessage("");
      setIsSaving(false);
      setToastMessage("문의가 수정되었습니다.");
      await fetchConsults();
    } catch (error) {
      console.error("[admin/list] update error:", error);
      setEditErrorMessage(
        error instanceof Error
          ? error.message
          : "고객 문의 수정 중 오류가 발생했습니다.",
      );
      setIsSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteErrorMessage("");

    try {
      const response = await fetch(`/api/admin/consults/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "고객 문의 삭제 중 오류가 발생했습니다.");
      }

      const nextPage =
        currentRows.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      closeDeleteModal();
      setToastMessage("문의가 삭제되었습니다.");
      if (nextPage !== currentPage) {
        setPage(nextPage);
      } else {
        await fetchConsults({ nextPage });
      }
    } catch (error) {
      console.error("[admin/list] delete error:", error);
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : "고객 문의 삭제 중 오류가 발생했습니다.",
      );
      setIsDeleting(false);
    }
  }

  const stats = data?.stats ?? {
    total: 0,
    today: 0,
    weekly: 0,
  };
  const pagination = data?.pagination ?? {
    page,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };
  const currentRows: ConsultListItem[] = data?.items ?? [];
  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const pageStart = (currentPage - 1) * PAGE_SIZE;

  return (
    <section className="studio-scroll min-h-screen bg-white px-5 py-5 text-[#111] md:px-7 md:py-6">
      {toastMessage ? (
        <div className="pointer-events-none fixed right-6 top-6 z-[70]">
          <ToastAlert
            message={toastMessage}
            variant="success"
            onClose={() => setToastMessage("")}
          />
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-[1440px] gap-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-h-[84px] flex-col justify-center rounded-[16px] border border-[#f0f0f0] bg-white p-4">
            <p className="text-[12px] font-medium text-[#ff7a2f]">문의 관리</p>
            <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <h1 className="shrink-0 font-[var(--font-serif)] text-[26px] tracking-[-0.03em] text-[#111]">
                고객 문의
              </h1>
              <p className="pb-1 text-[13px] leading-5 text-[#777]">
                접수된 문의를 확인하고 필요한 정보만 빠르게 수정합니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "전체", value: stats.total },
              { label: "오늘", value: stats.today },
              { label: "7일", value: stats.weekly },
            ].map((item) => (
              <div
                key={item.label}
                className="flex min-h-[84px] flex-col justify-center rounded-[16px] border border-[#f0f0f0] bg-[#fafafa] px-3 py-2.5"
              >
                <div className="text-[11px] font-medium text-[#999]">
                  {item.label}
                </div>
                <div className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[#111]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-[#f0f0f0] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#f3f3f3] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-[var(--font-serif)] text-[20px] tracking-[-0.02em] text-[#111]">
              문의 목록
            </div>
            <div className="mt-1 text-[12px] text-[#999]">
              10개씩 보기
            </div>
          </div>

          <label className="flex h-10 w-full max-w-[320px] items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 text-[13px] text-[#777] transition focus-within:border-[#ffcfb0] focus-within:bg-[#fffaf6]">
            <Search className="h-4 w-4 text-[#ff7a2f]" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="이름, 연락처, 이메일"
              className="w-full bg-transparent outline-none placeholder:text-[#b8b8b8]"
            />
          </label>
        </div>

        <div className="studio-scroll overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f3f3f3] bg-[#fafafa]">
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  사업자
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  위치
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  이름
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  연락처
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  이메일
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  추천인
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-[#999]">
                  접수일
                </th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-[#999]">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-[13px] text-[#999]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#ff7a2f]" />
                      불러오는 중
                    </span>
                  </td>
                </tr>
              ) : null}
              {!isLoading && errorMessage ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-[13px] text-[#d14f2a]"
                  >
                    {errorMessage}
                  </td>
                </tr>
              ) : null}
              {!isLoading && !errorMessage && currentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-[13px] text-[#999]"
                  >
                    문의 없음
                  </td>
                </tr>
              ) : null}
              {currentRows.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-[#f5f5f5] transition hover:bg-[#fffaf6] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-[#111]">
                      {customer.businessNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[180px] truncate text-[13px] font-medium text-[#111]">
                      {customer.businessLocation}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-[#333]">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#555]">
                    {customer.phone}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#555]">
                    {customer.email}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#555]">
                    {customer.referrer || "-"}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#555]">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openCustomerModal(customer)}
                        className="inline-flex h-8 items-center justify-center rounded-full bg-[#fff0e6] px-3 text-[12px] font-medium text-[#ff7a2f] transition hover:bg-[#fff4ed]"
                      >
                        보기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(customer);
                          setDeleteErrorMessage("");
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ededed] bg-white text-[#999] transition hover:border-[#ffd6cf] hover:bg-[#fff7f5] hover:text-[#d14f2a]"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-[#f3f3f3] px-4 py-4">
          <div className="text-center text-[12px] text-[#999]">
            {pagination.total === 0
              ? "문의 없음"
              : `${pageStart + 1}-${Math.min(
                  pageStart + pagination.pageSize,
                  pagination.total,
                )} / ${pagination.total}`}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ededed] bg-white text-[#777] transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="이전 페이지"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const active = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-medium transition ${
                    active
                      ? "bg-[#ff7a2f] text-white"
                      : "border border-[#ededed] bg-white text-[#777] hover:bg-[#fafafa] hover:text-[#111]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ededed] bg-white text-[#777] transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="다음 페이지"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      </div>

      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border border-[#f0f0f0] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between border-b border-[#f3f3f3] px-5 py-5">
              <div>
                <div className="text-[12px] font-medium text-[#ff7a2f]">
                  {isEditMode ? "문의 수정" : "상세 정보"}
                </div>
                <div className="mt-1 font-[var(--font-serif)] text-[24px] tracking-[-0.03em] text-[#111]">
                  {isEditMode ? "고객 문의 수정" : selectedCustomer.name}
                </div>
                <div className="mt-1 text-[13px] text-[#777]">
                  {isEditMode
                    ? "수정 후 저장합니다."
                    : selectedCustomer.businessLocation}
                </div>
              </div>

              <button
                type="button"
                onClick={closeCustomerModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ededed] bg-white text-[#777] transition hover:bg-[#fafafa] hover:text-[#111]"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="studio-scroll overflow-y-auto px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <EditField
                  label="사업자번호"
                  value={editForm.businessNumber}
                  onChange={(value) => updateEditField("businessNumber", value)}
                  readOnly={!isEditMode}
                />
                <EditField
                  label="사업장위치"
                  value={editForm.businessLocation}
                  onChange={(value) => updateEditField("businessLocation", value)}
                  readOnly={!isEditMode}
                />
                <EditField
                  label="이름"
                  value={editForm.name}
                  onChange={(value) => updateEditField("name", value)}
                  readOnly={!isEditMode}
                />
                <EditField
                  label="연락처"
                  value={editForm.phone}
                  onChange={(value) => updateEditField("phone", value)}
                  readOnly={!isEditMode}
                />
                <div className="md:col-span-2">
                  <EditField
                    label="이메일"
                    value={editForm.email}
                    onChange={(value) => updateEditField("email", value)}
                    readOnly={!isEditMode}
                  />
                </div>
                <div className="md:col-span-2">
                  <EditField
                    label="추천인"
                    value={editForm.referrer}
                    onChange={(value) => updateEditField("referrer", value)}
                    readOnly={!isEditMode}
                    placeholder="추천인이 없다면 비워둘 수 있습니다"
                  />
                </div>
                {!isEditMode ? (
                  <div className="md:col-span-2">
                    <StaticField
                      label="접수일"
                      value={formatDate(selectedCustomer.createdAt)}
                    />
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <EditTextArea
                    label="음식점 정보"
                    value={editForm.restaurantInfo}
                    onChange={(value) => updateEditField("restaurantInfo", value)}
                    rows={5}
                    readOnly={!isEditMode}
                  />
                </div>
                <div className="md:col-span-2">
                  <EditTextArea
                    label="요청사항"
                    value={editForm.requestNote}
                    onChange={(value) => updateEditField("requestNote", value)}
                    rows={4}
                    readOnly={!isEditMode}
                    />
                </div>
              </div>

              {isEditMode && editErrorMessage ? (
                <div className="mt-5 rounded-[14px] border border-[#ffd6cf] bg-[#fff7f5] px-3 py-2 text-[13px] text-[#d14f2a]">
                  {editErrorMessage}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        openCustomerModal(selectedCustomer);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#ededed] bg-white px-4 text-[13px] font-medium text-[#555] transition hover:bg-[#fafafa] hover:text-[#111]"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={isSaving}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#ff7a2f] px-4 text-[13px] font-medium text-white transition hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      저장
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeCustomerModal}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#ededed] bg-white px-4 text-[13px] font-medium text-[#555] transition hover:bg-[#fafafa] hover:text-[#111]"
                    >
                      닫기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditErrorMessage("");
                        setIsEditMode(true);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#ff7a2f] px-4 text-[13px] font-medium text-white transition hover:bg-[#ff8a3d]"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-[20px] border border-[#f0f0f0] bg-white px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="text-[12px] font-medium text-[#d14f2a]">
              삭제 확인
            </div>
            <div className="mt-1 font-[var(--font-serif)] text-[24px] tracking-[-0.03em] text-[#111]">
              정말 삭제할까요?
            </div>
            <p className="mt-3 text-[13px] leading-6 text-[#777]">
              <span className="font-medium text-[#111]">
                {deleteTarget.name}
              </span>
              {" · "}
              {deleteTarget.businessLocation}
              문의를 삭제합니다.
            </p>

            {deleteErrorMessage ? (
              <div className="mt-5 rounded-[14px] border border-[#ffd6cf] bg-[#fff7f5] px-3 py-2 text-[13px] text-[#d14f2a]">
                {deleteErrorMessage}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#ededed] bg-white px-4 text-[13px] font-medium text-[#555] transition hover:bg-[#fafafa] hover:text-[#111]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#d14f2a] px-4 text-[13px] font-medium text-white transition hover:bg-[#bd4522] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-[#777]">
        {label}
      </div>
      <div className="mt-2 rounded-[12px] border border-[#ededed] bg-[#fafafa] px-3 py-3 text-[13px] text-[#555]">
        {value || "-"}
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder = "",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-[#777]">
        {label}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`mt-2 h-10 w-full rounded-[12px] border px-3 text-[13px] outline-none transition ${
          readOnly
            ? "cursor-default border-[#ededed] bg-[#fafafa] text-[#555]"
            : "border-[#ededed] bg-white text-[#111] focus:border-[#ffcfb0] focus:bg-[#fffaf6]"
        }`}
      />
    </label>
  );
}

function EditTextArea({
  label,
  value,
  onChange,
  rows,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-[#777]">
        {label}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={`studio-scroll mt-2 w-full rounded-[12px] border px-3 py-3 text-[13px] leading-6 outline-none transition ${
          readOnly
            ? "cursor-default resize-none border-[#ededed] bg-[#fafafa] text-[#555]"
            : "resize-none border-[#ededed] bg-white text-[#111] focus:border-[#ffcfb0] focus:bg-[#fffaf6]"
        }`}
      />
    </label>
  );
}
