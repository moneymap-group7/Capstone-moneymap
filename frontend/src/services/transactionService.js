const LIST_ENDPOINT = "/api/transactions";
const UPLOAD_CSV_ENDPOINT = "/api/transactions/upload-csv";
const CSV_FIELD_NAME = "file";

function getToken() {
  return localStorage.getItem("mm_access_token");
}

async function readBody(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) return res.json().catch(() => null);
  return res.text().catch(() => null);
}

function normalizeError(res, data) {
  const message =
    (data && typeof data === "object" && (data.message || data.error)) ||
    (typeof data === "string" && data) ||
    `Request failed (${res.status})`;

  const errors =
    (data && typeof data === "object" && Array.isArray(data.errors) && data.errors) ||
    (data && typeof data === "object" && Array.isArray(data.messages) && data.messages) ||
    null;

  return { ok: false, status: res.status, message, errors, raw: data };
}

/**
 * GET /transactions
 * Returns { ok:true, data: Transaction[] } or { ok:false, ... }
 */
export async function getTransactions() {
  const token = getToken();

  const res = await fetch(LIST_ENDPOINT, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await readBody(res);

  if (res.ok) return { ok: true, data };

  return normalizeError(res, data);
}

/**
 * POST /transactions/upload-csv
 * Uploads a CSV file (field name: "file")
 */
export async function uploadTransactionsCsv(file) {
  const token = getToken();

  const formData = new FormData();
  formData.append(CSV_FIELD_NAME, file);

  const res = await fetch(UPLOAD_CSV_ENDPOINT, {
    method: "POST",
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await readBody(res);

  if (res.ok) return { ok: true, data };

  return normalizeError(res, data);
}