const BASE_URL = `${import.meta.env.VITE_API_URL}/auth`;

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

  const errors =
    (data && typeof data === "object" && Array.isArray(data.errors) && data.errors) ||
    (data && typeof data === "object" && Array.isArray(data.messages) && data.messages) ||
    null;

  return {
    ok: false,
    status: res.status,
    message,
    errors,
    raw: data,
  };
}

export async function registerUser(payload) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function loginUser(payload) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

export async function verifyEmail(payload) {
  const res = await fetch(`${BASE_URL}/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}