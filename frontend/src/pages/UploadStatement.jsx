import { useRef, useState } from "react";
import { uploadStatement } from "../services/statementService";
import ErrorBox from "../components/common/ErrorBox";
import StatusBanner from "../components/common/StatusBanner";

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

function pickNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export default function UploadStatement() {
  const inputRef = useRef(null);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [file, setFile] = useState(null);

  const [statusMsg, setStatusMsg] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [meta, setMeta] = useState(null);

  function reset() {
    setStatus(STATUS.IDLE);
    setFile(null);
    setStatusMsg("");
    setErrorList([]);
    setMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setStatusMsg("");
    setErrorList([]);
    setMeta(null);
    setStatus(f ? STATUS.READY : STATUS.IDLE);
  }

  async function handleUpload() {
    if (!file || status === STATUS.UPLOADING) return;

    setStatus(STATUS.UPLOADING);
    setStatusMsg("Uploading… please wait.");
    setErrorList([]);
    setMeta(null);

    try {
      const result = await uploadStatement(file);

      if (result.ok) {
        const msg =
          (result.data &&
            typeof result.data === "object" &&
            (result.data.message || result.data.status)) ||
          "Upload successful.";

        setStatus(STATUS.SUCCESS);
        setStatusMsg(String(msg));
        setErrorList([]);
        setMeta(result.data);
        return;
      }

      const list = [];
      if (result.status) list.push(`HTTP ${result.status}`);
      if (result.message) list.push(result.message);

      if (Array.isArray(result.errors) && result.errors.length) {
        result.errors.forEach((e) => list.push(typeof e === "string" ? e : JSON.stringify(e)));
      } else if (result.raw) {
        list.push(typeof result.raw === "string" ? result.raw : JSON.stringify(result.raw));
      }

      setStatus(STATUS.ERROR);
      setStatusMsg("");
      setErrorList(list.length ? list : ["Upload failed."]);
    } catch {
      setStatus(STATUS.ERROR);
      setStatusMsg("");
      setErrorList(["Unexpected error occurred during upload."]);
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

      {/* Status feedback */}
      {status === STATUS.UPLOADING && (
        <StatusBanner type="info" message={statusMsg || "Uploading…"} />
      )}

      {status === STATUS.SUCCESS && (
        <StatusBanner type="success" message={statusMsg || "Upload successful."} />
      )}

      {/* Import Summary (Step B) */}
      {status === STATUS.SUCCESS && meta && typeof meta === "object" && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            background: "#fafafa",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Import Summary</h3>

          {(() => {
            const total = pickNumber(meta, ["totalRows", "total", "rows", "rowCount"]);
            const imported = pickNumber(meta, [
              "insertedCount",
              "imported",
              "created",
              "saved",
              "successCount",
            ]);
            const skipped = pickNumber(meta, ["skippedCount", "skipped", "ignored"]);

            const warnings = Array.isArray(meta.warnings)
              ? meta.warnings
              : Array.isArray(meta.warning)
              ? meta.warning
              : null;

            return (
              <>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {total !== null && (
                    <li>
                      <strong>Total rows:</strong> {total}
                    </li>
                  )}
                  {imported !== null && (
                    <li>
                      <strong>Imported:</strong> {imported}
                    </li>
                  )}
                  {skipped !== null && (
                    <li>
                      <strong>Skipped:</strong> {skipped}
                    </li>
                  )}

                  {total === null && imported === null && skipped === null && (
                    <li>
                      <strong>Result:</strong> Upload completed (no summary fields returned).
                    </li>
                  )}
                </ul>

                {warnings && warnings.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700 }}>Warnings</div>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                      {warnings.slice(0, 5).map((w, i) => (
                        <li key={i}>{typeof w === "string" ? w : JSON.stringify(w)}</li>
                      ))}
                    </ul>
                    {warnings.length > 5 && (
                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
                        Showing first 5 warnings.
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* Debug raw response (optional) */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer" }}>View raw response (debug)</summary>
            <pre
              style={{
                marginTop: 10,
                color: "#111",
                background: "#f6f6f6",
                padding: 12,
                borderRadius: 8,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(meta, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {status === STATUS.ERROR && <ErrorBox title="Upload failed" errors={errorList} />}
    </main>
  );
}