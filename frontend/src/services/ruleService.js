const BASE_URL = "http://localhost:3000/rules";

function getToken() {
  return localStorage.getItem("mm_access_token");
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("mm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  const user = getUserFromStorage();

  if (!user) return null;

  return user.userId ?? user.id ?? user.user?.userId ?? user.user?.id ?? null;
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (res.ok) {
    return { ok: true, data };
  }

  const message =
    (data && typeof data === "object" && (data.message || data.error)) ||
    (typeof data === "string" && data) ||
    `Request failed (${res.status})`;

  return {
    ok: false,
    status: res.status,
    message,
    raw: data,
  };
}

export async function fetchRules(userId) {
  const res = await fetch(`${BASE_URL}?userId=${userId}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });

  return parseResponse(res);
}

export async function createRule(payload) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function updateRule(ruleId, payload) {
  const res = await fetch(`${BASE_URL}/${ruleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function deleteRule(ruleId) {
  const res = await fetch(`${BASE_URL}/${ruleId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  return parseResponse(res);
}