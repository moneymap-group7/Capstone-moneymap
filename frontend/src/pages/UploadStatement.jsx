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

export default function UploadStatement() {
  const inputRef = useRef(null);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [file, setFile] = useState(null);

  // status + errors (new)
  const [statusMsg, setStatusMsg] = useState("");
  const [errorList, setErrorList] = useState([]);

  // keep meta for debugging (optional)
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

      // show status + raw details so you can debug quickly
      const list = [];
      if (result.status) list.push(`HTTP ${result.status}`);
      if (result.message) list.push(result.message);

      if (Array.isArray(result.errors) && result.errors.length) {
        result.errors.forEach((e) =>
          list.push(typeof e === "string" ? e : JSON.stringify(e))
        );
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

      {status === STATUS.ERROR && (
        <ErrorBox title="Upload failed" errors={errorList} />
      )}

      {/* Optional debug preview (only on success) */}
      {status === STATUS.SUCCESS && meta && typeof meta === "object" && (
        <pre
          style={{
            marginTop: 10,
            color: "#111",
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {JSON.stringify(meta, null, 2)}
        </pre>
      )}
    </main>
  );
}
