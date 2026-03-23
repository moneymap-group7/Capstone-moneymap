import { useEffect, useState } from "react";
import {
  getAllStatementFiles,
  deleteStatementFile,
} from "../services/statementsAdminService";
import StatementFilesTable from "../components/StatementFilesTable";

export default function StatementFilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllStatementFiles();
      setFiles(data);
    } catch (err) {
      setError("Failed to load uploaded CSV files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (statementId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this CSV file?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(statementId);
      await deleteStatementFile(statementId);
      setFiles((prev) =>
        prev.filter((item) => item.statementId !== statementId)
      );
    } catch (err) {
      alert("Failed to delete CSV file.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2>Uploaded CSV Files</h2>

      {loading && <p>Loading uploaded CSV files...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <StatementFilesTable
          files={files}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}