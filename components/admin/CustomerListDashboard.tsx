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
    <section className="space-y-6">
      {toastMessage ? (
        <div className="pointer-events-none fixed right-6 top-6 z-[70]">
          <ToastAlert
            message={toastMessage}
            variant="success"
            onClose={() => setToastMessage("")}
          />
        </div>
      ) : null}

      <div className="rounded-[28px] border border-black/8 bg-white px-8 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <p className="text-sm font-medium text-[#ff6a1a]">Customer Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-neutral-900">
          List
        </h2>
        <p className="mt-3 max-w-[720px] text-sm leading-6 text-neutral-500">
          고객 문의 목록을 확인하고, 이후 수정 및 삭제 기능을 붙일 수 있도록
          준비된 미니멀 대시보드입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-black/8 bg-white px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            Total
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-900">
            {stats.total}
          </div>
          <div className="mt-2 text-sm text-neutral-500">전체 고객 문의</div>
        </div>
        <div className="rounded-[24px] border border-black/8 bg-white px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            Today
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-900">
            {stats.today}
          </div>
          <div className="mt-2 text-sm text-neutral-500">오늘 문의</div>
        </div>
        <div className="rounded-[24px] border border-black/8 bg-white px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            Last 7 Days
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-900">
            {stats.weekly}
          </div>
          <div className="mt-2 text-sm text-neutral-500">최근 7일 문의</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/8 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 border-b border-black/6 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              Customer List
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              한 페이지당 10개씩 표시됩니다.
            </div>
          </div>

          <label className="flex h-11 w-full max-w-[280px] items-center gap-3 rounded-full border border-black/8 bg-[#fafafa] px-4 text-sm text-neutral-500">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="사업장위치, 이름, 연락처, 이메일 검색"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-black/6 bg-[#fcfcfc]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  사업자번호
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  사업장위치
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  이름
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  연락처
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  이메일
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  추천인
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  접수일
                </th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    고객 리스트를 불러오는 중입니다.
                  </td>
                </tr>
              ) : null}
              {!isLoading && errorMessage ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-[#d14f2a]"
                  >
                    {errorMessage}
                  </td>
                </tr>
              ) : null}
              {!isLoading && !errorMessage && currentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-neutral-400"
                  >
                    표시할 고객이 없습니다.
                  </td>
                </tr>
              ) : null}
              {currentRows.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-black/6 last:border-b-0"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {customer.businessNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {customer.businessLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-800">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-700">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-700">
                    {customer.referrer || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-700">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openCustomerModal(customer)}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-black/8 bg-white px-3 text-xs font-medium text-neutral-600 transition hover:border-black/12 hover:bg-neutral-50 hover:text-neutral-900"
                      >
                        상세보기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(customer);
                          setDeleteErrorMessage("");
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-neutral-500 transition hover:border-[#ffd6cf] hover:bg-[#fff7f5] hover:text-[#d14f2a]"
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

        <div className="flex flex-col items-center gap-4 border-t border-black/6 px-6 py-5">
          <div className="text-center text-sm text-neutral-500">
            {pagination.total === 0
              ? "표시할 고객이 없습니다."
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white text-neutral-500 transition hover:border-black/12 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "border border-black/8 bg-white text-neutral-500 hover:border-black/12 hover:bg-neutral-50 hover:text-neutral-800"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white text-neutral-500 transition hover:border-black/12 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="다음 페이지"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 px-4 py-6 backdrop-blur-[6px]">
          <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[30px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
            <div className="flex items-start justify-between border-b border-black/6 px-7 py-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  {isEditMode ? "Edit Customer" : "Customer Detail"}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neutral-900">
                  {isEditMode ? "고객 문의 수정" : selectedCustomer.name}
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  {isEditMode
                    ? "입력값을 수정한 뒤 저장하면 유효성 검사 후 반영됩니다."
                    : selectedCustomer.businessLocation}
                </div>
              </div>

              <button
                type="button"
                onClick={closeCustomerModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white text-neutral-500 transition hover:border-black/12 hover:bg-neutral-50 hover:text-neutral-900"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="studio-scroll overflow-y-auto px-7 py-6">
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
                <div className="mt-5 rounded-[18px] border border-[#ffd6cf] bg-[#fff7f5] px-4 py-3 text-sm text-[#d14f2a]">
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
                      className="inline-flex h-11 items-center justify-center rounded-full border border-black/8 bg-white px-5 text-sm font-medium text-neutral-600 transition hover:border-black/12 hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={isSaving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      저장하기
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeCustomerModal}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-black/8 bg-white px-5 text-sm font-medium text-neutral-600 transition hover:border-black/12 hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      닫기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditErrorMessage("");
                        setIsEditMode(true);
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      수정하기
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 px-4 backdrop-blur-[6px]">
          <div className="w-full max-w-[440px] rounded-[30px] border border-black/8 bg-white px-7 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Delete Customer
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neutral-900">
              정말 삭제할까요?
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              <span className="font-medium text-neutral-800">
                {deleteTarget.name}
              </span>
              {" · "}
              {deleteTarget.businessLocation}
              문의를 삭제합니다. 삭제 후에는 되돌릴 수 없습니다.
            </p>

            {deleteErrorMessage ? (
              <div className="mt-5 rounded-[18px] border border-[#ffd6cf] bg-[#fff7f5] px-4 py-3 text-sm text-[#d14f2a]">
                {deleteErrorMessage}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/8 bg-white px-5 text-sm font-medium text-neutral-600 transition hover:border-black/12 hover:bg-neutral-50 hover:text-neutral-900"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#d14f2a] px-5 text-sm font-medium text-white transition hover:bg-[#bd4522] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                삭제하기
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
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </div>
      <div className="mt-2 rounded-[18px] border border-black/8 bg-[#fafafa] px-4 py-3 text-sm text-neutral-800">
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
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`mt-2 h-12 w-full rounded-[18px] border border-black/8 px-4 text-sm text-neutral-800 outline-none transition ${
          readOnly
            ? "cursor-default bg-[#fafafa] text-neutral-700"
            : "bg-[#fafafa] focus:border-black/14 focus:bg-white"
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
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={readOnly}
        className={`mt-2 w-full rounded-[22px] border border-black/8 px-4 py-4 text-sm leading-7 text-neutral-800 outline-none transition ${
          readOnly
            ? "cursor-default resize-none bg-[#fafafa] text-neutral-700"
            : "resize-none bg-[#fafafa] focus:border-black/14 focus:bg-white"
        }`}
      />
    </label>
  );
}
