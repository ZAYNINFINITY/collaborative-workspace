import React, { useEffect, useMemo, useState } from "react";
import { FaCode, FaEdit, FaGithub, FaHistory, FaTrash } from "react-icons/fa";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import API from "../api";
import { socket } from "../socket";
import DocumentEditor from "../components/DocumentEditor";
import ChatRoom from "../components/ChatRoom";
import UserPresence from "../components/UserPresence";
import ProjectFiles from "../components/ProjectFiles";
import ProgressWidget from "../components/dashboard/ProgressWidget";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import MembersWidget from "../components/dashboard/MembersWidget";
import FileUploadsWidget from "../components/dashboard/FileUploadsWidget";
import DeadlineWidget from "../components/dashboard/DeadlineWidget";
import ChatPreviewWidget from "../components/dashboard/ChatPreviewWidget";
import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/KanbanBoard";
import TeamManagement from "../components/TeamManagement";
import CommentsThread from "../components/CommentsThread";
import { diffFields } from "../lib/diff";

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [filesTab, setFilesTab] = useState("documents");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notesError, setNotesError] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteHistoryOpen, setNoteHistoryOpen] = useState(false);
  const [noteHistoryLoading, setNoteHistoryLoading] = useState(false);
  const [noteHistoryError, setNoteHistoryError] = useState("");
  const [noteRevisions, setNoteRevisions] = useState([]);
  const [compareNoteRevision, setCompareNoteRevision] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [workingVersions, setWorkingVersions] = useState(null);
  const [documentViewMode, setDocumentViewMode] = useState("draft");

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get(`/workspaces/${id}`);
        if (!mounted) return;

        setWorkspace(res.data.workspace);
        setNotes(res.data.notes || []);
        setTasks(res.data.tasks || []);
        setMessages(res.data.messages || []);
        setDocuments(res.data.documents || []);
        setWorkingVersions(null);

        // Best-effort: fetch "working versions" snapshot used as the default stable view.
        API.get(`/workspaces/${id}/working-versions`)
          .then((workingRes) => {
            if (!mounted) return;
            setWorkingVersions(workingRes.data || null);
          })
          .catch(() => {
            if (!mounted) return;
            setWorkingVersions(null);
          });

        if (!selectedDocumentId && res.data.documents?.length) {
          setSelectedDocumentId(res.data.documents[0]._id);
        }
      } catch (err) {
        if (!mounted) return;

        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (err.response?.status === 403 || err.response?.status === 404) {
          setError(err.response?.data?.msg || "Unable to load workspace.");
        } else {
          setError("Failed to load workspace. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWorkspace();

    socket.emit("joinWorkspace", { workspaceId: id });

    socket.on("message:new", (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("workspace:documentCreated", (data) => {
      if (data.workspaceId === id) {
        setDocuments((prev) => [data.document, ...prev]);
        if (!selectedDocumentId) setSelectedDocumentId(data.document._id);
      }
    });

    socket.on("workspace:documentUpdated", (data) => {
      if (data.workspaceId === id) {
        setDocuments((prev) =>
          prev.map((doc) => (doc._id === data.documentId ? data.document : doc)),
        );
      }
    });

    socket.on("workspace:documentDeleted", (data) => {
      if (data.workspaceId === id) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== data.documentId));
        if (selectedDocumentId === data.documentId) setSelectedDocumentId(null);
      }
    });

    socket.on("document:cellUpdated", ({ documentId, cell, value }) => {
      if (selectedDocumentId === documentId) {
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc._id === documentId) {
              const newData = [...(doc.data || [])];
              const [row, col] = cell.split("-").map(Number);
              if (!newData[row]) newData[row] = [];
              newData[row][col] = value;
              return { ...doc, data: newData };
            }
            return doc;
          }),
        );
      }
    });

    socket.on("workspace:noteCreated", (data) => {
      if (data.workspaceId === id) setNotes((prev) => [data.note, ...prev]);
    });

    socket.on("workspace:noteUpdated", (data) => {
      if (data.workspaceId === id) {
        setNotes((prev) => prev.map((n) => (n._id === data.note._id ? data.note : n)));
      }
    });

    socket.on("workspace:noteDeleted", (data) => {
      if (data.workspaceId === id) {
        setNotes((prev) => prev.filter((n) => n._id !== data.noteId));
      }
    });

    return () => {
      mounted = false;
      socket.emit("leaveWorkspace", { workspaceId: id });
      socket.off("message:new");
      socket.off("workspace:documentCreated");
      socket.off("workspace:documentUpdated");
      socket.off("workspace:documentDeleted");
      socket.off("document:cellUpdated");
      socket.off("workspace:noteCreated");
      socket.off("workspace:noteUpdated");
      socket.off("workspace:noteDeleted");
    };
  }, [id, navigate, selectedDocumentId]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d._id === selectedDocumentId) || null,
    [documents, selectedDocumentId],
  );

  const workingByDocumentId = useMemo(() => {
    const map = new Map();
    const list = workingVersions?.documents || [];
    for (const rev of list) {
      if (rev?.document) map.set(String(rev.document), rev);
    }
    return map;
  }, [workingVersions]);

  const workingByFileId = useMemo(() => {
    const map = new Map();
    const list = workingVersions?.files || [];
    for (const rev of list) {
      if (rev?.file) map.set(String(rev.file), rev);
    }
    return map;
  }, [workingVersions]);

  const workingDocumentRevision = selectedDocumentId
    ? workingByDocumentId.get(String(selectedDocumentId))
    : null;

  useEffect(() => {
    if (!selectedDocumentId) return;
    setDocumentViewMode(workingDocumentRevision ? "working" : "draft");
  }, [selectedDocumentId, workingDocumentRevision]);

  const displayedDocument = useMemo(() => {
    if (!selectedDocument) return null;
    if (documentViewMode !== "working" || !workingDocumentRevision) return selectedDocument;

    return {
      ...selectedDocument,
      name: workingDocumentRevision.name || selectedDocument.name,
      type: workingDocumentRevision.type || selectedDocument.type,
      data: workingDocumentRevision.data ?? selectedDocument.data,
      mimeType: workingDocumentRevision.mimeType ?? selectedDocument.mimeType,
    };
  }, [selectedDocument, documentViewMode, workingDocumentRevision]);
  const canEditWorkspace = ["admin", "owner", "member"].includes(
    workspace?.currentUserRole,
  );

  const handleMessageSent = (message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      return [...prev, message];
    });
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!canEditWorkspace || !workspace?._id) return;
    if (!noteContent.trim()) {
      setNotesError("Note content is required.");
      return;
    }

    try {
      setCreatingNote(true);
      setNotesError("");
      const res = await API.post(`/workspaces/${workspace._id}/notes`, {
        title: noteTitle.trim(),
        content: noteContent.trim(),
      });
      setNotes((prev) => [res.data, ...prev]);
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      setNotesError(err.response?.data?.msg || "Failed to create note.");
    } finally {
      setCreatingNote(false);
    }
  };

  const openEditNote = (note) => {
    if (!note) return;
    setSelectedNote(note);
    setEditNoteOpen(true);
    setNoteHistoryOpen(false);
    setNoteHistoryError("");
    setNoteRevisions([]);
    setCompareNoteRevision(null);
  };

  const handleSaveNote = async () => {
    if (!canEditWorkspace || !workspace?._id || !selectedNote?._id) return;
    if (!selectedNote.content?.trim()) {
      setNotesError("Note content is required.");
      return;
    }

    try {
      setNotesError("");
      const res = await API.put(
        `/workspaces/${workspace._id}/notes/${selectedNote._id}`,
        {
          title: selectedNote.title || "",
          content: selectedNote.content,
        },
      );
      setNotes((prev) => prev.map((n) => (n._id === res.data._id ? res.data : n)));
      setEditNoteOpen(false);
      setSelectedNote(null);
      setNoteHistoryOpen(false);
      setCompareNoteRevision(null);
    } catch (err) {
      setNotesError(err.response?.data?.msg || "Failed to update note.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!canEditWorkspace || !workspace?._id || !noteId) return;
    try {
      await API.delete(`/workspaces/${workspace._id}/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (selectedNote?._id === noteId) {
        setEditNoteOpen(false);
        setSelectedNote(null);
        setNoteHistoryOpen(false);
      }
    } catch (err) {
      setNotesError(err.response?.data?.msg || "Failed to delete note.");
    }
  };

  const loadNoteHistory = async (noteId) => {
    if (!workspace?._id || !noteId) return;
    try {
      setNoteHistoryLoading(true);
      setNoteHistoryError("");
      const res = await API.get(
        `/workspaces/${workspace._id}/notes/${noteId}/revisions`,
      );
      setNoteRevisions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setNoteHistoryError(err.response?.data?.msg || "Failed to load note history");
    } finally {
      setNoteHistoryLoading(false);
    }
  };

  const restoreNoteRevision = async (noteId, revisionId) => {
    if (!workspace?._id || !noteId || !revisionId) return;
    try {
      setNoteHistoryLoading(true);
      setNoteHistoryError("");
      const res = await API.post(
        `/workspaces/${workspace._id}/notes/${noteId}/revisions/${revisionId}/restore`,
      );
      setNotes((prev) => prev.map((n) => (n._id === res.data._id ? res.data : n)));
      setSelectedNote(res.data);
      await loadNoteHistory(noteId);
    } catch (err) {
      setNoteHistoryError(err.response?.data?.msg || "Failed to restore revision");
    } finally {
      setNoteHistoryLoading(false);
    }
  };

  const updateNoteVersionStatus = async (noteId, revisionId, action) => {
    if (!workspace?._id || !noteId || !revisionId) return;
    try {
      setNoteHistoryLoading(true);
      setNoteHistoryError("");
      await API.post(
        `/workspaces/${workspace._id}/notes/${noteId}/revisions/${revisionId}/status`,
        { action },
      );
      await loadNoteHistory(noteId);
      if (["approve", "working"].includes(action)) {
        const refreshed = await API.get(`/workspaces/${workspace._id}`);
        setNotes(refreshed.data.notes || []);
      }
    } catch (err) {
      setNoteHistoryError(err.response?.data?.msg || "Failed to update version status");
    } finally {
      setNoteHistoryLoading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!canEditWorkspace || !workspace?._id) return;
    if (!documentFile) {
      setDocumentError("Please choose a file.");
      return;
    }

    const ext = (documentFile.name.split(".").pop() || "").toLowerCase();
    const supported = ["csv", "xlsx", "xls", "pdf"];
    if (!supported.includes(ext)) {
      setDocumentError("Only CSV, XLSX, XLS, or PDF files are supported.");
      return;
    }

    try {
      setUploadingDocument(true);
      setDocumentError("");
      const formData = new FormData();
      formData.append("file", documentFile);
      formData.append(
        "name",
        (documentName || documentFile.name.replace(/\.[^/.]+$/, "")).trim(),
      );
      formData.append("type", ext);

      const res = await API.post(
        `/workspaces/${workspace._id}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setDocuments((prev) => [res.data, ...prev]);
      setSelectedDocumentId(res.data._id);
      setDocumentName("");
      setDocumentFile(null);
    } catch (err) {
      setDocumentError(err.response?.data?.msg || "Failed to upload document.");
    } finally {
      setUploadingDocument(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">{workspace?.name || "Workspace"}</h1>
              {workspace?.description && (
                <p className="mt-1 text-sm text-white/70">{workspace.description}</p>
              )}
              {workspace?.currentUserRole && (
                <span className="mt-2 inline-block rounded-md bg-cyan-500/20 px-2 py-1 text-xs uppercase tracking-wide text-cyan-200">
                  {workspace.currentUserRole}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <RouterLink
                to={`/workspaces/${id}/analytics`}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Analytics
              </RouterLink>
              <RouterLink
                to="/workspaces"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Back to workspaces
              </RouterLink>
            </div>
          </div>
        </header>

        {loading && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Loading workspace...
          </section>
        )}

        {!loading && error && (
          <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && workspace && (
          <div className="flex items-start gap-6">
            <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

            <section className="flex-1 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-6">
              {activeSection === "overview" && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h2 className="text-base font-semibold text-white">Project Overview</h2>
                    <p className="mt-2 text-sm text-white/70">
                      {workspace.description || "No description provided."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-cyan-500/20 px-2 py-1 text-cyan-200">
                        Created {new Date(workspace.createdAt).toLocaleDateString()}
                      </span>
                      {workspace.deadline && (
                        <span className="rounded-md bg-amber-500/20 px-2 py-1 text-amber-200">
                          Deadline {new Date(workspace.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <DeadlineWidget deadline={workspace.deadline} loading={loading} />
                    <ProgressWidget tasks={tasks} loading={loading} />
                    <MembersWidget members={workspace.members || []} loading={loading} />
                    <ActivityFeed workspaceId={workspace._id} loading={loading} />
                    <FileUploadsWidget documents={documents} loading={loading} />
                    <ChatPreviewWidget messages={messages} loading={loading} />
                  </div>
                </div>
              )}

              {activeSection === "chat" && (
                <div className="space-y-6">
                  <UserPresence workspaceId={workspace._id} />
                  <ChatRoom
                    workspaceId={workspace._id}
                    messages={messages}
                    onMessageSent={handleMessageSent}
                    canEdit={canEditWorkspace}
                  />
                </div>
              )}

              {activeSection === "tasks" && (
                <KanbanBoard
                  workspaceId={workspace._id}
                  tasks={tasks}
                  canEdit={canEditWorkspace}
                  currentUserRole={workspace.currentUserRole}
                  onTaskUpdate={(updatedTask) => {
                    if (updatedTask.deleted) {
                      setTasks((prev) => prev.filter((t) => t._id !== updatedTask._id));
                    } else {
                      setTasks((prev) =>
                        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
                      );
                    }
                  }}
                />
              )}

              {activeSection === "files" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilesTab("documents")}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        filesTab === "documents"
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilesTab("project")}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        filesTab === "project"
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Project Files
                    </button>
                  </div>

                  {filesTab === "documents" && (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-white">Documents</h2>
                        {documents.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {documents.map((doc) => (
                              <button
                                key={doc._id}
                                type="button"
                                onClick={() => setSelectedDocumentId(doc._id)}
                                className={`rounded-md px-2 py-1 text-xs ${
                                  doc._id === selectedDocumentId
                                    ? "bg-cyan-500 text-black"
                                    : "bg-white/10 text-white/80 hover:bg-white/20"
                                }`}
                              >
                                {doc.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {canEditWorkspace && (
                        <form onSubmit={handleDocumentUpload} className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="grid gap-2 md:grid-cols-3">
                            <input
                              type="text"
                              value={documentName}
                              onChange={(e) => setDocumentName(e.target.value)}
                              placeholder="Document name (optional)"
                              className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                            />
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls,.pdf"
                              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                              className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                            />
                            <button
                              type="submit"
                              disabled={uploadingDocument}
                              className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-50"
                            >
                              {uploadingDocument ? "Uploading..." : "Upload Document"}
                            </button>
                          </div>
                          {documentError && (
                            <p className="mt-2 text-xs text-red-300">{documentError}</p>
                          )}
                        </form>
                      )}

                      {!canEditWorkspace && (
                        <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                          Read-only access: you can view/download documents but cannot upload new files.
                        </p>
                      )}

                      {documents.length === 0 && (
                        <p className="text-sm text-white/60">
                          No documents yet. Upload CSV/XLSX/XLS for realtime collaboration or PDF
                          for storage/download.
                        </p>
                      )}

                      {selectedDocument && (
                        <div className="mt-4">
                          {documentViewMode === "working" && workingDocumentRevision && (
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                              <span>
                                Viewing the <strong>Working</strong> version (stable)
                              </span>
                              {canEditWorkspace && (
                                <button
                                  type="button"
                                  onClick={() => setDocumentViewMode("draft")}
                                  className="rounded-md border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-100 hover:bg-emerald-500/20"
                                >
                                  Edit Draft
                                </button>
                              )}
                            </div>
                          )}
                          <DocumentEditor
                            workspaceId={workspace._id}
                            document={displayedDocument}
                            readOnly={!canEditWorkspace || documentViewMode === "working"}
                            currentUserRole={workspace.currentUserRole}
                            onUpdate={() => {
                              API.get(`/workspaces/${workspace._id}`).then((res) => {
                                setDocuments(res.data.documents || []);
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {filesTab === "project" && (
                    <ProjectFiles
                      workspaceId={workspace._id}
                      canEdit={canEditWorkspace}
                      currentUserRole={workspace.currentUserRole}
                      workingRevisionsByFileId={workingByFileId}
                    />
                  )}
                </div>
              )}

              {activeSection === "notes" && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-white">Notes</h2>
                  {canEditWorkspace && (
                    <form onSubmit={handleCreateNote} className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Note title (optional)"
                          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                        />
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows={4}
                          placeholder="Write your note..."
                          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                        />
                        <button
                          type="submit"
                          disabled={creatingNote}
                          className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-50"
                        >
                          {creatingNote ? "Saving..." : "Add Note"}
                        </button>
                      </div>
                      {notesError && <p className="mt-2 text-xs text-red-300">{notesError}</p>}
                    </form>
                  )}

                  {!canEditWorkspace && (
                    <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      Read-only access: you can view notes but cannot create or edit them.
                    </p>
                  )}

                  {notes.length === 0 ? (
                    <p className="text-sm text-white/60">
                      No notes yet. Add your first note here to start documenting decisions.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <article
                          key={note._id}
                          className="rounded-lg border border-white/10 bg-white/5 p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {note.title && (
                                <p className="truncate text-sm font-semibold text-white">
                                  {note.title}
                                </p>
                              )}
                            </div>
                            {canEditWorkspace && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditNote(note)}
                                  className="rounded-md border border-white/15 bg-white/5 p-2 text-white/70 hover:bg-white/10"
                                  aria-label="Edit note"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note._id)}
                                  className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/20"
                                  aria-label="Delete note"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-white/90">{note.content}</p>
                          <p className="mt-1 text-xs text-white/50">
                            {note.author?.displayName || note.author?.username || "Unknown"} · {" "}
                            {new Date(note.updatedAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {editNoteOpen && selectedNote && (
                      <motion.div
                        className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                      >
                        <motion.div
                          className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1f] p-5"
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h4 className="text-lg font-semibold text-white">Edit Note</h4>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = !noteHistoryOpen;
                              setNoteHistoryOpen(next);
                              if (next) await loadNoteHistory(selectedNote._id);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                          >
                            <FaHistory />
                            History
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                          {noteHistoryOpen && (
                            <motion.div
                              className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-3"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                            >
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Note history</p>
                              <button
                                type="button"
                                onClick={() => setNoteHistoryOpen(false)}
                                className="text-xs text-white/60 hover:text-white"
                              >
                                Close
                              </button>
                            </div>

                            {noteHistoryError && (
                              <div className="mb-2 rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-300">
                                {noteHistoryError}
                              </div>
                            )}

                            {noteHistoryLoading ? (
                              <p className="text-sm text-white/60">Loading history...</p>
                            ) : noteRevisions.length === 0 ? (
                              <p className="text-sm text-white/60">No history yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {noteRevisions.slice(0, 10).map((rev) => (
                                  <div
                                    key={rev._id}
                                    className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-2 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm text-white/80">
                                        {new Date(rev.createdAt).toLocaleString()}
                                      </p>
                                      <p className="truncate text-xs text-white/50">
                                        {rev.createdBy?.displayName ||
                                          rev.createdBy?.username ||
                                          "Someone"}
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
                                        onClick={() => restoreNoteRevision(selectedNote._id, rev._id)}
                                        className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                                      >
                                        Go Back
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCompareNoteRevision(rev)}
                                        className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10"
                                      >
                                        See Changes
                                      </button>
                                      {canEditWorkspace && rev.versionStatus !== "working" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateNoteVersionStatus(selectedNote._id, rev._id, "ready")
                                          }
                                          className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                                        >
                                          Mark Ready
                                        </button>
                                      )}
                                      {["admin", "owner"].includes(workspace?.currentUserRole) &&
                                        rev.versionStatus === "ready" && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateNoteVersionStatus(
                                                  selectedNote._id,
                                                  rev._id,
                                                  "approve",
                                                )
                                              }
                                              className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                                            >
                                              Approve (Working)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateNoteVersionStatus(
                                                  selectedNote._id,
                                                  rev._id,
                                                  "reject",
                                                )
                                              }
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
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {compareNoteRevision && (
                          <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Compare to current</p>
                              <button
                                type="button"
                                onClick={() => setCompareNoteRevision(null)}
                                className="text-xs text-white/60 hover:text-white"
                              >
                                Close
                              </button>
                            </div>
                            <div className="space-y-2 text-sm text-white/70">
                              {diffFields(compareNoteRevision, selectedNote, [
                                "title",
                                "content",
                              ])
                                .filter((row) => row.changed)
                                .map((row) => (
                                  <div
                                    key={row.field}
                                    className="rounded-md border border-white/10 bg-black/20 p-2"
                                  >
                                    <p className="text-xs uppercase tracking-wide text-white/50">{row.field}</p>
                                    <p className="text-xs text-white/60">
                                      Before:
                                    </p>
                                    <pre className="max-h-40 overflow-auto rounded bg-black/30 p-2 text-xs text-white/70">
                                      {String(row.before ?? "")}
                                    </pre>
                                    <p className="mt-2 text-xs text-white/60">After:</p>
                                    <pre className="max-h-40 overflow-auto rounded bg-black/30 p-2 text-xs text-white/70">
                                      {String(row.after ?? "")}
                                    </pre>
                                  </div>
                                ))}
                              {diffFields(compareNoteRevision, selectedNote, ["title", "content"]).every(
                                (r) => !r.changed,
                              ) && <p className="text-sm text-white/60">No differences detected.</p>}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <input
                            value={selectedNote.title || ""}
                            onChange={(e) =>
                              setSelectedNote((prev) => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="Title (optional)"
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                          />
                          <textarea
                            value={selectedNote.content || ""}
                            onChange={(e) =>
                              setSelectedNote((prev) => ({ ...prev, content: e.target.value }))
                            }
                            rows={5}
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                          />
                        </div>

                        <CommentsThread
                          workspaceId={workspace._id}
                          entityType="note"
                          entityId={selectedNote._id}
                          currentUserRole={workspace.currentUserRole}
                        />

                        {notesError && <p className="mt-2 text-xs text-red-300">{notesError}</p>}

                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditNoteOpen(false);
                              setSelectedNote(null);
                              setNoteHistoryOpen(false);
                              setCompareNoteRevision(null);
                            }}
                            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveNote}
                            className="rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-200"
                          >
                            Save Changes
                          </button>
                        </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeSection === "activity" && (
                <ActivityFeed workspaceId={workspace._id} loading={false} />
              )}

              {activeSection === "team" && (
                <TeamManagement
                  workspaceId={workspace._id}
                  currentUserRole={workspace.currentUserRole}
                  onUpdate={() => {
                    API.get(`/workspaces/${workspace._id}`).then((res) => {
                      setWorkspace(res.data.workspace);
                    });
                  }}
                />
              )}

              {activeSection === "code" && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-6">
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <FaCode size={42} className="text-white/40" />
                    <h2 className="text-lg font-semibold text-white/80">Code Collaboration</h2>
                    <p className="max-w-xl text-sm text-white/60">
                      Advanced coding features will be available in Phase 3. For now, connect
                      GitHub repositories from the Repositories page.
                    </p>
                    <RouterLink
                      to="/repos"
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                    >
                      <FaGithub />
                      View Repositories
                    </RouterLink>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default Workspace;
