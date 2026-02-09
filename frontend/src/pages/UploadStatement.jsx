import { useRef, useState } from "react";
import { uploadStatement } from "../services/statementService";

const STATUS = {
  IDLE: "IDLE",
  READY: "READY",
  UPLOADING: "UPLOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function UploadStatement() {
  const inputRef = useRef(null);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [file, setFile] = useState(null);

  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [meta, setMeta] = useState(null); // store response summary (optional)

  function reset() {
    setStatus(STATUS.IDLE);
    setFile(null);
    setErrors([]);
    setSuccessMessage("");
    setMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setErrors([]);
    setSuccessMessage("");
    setMeta(null);
    setStatus(f ? STATUS.READY : STATUS.IDLE);
  }

  async function handleUpload() {
    if (!file || status === STATUS.UPLOADING) return;

    setStatus(STATUS.UPLOADING);
    setErrors([]);
    setSuccessMessage("");
    setMeta(null);

    try {
      const result = await uploadStatement(file);

      if (result.ok) {
        // Backend success payload differs by team; we safely show a generic message
        const msg =
          (result.data && typeof result.data === "object" && (result.data.message || result.data.status)) ||
          "Upload successful.";

        setStatus(STATUS.SUCCESS);
        setSuccessMessage(String(msg));
        setMeta(result.data);
        return;
      }

      // Error handling
      const list =
        Array.isArray(result.errors) && result.errors.length
          ? result.errors.map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
          : [result.message || "Upload failed."];

      setStatus(STATUS.ERROR);
      setErrors(list);
    } catch (e) {
      setStatus(STATUS.ERROR);
      setErrors(["Unexpected error occurred during upload."]);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h2>Upload Bank Statement</h2>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={onFileChange}
        disabled={status === STATUS.UPLOADING}
      />

      {file && (
        <p style={{ marginTop: 10 }}>
          <strong>{file.name}</strong> ({formatBytes(file.size)})
        </p>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button onClick={handleUpload} disabled={status !== STATUS.READY}>
          {status === STATUS.UPLOADING ? "Uploading..." : "Upload"}
        </button>
        <button onClick={reset} disabled={status === STATUS.UPLOADING}>
          Reset
        </button>
      </div>

      {status === STATUS.SUCCESS && (
        <div style={{ marginTop: 18, color: "green" }}>
          <div>{successMessage}</div>

          {/* Optional: show a small response preview for debugging */}
          {meta && typeof meta === "object" && (
            <pre style={{ marginTop: 10, color: "#111", background: "#f6f6f6", padding: 12 }}>
              {JSON.stringify(meta, null, 2)}
            </pre>
          )}
        </div>
      )}

      {status === STATUS.ERROR && (
        <div style={{ marginTop: 18, color: "red" }}>
          <div style={{ fontWeight: 700 }}>Upload failed</div>
          <ul style={{ marginTop: 8 }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
