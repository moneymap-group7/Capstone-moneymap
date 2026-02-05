import { useRef, useState } from "react";

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

async function uploadStatementMock(file) {
  await new Promise((r) => setTimeout(r, 800));

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { status: "FAIL_VALIDATION", errors: ["Only CSV files are allowed."] };
  }

  return {
    status: "SUCCESS",
    message: "Statement uploaded successfully.",
    statementId: `STMT-${Math.floor(Math.random() * 100000)}`,
  };
}

export default function UploadStatement() {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setErrors([]);
    setMessage("");
    setStatus(f ? STATUS.READY : STATUS.IDLE);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus(STATUS.UPLOADING);
    const res = await uploadStatementMock(file);
    if (res.status === "SUCCESS") {
      setStatus(STATUS.SUCCESS);
      setMessage(res.message);
    } else {
      setStatus(STATUS.ERROR);
      setErrors(res.errors);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>Upload Bank Statement</h2>
      <input ref={inputRef} type="file" accept=".csv" onChange={onFileChange} />
      {file && <p>{file.name} ({formatBytes(file.size)})</p>}
      <button onClick={handleUpload} disabled={status !== STATUS.READY}>
        Upload
      </button>

      {status === STATUS.SUCCESS && <p style={{ color: "green" }}>{message}</p>}
      {status === STATUS.ERROR && (
        <ul style={{ color: "red" }}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </main>
  );
}
