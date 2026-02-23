import React, { useEffect, useRef, useState } from "react";
import { FaDownload, FaSave, FaTrash } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const DocumentEditor = ({
  workspaceId,
  document,
  onClose,
  onUpdate,
  readOnly = false,
}) => {
  const [data, setData] = useState(document.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cursors, setCursors] = useState({});
  const [myCursor, setMyCursor] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [currentUserId, setCurrentUserId] = useState(null);
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
