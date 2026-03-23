import React from "react";

function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return "—";

  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;

  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function getFileId(file) {
  return file?.statementId ?? file?.id ?? file?._id ?? null;
}

function getFileName(file) {
  return (
    file?.originalFileName ??
    file?.originalName ??
    file?.fileName ??
    file?.storedFileName ??
    file?.name ??
    "Unnamed file"
  );
}

function getFileSize(file) {
  return file?.size ?? file?.fileSize ?? null;
}

function getUploadedAt(file) {
  return file?.createdAt ?? file?.uploadedAt ?? file?.created_on ?? null;
}

export default function StatementFilesTable({
  files = [],
  onDelete,
  deletingId = null,
}) {
  if (!Array.isArray(files) || files.length === 0) {
    return (
      <div
        style={{
          marginTop: 16,
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          background: "#ffffff",
          padding: 20,
          color: "#64748b",
          fontSize: 15,
        }}
      >
        No uploaded CSV files found.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 720,
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                File Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Size
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Uploaded At
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Stored File
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "14px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  borderBottom: "1px solid #e2e8f0",
                  width: 140,
                }}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {files.map((file, index) => {
              const fileId = getFileId(file);
              const isDeleting = deletingId === fileId;

              return (
                <tr
                  key={fileId ?? index}
                  style={{
                    borderBottom:
                      index === files.length - 1 ? "none" : "1px solid #e2e8f0",
                  }}
                >
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 14,
                      color: "#0f172a",
                      fontWeight: 600,
                      verticalAlign: "middle",
                      wordBreak: "break-word",
                    }}
                  >
                    {getFileName(file)}
                  </td>

                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 14,
                      color: "#334155",
                      verticalAlign: "middle",
                    }}
                  >
                    {formatBytes(getFileSize(file))}
                  </td>

                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 14,
                      color: "#334155",
                      verticalAlign: "middle",
                    }}
                  >
                    {formatDate(getUploadedAt(file))}
                  </td>

                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 13,
                      color: "#64748b",
                      verticalAlign: "middle",
                      wordBreak: "break-word",
                    }}
                  >
                    {file?.storedFileName ?? file?.filename ?? "—"}
                  </td>

                  <td
                    style={{
                      padding: "14px 16px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => fileId != null && onDelete?.(fileId)}
                      disabled={fileId == null || isDeleting}
                      style={{
                        border: "none",
                        borderRadius: 12,
                        background:
                          fileId == null || isDeleting ? "#cbd5e1" : "#dc2626",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "10px 14px",
                        cursor:
                          fileId == null || isDeleting ? "not-allowed" : "pointer",
                      }}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}