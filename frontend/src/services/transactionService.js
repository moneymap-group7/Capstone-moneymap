import api from "./api";

const LIST_ENDPOINT = "/transactions";
const UPLOAD_CSV_ENDPOINT = "/transactions/upload-csv";
const UPDATE_CATEGORY_ENDPOINT = (id) => `/transactions/${id}`;
const CSV_FIELD_NAME = "file";

function normalizeAxiosError(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;

  const message =
    (data && typeof data === "object" && (data.message || data.error)) ||
    (typeof data === "string" && data) ||
    (status ? `Request failed (${status})` : "Backend not reachable.");

  const errors =
    (data && typeof data === "object" && Array.isArray(data.errors) && data.errors) ||
    (data && typeof data === "object" && Array.isArray(data.messages) && data.messages) ||
    null;

  return { ok: false, status, message, errors, raw: data ?? null };
}

export async function getTransactions({
  page = 1,
  pageSize = 20,
  q,
  type,
  fromDate,
  toDate,
  category,
} = {}) {
  const params = {
    page,
    pageSize,
    ...(q ? { q } : {}),
    ...(type ? { type } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    ...(category ? { category } : {}),
  };

  try {
    const res = await api.get(LIST_ENDPOINT, { params });
    const payload = res?.data ?? {};

    return {
      ok: true,
      data: Array.isArray(payload.data) ? payload.data : [],
      meta: payload.meta ?? { page, pageSize, total: 0, totalPages: 1 },
    };
  } catch (err) {
    return normalizeAxiosError(err);
  }
}

export async function uploadTransactionsCsv(file) {
  const formData = new FormData();
  formData.append(CSV_FIELD_NAME, file);

  try {
    const res = await api.post(UPLOAD_CSV_ENDPOINT, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return { ok: true, data: res?.data ?? null };
  } catch (err) {
    return normalizeAxiosError(err);
  }
}

export async function updateTransactionCategory(transactionId, spendCategory) {
  try {
    const res = await api.patch(
      UPDATE_CATEGORY_ENDPOINT(transactionId),
      { spendCategory }
    );

    return { ok: true, data: res?.data ?? null };
  } catch (err) {
    return normalizeAxiosError(err);
  }
}