import React, { useEffect, useRef, useState } from "react";
import { FaDownload, FaHistory, FaSave, FaTrash } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";
import { countCellDiffs, summarizeSheet } from "../lib/diff";

const DocumentEditor = ({
  workspaceId,
  document,
  onClose,
  onUpdate,
  readOnly = false,
  currentUserRole = "member",
}) => {
  const [data, setData] = useState(document.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cursors, setCursors] = useState({});
  const [myCursor, setMyCursor] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [compareRevision, setCompareRevision] = useState(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const debouncedSave = (currentData) => {
    if (readOnly) return;
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await API.put(`/workspaces/${workspaceId}/documents/${document._id}`, { data: currentData });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    }, 1500);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await API.get("/auth/user");
        setCurrentUserId(res.data?._id || null);
      } catch {
        setCurrentUserId(null);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!document || !workspaceId) return;

    socket.emit("joinWorkspace", { workspaceId });

    const onCellUpdated = ({ documentId, cell, value, userId }) => {
      if (documentId === document._id && userId !== currentUserId) {
        setData((prev) => {
          const newData = [...prev];
          const [row, col] = cell.split("-").map(Number);
          if (!newData[row]) newData[row] = [];
          newData[row][col] = value;
          return newData;
        });
      }
    };

    const onCursorMoved = ({ documentId, cursor, userId }) => {
      if (documentId === document._id && userId !== currentUserId) {
        setCursors((prev) => ({ ...prev, [userId]: cursor }));
      }
    };

    socket.on("document:cellUpdated", onCellUpdated);
    socket.on("document:cursorMoved", onCursorMoved);

    return () => {
      socket.off("document:cellUpdated", onCellUpdated);
      socket.off("document:cursorMoved", onCursorMoved);
    };
  }, [document, workspaceId, currentUserId]);

  const handleCellChange = (row, col, value) => {
    if (readOnly) return;
    const newData = [...data];
    if (!newData[row]) newData[row] = [];
    newData[row][col] = value;
    setData(newData);

    if (currentUserId) {
      socket.emit("document:edit", {
        workspaceId,
        documentId: document._id,
        cell: `${row}-${col}`,
        value,
        userId: currentUserId,
      });
    }

    debouncedSave(newData);
  };

  const handleCellFocus = (row, col) => {
    if (readOnly) return;
    const cursor = { row, col };
    setMyCursor(cursor);

    if (currentUserId) {
      socket.emit("document:cursor", {
        workspaceId,
        documentId: document._id,
        cursor,
        userId: currentUserId,
      });
    }
  };

  const addRow = () => {
    if (readOnly) return;
    const newData = [...data, []];
    setData(newData);
    debouncedSave(newData);
  };

  const addColumn = () => {
    if (readOnly) return;
    const newData = data.map((row) => [...row, ""]);
    setData(newData);
    debouncedSave(newData);
  };

  const saveDocument = async () => {
    try {
      if (readOnly) return;
      setLoading(true);
      setError("");
      await API.put(`/workspaces/${workspaceId}/documents/${document._id}`, { data });
      if (onUpdate) onUpdate();
    } catch (err) {
      setError("Failed to save document");
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await API.get(
        `/workspaces/${workspaceId}/documents/${document._id}/revisions`,
      );
      setRevisions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setHistoryError(
        err.response?.data?.msg || "Failed to load document history",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const restoreRevision = async (revisionId) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await API.post(
        `/workspaces/${workspaceId}/documents/${document._id}/revisions/${revisionId}/restore`,
      );
      const restored = res.data;
      setData(restored?.data || []);
      if (onUpdate) onUpdate();
      await loadRevisions();
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to restore revision");
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateVersionStatus = async (revisionId, action) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      await API.post(
        `/workspaces/${workspaceId}/documents/${document._id}/revisions/${revisionId}/status`,
        { action },
      );
      await loadRevisions();
      if (["approve", "working"].includes(action) && onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to update version status");
    } finally {
      setHistoryLoading(false);
    }
  };

  const downloadDocument = async () => {
    try {
      const response = await API.get(
        `/workspaces/${workspaceId}/documents/${document._id}/download`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${document.name}.${document.type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download document");
      console.error("Download error:", err);
    }
  };

  const deleteDocument = async () => {
    try {
      if (readOnly) return;
      setLoading(true);
      await API.delete(`/workspaces/${workspaceId}/documents/${document._id}`);
      if (onClose) onClose();
      else if (onUpdate) onUpdate();
    } catch (err) {
      setError("Failed to delete document");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCell = (row, col) => {
    const cellId = `${row}-${col}`;
    const isMyCursor = myCursor && myCursor.row === row && myCursor.col === col;
    const otherCursors = Object.entries(cursors).filter(
      ([userId, cursor]) => cursor.row === row && cursor.col === col && userId !== "current-user",
    );

    return (
      <div
        key={cellId}
        className="relative min-h-[40px] min-w-[120px] border-b border-r border-white/10"
      >
        <input
          value={data[row]?.[col] || ""}
          onChange={(e) => handleCellChange(row, col, e.target.value)}
          onFocus={() => handleCellFocus(row, col)}
          readOnly={readOnly}
          className="h-full w-full border-none bg-cyan-500/10 px-2 py-2 text-sm text-white outline-none focus:bg-black/30"
        />
        {isMyCursor && <div className="pointer-events-none absolute inset-0 border-2 border-blue-500" />}
        {otherCursors.map(([userId]) => (
          <div key={userId} className="pointer-events-none absolute inset-0 border-2 border-red-500" />
        ))}
      </div>
    );
  };

  const isPdf = document?.type === "pdf";
  const maxCols = Math.max(...data.map((row) => row.length), 1);
  const maxRows = data.length;
  const canApproveVersions = ["admin", "owner"].includes(currentUserRole);

  return (
    <section className="max-w-full overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{document.name}</h3>
          <p className="text-xs text-white/60">
            {document.type.toUpperCase()} · {maxRows} rows × {maxCols} columns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && <span className="text-xs text-white/50">Saving...</span>}
          {saveStatus === "error" && <span className="text-xs text-red-300">Save Failed</span>}
          {saveStatus === "saved" && <span className="text-xs text-emerald-300">Saved</span>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const next = !historyOpen;
                setHistoryOpen(next);
                if (next) await loadRevisions();
              }}
              className="rounded-lg border border-white/20 bg-white/5 p-2 text-white/80 hover:bg-white/10"
              aria-label="History"
            >
              <FaHistory />
            </button>
            <button
              type="button"
              onClick={saveDocument}
              disabled={loading || saveStatus === "saving" || readOnly}
              className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 p-2 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
              aria-label="Save"
            >
              <FaSave />
            </button>
            <button
              type="button"
              onClick={downloadDocument}
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30"
              aria-label="Download"
            >
              <FaDownload />
            </button>
            <button
              type="button"
              onClick={deleteDocument}
              disabled={readOnly}
              className="rounded-lg border border-red-400/40 bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30 disabled:opacity-50"
              aria-label="Delete"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="mb-3 rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-300">{error}</div>}

      {historyOpen && (
        <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Document history</p>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="text-xs text-white/60 hover:text-white"
            >
              Close
            </button>
          </div>

          {historyError && (
            <div className="mb-2 rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-300">
              {historyError}
            </div>
          )}

          {compareRevision && (
            <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Compare to current</p>
                <button
                  type="button"
                  onClick={() => setCompareRevision(null)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Close
                </button>
              </div>

              {(() => {
                const current = summarizeSheet(data);
                const prev = summarizeSheet(compareRevision.data || []);
                const diffs = countCellDiffs(compareRevision.data || [], data);
                return (
                  <div className="space-y-2 text-sm text-white/70">
                    <p>
                      Rows: <span className="text-white">{prev.rowCount}</span> →{" "}
                      <span className="text-white">{current.rowCount}</span>
                    </p>
                    <p>
                      Columns: <span className="text-white">{prev.colCount}</span> →{" "}
                      <span className="text-white">{current.colCount}</span>
                    </p>
                    <p>
                      Cells changed:{" "}
                      {diffs.comparable ? (
                        <span className="text-white">
                          {diffs.changedCells} / {diffs.totalCells}
                        </span>
                      ) : (
                        <span className="text-white">
                          Too large to compare ({diffs.totalCells} cells)
                        </span>
                      )}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {historyLoading ? (
            <p className="text-sm text-white/60">Loading history...</p>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-white/60">No history yet.</p>
          ) : (
            <div className="space-y-2">
              {revisions.slice(0, 10).map((rev) => (
                <div
                  key={rev._id}
                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">
                      {new Date(rev.createdAt).toLocaleString()}
                    </p>
                    <p className="truncate text-xs text-white/50">
                      {rev.createdBy?.displayName || rev.createdBy?.username || "Someone"}
                    </p>
                    {rev.versionStatus && (
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-white/70">
                          {rev.versionStatus}
                        </span>
                        {rev.reviewStatus && (
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-white/60">
                            {rev.reviewStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => restoreRevision(rev._id)}
                      disabled={readOnly}
                      className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareRevision(rev)}
                      className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"
                    >
                      See Changes
                    </button>
                    {!readOnly && rev.versionStatus !== "working" && (
                      <button
                        type="button"
                        onClick={() => updateVersionStatus(rev._id, "ready")}
                        className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                      >
                        Mark Ready
                      </button>
                    )}
                    {canApproveVersions && rev.versionStatus === "ready" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateVersionStatus(rev._id, "approve")}
                          className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                        >
                          Approve (Working)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateVersionStatus(rev._id, "reject")}
                          className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isPdf && (
        <div className="mb-3 rounded-md border border-cyan-400/30 bg-cyan-500/10 p-2 text-sm text-cyan-200">
          PDF documents are view/download supported. Spreadsheet editing is available for CSV/XLSX/XLS files.
        </div>
      )}

      {!isPdf && (
        <>
          {readOnly && (
            <div className="mb-3 rounded-md border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200">
              Read-only access: you can view this spreadsheet but cannot edit it.
            </div>
          )}
          <div className="max-h-[60vh] overflow-auto">
            <div className="inline-block border border-white/10">
              <div className="flex">
                <div className="flex min-h-[40px] min-w-[40px] items-center justify-center border-b border-r border-white/10 bg-cyan-500/10" />
                {Array.from({ length: maxCols }, (_, col) => (
                  <div
                    key={`header-${col}`}
                    className="flex min-h-[40px] min-w-[120px] items-center justify-center border-b border-r border-white/10 bg-cyan-500/10 text-sm font-semibold text-white"
                  >
                    {String.fromCharCode(65 + col)}
                  </div>
                ))}
              </div>

              {Array.from({ length: maxRows }, (_, row) => (
                <div key={`row-${row}`} className="flex">
                  <div className="flex min-h-[40px] min-w-[40px] items-center justify-center border-b border-r border-white/10 bg-cyan-500/10 text-sm font-semibold text-white">
                    {row + 1}
                  </div>
                  {Array.from({ length: maxCols }, (_, col) => renderCell(row, col))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={addRow}
              disabled={readOnly}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              Add Row
            </button>
            <button
              type="button"
              onClick={addColumn}
              disabled={readOnly}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              Add Column
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default DocumentEditor;
