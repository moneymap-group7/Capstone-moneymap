import { useEffect, useRef, useState } from "react";
import {
  getStatements,
  uploadStatement,
} from "../services/statementService";
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
    if (
      typeof v === "string" &&
      v.trim() !== "" &&
      !Number.isNaN(Number(v))
    ) {
      return Number(v);
    }
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
  const [uploadedFiles, setUploadedFiles] = useState([]);

  function reset() {
    setStatus(STATUS.IDLE);
    setFile(null);
    setStatusMsg("");
    setErrorList([]);
    setMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function fetchStatements() {
    const data = await getStatements();
    setUploadedFiles(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetchStatements();
  }, []);

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

      if (
        result.ok &&
        result.data &&
        typeof result.data === "object" &&
        result.data.status === "FAILED"
      ) {
        setStatus(STATUS.ERROR);
        setStatusMsg("");
        setMeta(null);
        setErrorList([
          typeof result.data.message === "string"
            ? result.data.message
            : "Upload failed.",
        ]);
        return;
      }

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
        await fetchStatements();
        return;
      }

      const list = [];

      if (result.status === 401) {
        list.push("Your session expired. Please log in again.");
      } else if (result.status === 403) {
        list.push("You do not have permission to upload statements.");
      } else if (result.status === 400) {
        list.push("We could not process this file. Please check the CSV format and try again.");
      } else if (typeof result.status === "number" && result.status >= 500) {
        list.push("Something went wrong while processing the upload. Please try again later.");
      }

      if (list.length === 0 && result.message) {
        list.push(result.message);
      }

      if (Array.isArray(result.errors) && result.errors.length) {
        result.errors.forEach((e) => {
          if (typeof e === "string") {
            list.push(e);
          }
        });
}

      setStatus(STATUS.ERROR);
      setStatusMsg("");
      setErrorList(list.length ? list : ["Upload failed."]);
    } catch {
      setStatus(STATUS.ERROR);
      setStatusMsg("");
      setErrorList(["Something went wrong during upload. Please try again."]);
    }
  }

  const canUpload = !!file && status !== STATUS.UPLOADING;

  const total = pickNumber(meta, ["totalRows", "total", "rows", "rowCount"]);
  const imported = pickNumber(meta, [
    "insertedCount",
    "imported",
    "created",
    "saved",
    "successCount",
  ]);
  const skipped = pickNumber(meta, ["skippedCount", "skipped", "ignored"]);

  const warnings = Array.isArray(meta?.warnings)
    ? meta.warnings
    : Array.isArray(meta?.warning)
    ? meta.warning
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "36px 24px 56px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 56,
              lineHeight: 1.05,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Upload Statement
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              fontSize: 18,
              color: "#64748b",
            }}
          >
            Import a bank CSV file and add transactions into MoneyMap.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 24,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "28px 28px 18px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Upload Bank Statement
              </h2>
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 16,
                  color: "#64748b",
                }}
              >
                Choose a CSV file exported from your bank. The file will be
                processed and summarized below.
              </p>
            </div>

            <div style={{ padding: 28 }}>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={onFileChange}
                disabled={status === STATUS.UPLOADING}
                style={{ display: "none" }}
              />

              <div
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: 20,
                  background: file ? "#f8fafc" : "#ffffff",
                  padding: 24,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      Select CSV File
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                      }}
                    >
                      Supported format: <strong>.csv</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={status === STATUS.UPLOADING}
                    style={{
                      border: "none",
                      borderRadius: 14,
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: 15,
                      fontWeight: 700,
                      padding: "12px 18px",
                      cursor:
                        status === STATUS.UPLOADING ? "not-allowed" : "pointer",
                      opacity: status === STATUS.UPLOADING ? 0.7 : 1,
                    }}
                  >
                    Choose File
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    background: "#ffffff",
                    padding: "16px 18px",
                  }}
                >
                  {file ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0f172a",
                            wordBreak: "break-word",
                          }}
                        >
                          {file.name}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 14,
                            color: "#64748b",
                          }}
                        >
                          File size: {formatBytes(file.size)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "#eff6ff",
                          color: "#2563eb",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Ready to upload
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 15,
                        color: "#64748b",
                      }}
                    >
                      No file selected yet.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginTop: 20,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!canUpload}
                    style={{
                      border: "none",
                      borderRadius: 14,
                      background: canUpload ? "#2563eb" : "#cbd5e1",
                      color: "#ffffff",
                      fontSize: 15,
                      fontWeight: 700,
                      padding: "12px 18px",
                      cursor: canUpload ? "pointer" : "not-allowed",
                    }}
                  >
                    {status === STATUS.UPLOADING ? "Uploading..." : "Upload CSV"}
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    disabled={status === STATUS.UPLOADING}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 14,
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: 15,
                      fontWeight: 700,
                      padding: "12px 18px",
                      cursor:
                        status === STATUS.UPLOADING ? "not-allowed" : "pointer",
                      opacity: status === STATUS.UPLOADING ? 0.7 : 1,
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                {status === STATUS.UPLOADING && (
                  <StatusBanner type="info" message={statusMsg || "Uploading…"} />
                )}

                {status === STATUS.SUCCESS && (
                  <StatusBanner
                    type="success"
                    message={statusMsg || "Upload successful."}
                  />
                )}

                {status === STATUS.ERROR && (
                  <ErrorBox title="Upload failed" errors={errorList} />
                )}
              </div>

              {status === STATUS.SUCCESS && meta && typeof meta === "object" && (
                <div
                  style={{
                    marginTop: 22,
                    border: "1px solid #e2e8f0",
                    borderRadius: 20,
                    background: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "20px 22px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      Import Summary
                    </h3>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 15,
                        color: "#64748b",
                      }}
                    >
                      Overview of the processed statement file.
                    </p>
                  </div>

                  <div style={{ padding: 22 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 14,
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 16,
                          background: "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Total Rows
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 32,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {total ?? "—"}
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid #d1fae5",
                          borderRadius: 16,
                          padding: 16,
                          background: "#f0fdf4",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#166534",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Imported
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 32,
                            fontWeight: 800,
                            color: "#166534",
                          }}
                        >
                          {imported ?? "—"}
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid #f1f5f9",
                          borderRadius: 16,
                          padding: 16,
                          background: "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Skipped
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 32,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {skipped ?? "—"}
                        </div>
                      </div>
                    </div>

                    {total === null && imported === null && skipped === null && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 14,
                          borderRadius: 14,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#475569",
                          fontSize: 14,
                        }}
                      >
                        Upload completed, but the backend did not return standard
                        summary fields.
                      </div>
                    )}

                    {warnings && warnings.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          border: "1px solid #fde68a",
                          background: "#fffbeb",
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "#92400e",
                            marginBottom: 8,
                          }}
                        >
                          Warnings
                        </div>

                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 18,
                            color: "#78350f",
                          }}
                        >
                          {warnings.slice(0, 5).map((w, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                              {typeof w === "string" ? w : JSON.stringify(w)}
                            </li>
                          ))}
                        </ul>

                        {warnings.length > 5 && (
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 13,
                              color: "#92400e",
                            }}
                          >
                            Showing first 5 warnings.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 30,
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  background: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "18px 22px",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    Uploaded CSV Files
                  </h3>
                </div>

                <div style={{ padding: 20 }}>
                  {uploadedFiles.length === 0 ? (
                    <div style={{ color: "#64748b" }}>No uploaded files yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <th style={{ padding: 10 }}>File Name</th>
                          <th style={{ padding: 10 }}>Bank</th>
                          <th style={{ padding: 10 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedFiles.map((uploadedFile) => (
                          <tr
                            key={uploadedFile.statementId}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                          >
                            <td style={{ padding: 10 }}>
                              {uploadedFile.originalFileName}
                            </td>
                            <td style={{ padding: 10 }}>
                              {uploadedFile.bank || "-"}
                            </td>
                            <td style={{ padding: 10 }}>
                              {uploadedFile.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside
            style={{
              display: "grid",
              gap: 24,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 24,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                padding: 24,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Upload Tips
              </h3>

              <ul
                style={{
                  margin: "16px 0 0",
                  paddingLeft: 18,
                  color: "#475569",
                  lineHeight: 1.7,
                  fontSize: 15,
                }}
              >
                <li>Use a CSV exported directly from your bank.</li>
                <li>Upload one statement file at a time.</li>
                <li>Review warnings after import for skipped rows.</li>
                <li>Keep raw exports unchanged for best parsing accuracy.</li>
              </ul>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 24,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Current Status
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {status === STATUS.IDLE && "Waiting"}
                {status === STATUS.READY && "Ready"}
                {status === STATUS.UPLOADING && "Uploading"}
                {status === STATUS.SUCCESS && "Completed"}
                {status === STATUS.ERROR && "Failed"}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 15,
                  color: "#64748b",
                }}
              >
                {file
                  ? `Selected file: ${file.name}`
                  : "No file selected yet."}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}