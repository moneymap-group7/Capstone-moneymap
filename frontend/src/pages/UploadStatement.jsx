import { useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  Database,
  Trash2,
} from "lucide-react";
import { uploadStatement } from "../services/statementService";
import {
  getAllStatementFiles,
  deleteStatementFile,
} from "../services/statementsAdminService";
import ErrorBox from "../components/common/ErrorBox";
import StatusBanner from "../components/common/StatusBanner";
import StatementFilesTable from "../components/StatementFilesTable";
import "./upload-statement.css";

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

function normalizeFilesResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.files)) return data.files;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getFileId(item) {
  return item?.statementId ?? item?.id ?? item?._id ?? null;
}

function getFileName(item) {
  return (
    item?.originalFileName ??
    item?.fileName ??
    item?.name ??
    item?.storedFileName ??
    "this file"
  );
}

export default function UploadStatement() {
  const inputRef = useRef(null);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [file, setFile] = useState(null);

  const [statusMsg, setStatusMsg] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [meta, setMeta] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  async function loadUploadedFiles() {
    try {
      setFilesLoading(true);
      setFilesError("");

      const data = await getAllStatementFiles();
      const normalizedFiles = normalizeFilesResponse(data);
      setUploadedFiles(normalizedFiles);
    } catch (error) {
      const statusCode = error?.response?.status;

      if (statusCode === 401) {
        setFilesError("Unauthorized. Please log in again.");
      } else if (statusCode === 403) {
        setFilesError("You do not have permission to view uploaded files.");
      } else if (statusCode === 404) {
        setFilesError("Files endpoint not found. Check the frontend URL.");
      } else {
        setFilesError("Failed to load uploaded CSV files.");
      }
    } finally {
      setFilesLoading(false);
    }
  }

  function askDeleteFile(statementId) {
    const item = uploadedFiles.find((f) => getFileId(f) === statementId) || null;
    setDeleteError("");
    setFileToDelete(item);
  }

  function closeDeleteModal() {
    if (deletingId) return;
    setFileToDelete(null);
    setDeleteError("");
  }

  async function confirmDeleteFile() {
    if (!fileToDelete) return;

    const statementId = getFileId(fileToDelete);
    if (!statementId) {
      setDeleteError("Could not determine which file to delete.");
      return;
    }

    try {
      setDeletingId(statementId);
      setDeleteError("");

      await deleteStatementFile(statementId);

      setUploadedFiles((prev) =>
        prev.filter((item) => getFileId(item) !== statementId)
      );

      setFileToDelete(null);
    } catch (error) {
      console.error("Failed to delete file:", error);
      setDeleteError("Failed to delete CSV file.");
    } finally {
      setDeletingId(null);
    }
  }

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
        await loadUploadedFiles();
        return;
      }

      const list = [];

      if (result.status === 401) {
        list.push("Your session expired. Please log in again.");
      } else if (result.status === 403) {
        list.push("You do not have permission to upload statements.");
      } else if (result.status === 400) {
        list.push(
          "We could not process this file. Please check the CSV format and try again."
        );
      } else if (typeof result.status === "number" && result.status >= 500) {
        list.push(
          "Something went wrong while processing the upload. Please try again later."
        );
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
    } catch (error) {
      console.error("Upload failed:", error);
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

  function getStatusLabel() {
    if (status === STATUS.IDLE) return "Waiting";
    if (status === STATUS.READY) return "Ready";
    if (status === STATUS.UPLOADING) return "Uploading";
    if (status === STATUS.SUCCESS) return "Completed";
    if (status === STATUS.ERROR) return "Failed";
    return "Waiting";
  }

  return (
    <main className="uploadPageShell">
      <div className="uploadPageContainer">
        <section className="uploadHero">
          <div className="uploadHeroCard">
            <span className="uploadBadge">Statement import workspace</span>
            <h1 className="uploadHeroTitle">Upload Statements</h1>
            <p className="uploadHeroText">
              Upload supported bank CSV files to import transactions into
              MoneyMap. This page helps you bring statement data into the app,
              review processing feedback, and manage uploaded files in one place.
            </p>
          </div>

          <div className="uploadHeroSide">
            <div className="uploadMiniCard uploadMiniCardInfo">
              <div className="uploadMiniIcon uploadMiniIconBlue">
                <Upload size={16} />
              </div>
              <div>
                <h3>Supported input</h3>
                <p>
                  Upload CSV files exported from supported banks and statement
                  providers.
                </p>
              </div>
            </div>

            <div className="uploadMiniCard uploadMiniCardInfo">
              <div className="uploadMiniIcon uploadMiniIconGreen">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3>What happens after upload</h3>
                <p>
                  Transactions are parsed and prepared for categories, budgets,
                  insights, and rules across the app.
                </p>
              </div>
            </div>

            <div className="uploadMiniCard uploadMiniCardInfo">
              <div className="uploadMiniIcon uploadMiniIconPurple">
                <Database size={16} />
              </div>
              <div>
                <h3>File management</h3>
                <p>
                  Review previously uploaded CSV files and remove old statement
                  files when needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="uploadMainGrid">
          <section>
            <div className="uploadMainCard">
              <div className="uploadCardHeader">
                <h2 className="uploadCardTitle">Upload Bank Statement</h2>
                <p className="uploadCardText">
                  Choose a CSV file exported from your bank. Once uploaded, the
                  page will show processing status, import counts, and any
                  warnings returned by the backend.
                </p>
              </div>

              <div className="uploadCardBody">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  onChange={onFileChange}
                  disabled={status === STATUS.UPLOADING}
                  style={{ display: "none" }}
                />

                <div className={`uploadDropzone ${file ? "isReady" : ""}`}>
                  <div className="uploadDropzoneTop">
                    <div>
                      <h3 className="uploadDropzoneTitle">Select CSV File</h3>
                      <p className="uploadDropzoneSub">
                        Supported format: <strong>.csv</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="uploadPrimaryBtn"
                      onClick={() => inputRef.current?.click()}
                      disabled={status === STATUS.UPLOADING}
                    >
                      Choose File
                    </button>
                  </div>

                  <div className="uploadSelectedFile">
                    {file ? (
                      <div className="uploadSelectedFileRow">
                        <div className="uploadFileInfo">
                          <div className="uploadFileIconWrap">
                            <FileText size={18} />
                          </div>

                          <div>
                            <p className="uploadFileName">{file.name}</p>
                            <p className="uploadFileMeta">
                              File size: {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="uploadReadyPill">Ready to upload</div>
                      </div>
                    ) : (
                      <div className="uploadSelectedFileRow">
                        <div className="uploadFileInfo">
                          <div className="uploadFileIconWrap">
                            <FileText size={18} />
                          </div>

                          <div>
                            <p className="uploadFileName">No file selected yet</p>
                            <p className="uploadFileMeta">
                              Choose a bank CSV file to begin.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="uploadActionRow">
                    <button
                      type="button"
                      className="uploadPrimaryBtn"
                      onClick={handleUpload}
                      disabled={!canUpload}
                    >
                      {status === STATUS.UPLOADING ? "Uploading..." : "Upload CSV"}
                    </button>

                    <button
                      type="button"
                      className="uploadSecondaryBtn"
                      onClick={reset}
                      disabled={status === STATUS.UPLOADING}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="uploadBannerWrap">
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
                  <div className="uploadSummaryCard">
                    <div className="uploadCardHeader">
                      <h3 className="uploadCardTitle">Import Summary</h3>
                      <p className="uploadCardText">
                        Overview of the processed statement file.
                      </p>
                    </div>

                    <div className="uploadCardBody">
                      <div className="uploadSummaryGrid">
                        <div className="uploadMetricCard blue">
                          <div className="uploadMetricLabel">Total Rows</div>
                          <div className="uploadMetricValue">{total ?? "—"}</div>
                        </div>

                        <div className="uploadMetricCard green">
                          <div className="uploadMetricLabel">Imported</div>
                          <div className="uploadMetricValue">
                            {imported ?? "—"}
                          </div>
                        </div>

                        <div className="uploadMetricCard">
                          <div className="uploadMetricLabel">Skipped</div>
                          <div className="uploadMetricValue">{skipped ?? "—"}</div>
                        </div>
                      </div>

                      {total === null && imported === null && skipped === null && (
                        <div className="uploadInfoNote">
                          Upload completed, but the backend did not return
                          standard summary fields.
                        </div>
                      )}

                      {warnings && warnings.length > 0 && (
                        <div className="uploadWarningsBox">
                          <h4 className="uploadWarningsTitle">Warnings</h4>

                          <ul className="uploadWarningsList">
                            {warnings.slice(0, 5).map((w, i) => (
                              <li key={i}>
                                {typeof w === "string" ? w : JSON.stringify(w)}
                              </li>
                            ))}
                          </ul>

                          {warnings.length > 5 && (
                            <div className="uploadSideText" style={{ marginTop: 10 }}>
                              Showing first 5 warnings.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="uploadFilesCard">
                  <div className="uploadCardHeader">
                    <h3 className="uploadCardTitle">Uploaded CSV Files</h3>
                    <p className="uploadCardText">
                      Review previously uploaded statement files and delete them
                      if needed.
                    </p>
                  </div>

                  <div className="uploadFilesBody">
                    {filesLoading && (
                      <StatusBanner
                        type="info"
                        message="Loading uploaded CSV files..."
                      />
                    )}

                    {!filesLoading && filesError && (
                      <ErrorBox title="Could not load files" errors={[filesError]} />
                    )}

                    {!filesLoading && !filesError && (
                      <StatementFilesTable
                        files={uploadedFiles}
                        onDelete={askDeleteFile}
                        deletingId={deletingId}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="uploadSideColumn">
            <div className="uploadSideCard">
              <h3 className="uploadSideTitle">Upload Tips</h3>

              <ul className="uploadTipsList">
                <li>Use a CSV exported directly from your bank.</li>
                <li>Upload one statement file at a time.</li>
                <li>Review warnings after import for skipped rows.</li>
                <li>Keep raw exports unchanged for best parsing accuracy.</li>
              </ul>
            </div>

            <div className="uploadSideCard">
              <div className="uploadStatusLabel">Current Status</div>
              <div className="uploadStatusValue">{getStatusLabel()}</div>
              <div className="uploadStatusText">
                {file ? `Selected file: ${file.name}` : "No file selected yet."}
              </div>
            </div>

            <div className="uploadSideCard">
              <h3 className="uploadSideTitle">How this fits the app</h3>
              <p className="uploadSideText">
                Imported transactions become the foundation for your dashboard,
                spending categories, recurring detection, budgets, and analytics.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {fileToDelete && (
        <div className="confirmOverlay" onClick={closeDeleteModal}>
          <div
            className="confirmModal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="confirmIconWrap">
              <Trash2 size={20} />
            </div>

            <h3 id="delete-modal-title" className="confirmTitle">
              Delete CSV file?
            </h3>

            <p className="confirmText">
              Are you sure you want to delete{" "}
              <strong>{getFileName(fileToDelete)}</strong>?
            </p>

            {deleteError ? <div className="confirmError">{deleteError}</div> : null}

            <div className="confirmActions">
              <button
                type="button"
                className="uploadSecondaryBtn"
                onClick={closeDeleteModal}
                disabled={!!deletingId}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirmDangerBtn"
                onClick={confirmDeleteFile}
                disabled={!!deletingId}
              >
                {deletingId ? "Deleting..." : "Delete File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}