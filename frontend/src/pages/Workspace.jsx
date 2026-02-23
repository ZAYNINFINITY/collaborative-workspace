import React, { useEffect, useMemo, useState } from "react";
import { FaCode, FaGithub } from "react-icons/fa";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import API from "../api";
import { socket } from "../socket";
import DocumentEditor from "../components/DocumentEditor";
import ChatRoom from "../components/ChatRoom";
import UserPresence from "../components/UserPresence";
import ProgressWidget from "../components/dashboard/ProgressWidget";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import MembersWidget from "../components/dashboard/MembersWidget";
import FileUploadsWidget from "../components/dashboard/FileUploadsWidget";
import DeadlineWidget from "../components/dashboard/DeadlineWidget";
import ChatPreviewWidget from "../components/dashboard/ChatPreviewWidget";
import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/KanbanBoard";
import TeamManagement from "../components/TeamManagement";

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
  const canEditWorkspace = ["admin", "member"].includes(
    workspace?.currentUserRole,
  );

  const handleMessageSent = (message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      return [...prev, message];
    });
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
            <RouterLink
              to="/workspaces"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Back to workspaces
            </RouterLink>
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

                  {documents.length === 0 && (
                    <p className="text-sm text-white/60">
                      No documents yet. Upload CSV/XLSX/XLS for realtime collaboration or PDF
                      for storage/download.
                    </p>
                  )}

                  {selectedDocument && (
                    <div className="mt-4">
                      <DocumentEditor
                        workspaceId={workspace._id}
                        document={selectedDocument}
                        readOnly={!canEditWorkspace}
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

              {activeSection === "notes" && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-white">Notes</h2>
                  {notes.length === 0 ? (
                    <p className="text-sm text-white/60">
                      No notes yet. Use the API to create notes for this workspace.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <article
                          key={note._id}
                          className="rounded-lg border border-white/10 bg-white/5 p-3"
                        >
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
