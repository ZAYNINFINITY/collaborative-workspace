import React, { useEffect, useMemo, useState } from "react";
import { FaHistory, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";
import { countLineDiffs, summarizeText } from "../lib/diff";

const ProjectFiles = ({ workspaceId, canEdit }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [draftPath, setDraftPath] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [compareRevision, setCompareRevision] = useState(null);

  const selectedFile = useMemo(
    () => files.find((f) => f._id === selectedId) || null,
    [files, selectedId],
  );

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/workspaces/${workspaceId}/project-files`);
      const list = Array.isArray(res.data) ? res.data : [];
      setFiles(list);
      if (!selectedId && list.length) {
        setSelectedId(list[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load project files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    loadFiles();
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedFile) return;
    setDraftPath(selectedFile.path || "");
    setDraftContent(selectedFile.content || "");
    setHistoryOpen(false);
    setCompareRevision(null);
    setRevisions([]);
  }, [selectedFile?._id]);

  useEffect(() => {
    const onCreated = (payload) => {
      if (payload.workspaceId !== workspaceId) return;
      setFiles((prev) => [payload.file, ...prev]);
    };
    const onUpdated = (payload) => {
      if (payload.workspaceId !== workspaceId) return;
      setFiles((prev) => prev.map((f) => (f._id === payload.fileId ? payload.file : f)));
    };
    const onDeleted = (payload) => {
      if (payload.workspaceId !== workspaceId) return;
      setFiles((prev) => prev.filter((f) => f._id !== payload.fileId));
      if (selectedId === payload.fileId) setSelectedId(null);
    };

    socket.on("workspace:fileCreated", onCreated);
    socket.on("workspace:fileUpdated", onUpdated);
    socket.on("workspace:fileDeleted", onDeleted);
    return () => {
      socket.off("workspace:fileCreated", onCreated);
      socket.off("workspace:fileUpdated", onUpdated);
      socket.off("workspace:fileDeleted", onDeleted);
    };
  }, [workspaceId, selectedId]);

  const createFile = async () => {
    if (!canEdit) return;
    const path = draftPath.trim().replace(/^\/+/, "");
    if (!path) return;
    try {
      setSaving(true);
      const res = await API.post(`/workspaces/${workspaceId}/project-files`, {
        path,
        content: draftContent,
      });
      setFiles((prev) => [res.data, ...prev]);
      setSelectedId(res.data._id);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create file");
    } finally {
      setSaving(false);
    }
  };

  const saveFile = async () => {
    if (!canEdit || !selectedFile?._id) return;
    try {
      setSaving(true);
      setError("");
      const res = await API.put(
        `/workspaces/${workspaceId}/project-files/${selectedFile._id}`,
        {
          path: draftPath.trim().replace(/^\/+/, ""),
          content: draftContent,
        },
      );
      setFiles((prev) => prev.map((f) => (f._id === res.data._id ? res.data : f)));
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async () => {
    if (!canEdit || !selectedFile?._id) return;
    try {
      setSaving(true);
      await API.delete(`/workspaces/${workspaceId}/project-files/${selectedFile._id}`);
      setFiles((prev) => prev.filter((f) => f._id !== selectedFile._id));
      setSelectedId(null);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete file");
    } finally {
      setSaving(false);
    }
  };

  const loadRevisions = async () => {
    if (!selectedFile?._id) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await API.get(
        `/workspaces/${workspaceId}/project-files/${selectedFile._id}/revisions`,
      );
      setRevisions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const restoreRevision = async (revisionId) => {
    if (!selectedFile?._id) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await API.post(
        `/workspaces/${workspaceId}/project-files/${selectedFile._id}/revisions/${revisionId}/restore`,
      );
      setFiles((prev) => prev.map((f) => (f._id === res.data._id ? res.data : f)));
      setDraftPath(res.data.path || "");
      setDraftContent(res.data.content || "");
      await loadRevisions();
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to restore");
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
        Loading project files...
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Project Files</h3>
          <p className="text-xs text-white/55">
            Simple file versioning (history/restore/compare)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const next = !historyOpen;
              setHistoryOpen(next);
              setCompareRevision(null);
              if (next) await loadRevisions();
            }}
            disabled={!selectedFile}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            <FaHistory className="inline-block" /> History
          </button>
          <button
            type="button"
            onClick={selectedFile ? saveFile : createFile}
            disabled={!canEdit || saving}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <FaSave className="inline-block" /> {selectedFile ? "Save" : "Create"}
          </button>
          <button
            type="button"
            onClick={deleteFile}
            disabled={!canEdit || saving || !selectedFile}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            <FaTrash className="inline-block" /> Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!canEdit && (
        <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Read-only access: you can view files but cannot edit them.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-[240px,1fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-white/70">Files</p>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setDraftPath("");
                setDraftContent("");
              }}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              <FaPlus className="inline-block" /> New
            </button>
          </div>
          <div className="max-h-[60vh] space-y-1 overflow-auto pr-1">
            {files.length === 0 ? (
              <p className="p-2 text-xs text-white/50">No files yet.</p>
            ) : (
              files.map((f) => (
                <button
                  key={f._id}
                  type="button"
                  onClick={() => setSelectedId(f._id)}
                  className={`w-full truncate rounded-lg border px-2 py-2 text-left text-xs transition ${
                    f._id === selectedId
                      ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                      : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/5"
                  }`}
                  title={f.path}
                >
                  {f.path}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <label className="text-xs font-semibold text-white/70">Path</label>
            <input
              value={draftPath}
              onChange={(e) => setDraftPath(e.target.value)}
              placeholder="src/main.js"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              disabled={!canEdit && !!selectedFile}
            />
          </div>

          {historyOpen && selectedFile && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">History</p>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryOpen(false);
                    setCompareRevision(null);
                  }}
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
                <div className="mb-3 rounded-lg border border-white/10 bg-black/20 p-3">
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
                    const prev = summarizeText(compareRevision.content || "");
                    const cur = summarizeText(draftContent || "");
                    const diffs = countLineDiffs(compareRevision.content || "", draftContent || "");
                    return (
                      <div className="space-y-2 text-sm text-white/70">
                        <p>
                          Lines: <span className="text-white">{prev.lineCount}</span> →{" "}
                          <span className="text-white">{cur.lineCount}</span>
                        </p>
                        <p>
                          Chars: <span className="text-white">{prev.charCount}</span> →{" "}
                          <span className="text-white">{cur.charCount}</span>
                        </p>
                        <p>
                          Lines changed:{" "}
                          {diffs.comparable ? (
                            <span className="text-white">
                              {diffs.changedLines} / {diffs.totalLines}
                            </span>
                          ) : (
                            <span className="text-white">Too large to compare</span>
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
                      className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/80">
                          {new Date(rev.createdAt).toLocaleString()}
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {rev.createdBy?.displayName || rev.createdBy?.username || "Someone"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreRevision(rev._id)}
                          className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompareRevision(rev)}
                          className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"
                        >
                          Compare
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <label className="text-xs font-semibold text-white/70">Content</label>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={16}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 font-mono text-xs text-white outline-none"
              placeholder="// Write code here..."
              disabled={!canEdit && !!selectedFile}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectFiles;

