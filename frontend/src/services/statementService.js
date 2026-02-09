const ENDPOINT = "/statements/upload"; 
const FIELD_NAME = "file";

export async function uploadStatement(file) {
  const token = localStorage.getItem("mm_access_token");

  const formData = new FormData();
  formData.append(FIELD_NAME, file);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (res.ok) return { ok: true, data };

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
