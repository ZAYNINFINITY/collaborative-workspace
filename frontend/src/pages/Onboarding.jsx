import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaClipboard, FaPlus, FaRocket, FaUsers } from "react-icons/fa";
import API from "../api";

const templates = [
  {
    id: "product",
    label: "Product Team",
    description: "Plan sprints, track tasks, and keep specs next to discussions.",
    seed: {
      taskTitle: "Define MVP scope",
      noteTitle: "Project notes",
      noteContent: "Goals:\n- ...\n\nOpen questions:\n- ...",
      message: "Welcome! Drop your updates here. @all",
    },
  },
  {
    id: "students",
    label: "Student Project",
    description: "Coordinate tasks, deadlines, and meeting notes in one place.",
    seed: {
      taskTitle: "Set milestones and deadline",
      noteTitle: "Meeting notes",
      noteContent: "Agenda:\n- ...\n\nAction items:\n- ...",
      message: "Let’s align on tasks and deadlines. @all",
    },
  },
  {
    id: "agency",
    label: "Agency Client",
    description: "Track deliverables and decisions with a clear activity log.",
    seed: {
      taskTitle: "Draft project timeline",
      noteTitle: "Client requirements",
      noteContent: "Requirements:\n- ...\n\nConstraints:\n- ...",
      message: "Client workspace created. Share files/notes here. @all",
    },
  },
];

const steps = [
  { id: "workspace", label: "Workspace" },
  { id: "invite", label: "Invite" },
  { id: "first", label: "First actions" },
  { id: "done", label: "Done" },
];

const Onboarding = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("workspace");
  const [creating, setCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [templateId, setTemplateId] = useState("product");
  const [error, setError] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || templates[0],
    [templateId],
  );

  const [inviteCode, setInviteCode] = useState("");
  const [loadingInviteCode, setLoadingInviteCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState("");

  const [taskTitle, setTaskTitle] = useState(selectedTemplate.seed.taskTitle);
  const [noteTitle, setNoteTitle] = useState(selectedTemplate.seed.noteTitle);
  const [noteContent, setNoteContent] = useState(selectedTemplate.seed.noteContent);
  const [welcomeMessage, setWelcomeMessage] = useState(selectedTemplate.seed.message);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    setTaskTitle(selectedTemplate.seed.taskTitle);
    setNoteTitle(selectedTemplate.seed.noteTitle);
    setNoteContent(selectedTemplate.seed.noteContent);
    setWelcomeMessage(selectedTemplate.seed.message);
  }, [selectedTemplate]);

  useEffect(() => {
    const saved = localStorage.getItem("collab_onboarding_v1");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.workspaceId) setWorkspaceId(parsed.workspaceId);
      if (parsed?.workspaceName) setWorkspaceName(parsed.workspaceName);
      if (parsed?.workspaceDescription) setWorkspaceDescription(parsed.workspaceDescription);
      if (parsed?.templateId) setTemplateId(parsed.templateId);
      if (parsed?.step) setStep(parsed.step);
    } catch {
      // Ignore corrupted state.
    }
  }, []);

  useEffect(() => {
    const payload = {
      step,
      workspaceId,
      workspaceName,
      workspaceDescription,
      templateId,
    };
    localStorage.setItem("collab_onboarding_v1", JSON.stringify(payload));
  }, [step, workspaceId, workspaceName, workspaceDescription, templateId]);

  useEffect(() => {
    if (!workspaceId || step !== "invite") return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingInviteCode(true);
        setInviteStatus("");
        const res = await API.get(`/workspaces/${workspaceId}/invitation-code`);
        if (!cancelled) setInviteCode(res.data?.code || "");
      } catch (err) {
        if (!cancelled) {
          setInviteStatus(err.response?.data?.msg || "Could not load invitation code.");
        }
      } finally {
        if (!cancelled) setLoadingInviteCode(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, step]);

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const createWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setError("Workspace name is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const res = await API.post("/workspaces", {
        name: workspaceName.trim(),
        description: workspaceDescription.trim(),
      });
      const id = res.data?._id;
      if (!id) {
        setError("Workspace created, but could not be opened.");
        return;
      }
      setWorkspaceId(id);
      setStep("invite");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setInviteStatus("Copy failed. Select and copy the code manually.");
    }
  };

  const sendInviteEmail = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (!workspaceId) return;

    try {
      setInviting(true);
      setInviteStatus("");
      await API.post(`/workspaces/${workspaceId}/invite`, {
        email: inviteEmail.trim(),
        role: "member",
      });
      setInviteEmail("");
      setInviteStatus("Invite sent.");
    } catch (err) {
      setInviteStatus(
        err.response?.data?.msg ||
          "Invite could not be sent (email delivery may not be configured).",
      );
    } finally {
      setInviting(false);
    }
  };

  const seedFirstActions = async () => {
    if (!workspaceId) return;
    try {
      setSeeding(true);
      setError("");

      const requests = [];
      if (welcomeMessage.trim()) {
        requests.push(
          API.post(`/workspaces/${workspaceId}/messages`, { content: welcomeMessage.trim() }),
        );
      }
      if (taskTitle.trim()) {
        requests.push(
          API.post(`/workspaces/${workspaceId}/tasks`, { title: taskTitle.trim(), status: "todo" }),
        );
      }
      if (noteContent.trim()) {
        requests.push(
          API.post(`/workspaces/${workspaceId}/notes`, {
            title: noteTitle.trim(),
            content: noteContent.trim(),
          }),
        );
      }

      await Promise.allSettled(requests);
      setStep("done");
      localStorage.setItem("collab_welcome_seen_v1", "1");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create your first items.");
    } finally {
      setSeeding(false);
    }
  };

  const goToWorkspace = () => {
    if (!workspaceId) {
      navigate("/workspaces");
      return;
    }
    localStorage.removeItem("collab_onboarding_v1");
    navigate(`/workspaces/${workspaceId}`, { replace: true });
  };

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Getting started
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Set up your first workspace
          </h1>
          <p className="mt-2 text-sm text-white/70">
            A short setup to get your team collaborating with chat, tasks, notes, and documents.
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((s, idx) => {
              const isDone = idx < currentStepIndex;
              const isActive = s.id === step;
              return (
                <div
                  key={s.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                      : isDone
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-white/55"
                  }`}
                >
                  {isDone ? <FaCheck /> : <span className="text-[10px]">{idx + 1}</span>}
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {step === "workspace" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <form onSubmit={createWorkspace} className="space-y-4">
              <div>
                <label htmlFor="ws-name" className="mb-1 block text-sm text-white/85">
                  Workspace name
                </label>
                <input
                  id="ws-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Product Team"
                  maxLength={100}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <label htmlFor="ws-desc" className="mb-1 block text-sm text-white/85">
                  Description (optional)
                </label>
                <input
                  id="ws-desc"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="What is this workspace for?"
                  maxLength={220}
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-white/85">Template</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {templates.map((t) => {
                    const isActive = t.id === templateId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplateId(t.id)}
                        className={`rounded-xl border p-4 text-left transition ${
                          isActive
                            ? "border-cyan-400/40 bg-cyan-500/10"
                            : "border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-cyan-500/5"
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{t.label}</p>
                        <p className="mt-1 text-xs text-white/60">{t.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaPlus />
                {creating ? "Creating..." : "Create workspace"}
              </button>
            </form>
          </section>
        )}

        {step === "invite" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Invite your team</h2>
                <p className="mt-1 text-sm text-white/65">
                  Share a code for fast access, or send an email invite.
                </p>
              </div>
              <FaUsers className="text-white/25" aria-hidden="true" />
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Invitation code</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={loadingInviteCode ? "Loading..." : inviteCode || ""}
                  readOnly
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={copyInviteCode}
                  disabled={!inviteCode}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaClipboard />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/55">
                Teammates can join from the Workspaces page using this code.
              </p>
            </div>

            <form onSubmit={sendInviteEmail} className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Invite by email</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {inviting ? "Sending..." : "Send"}
                </button>
              </div>
              {inviteStatus && (
                <p className={`mt-2 text-xs ${inviteStatus === "Invite sent." ? "text-emerald-200" : "text-amber-200"}`}>
                  {inviteStatus}
                </p>
              )}
            </form>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("workspace")}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep("first")}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === "first" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Create your first items</h2>
                <p className="mt-1 text-sm text-white/65">
                  These starters help your team see value instantly. You can edit or delete them later.
                </p>
              </div>
              <FaRocket className="text-white/25" aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <label htmlFor="seed-message" className="text-sm font-semibold text-white">
                  Welcome message
                </label>
                <textarea
                  id="seed-message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <label htmlFor="seed-task" className="text-sm font-semibold text-white">
                  First task title
                </label>
                <input
                  id="seed-task"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <label htmlFor="seed-note-title" className="text-sm font-semibold text-white">
                  First note
                </label>
                <input
                  id="seed-note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={6}
                  className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("invite")}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={seedFirstActions}
                disabled={seeding}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {seeding ? "Creating..." : "Finish setup"}
              </button>
            </div>
          </section>
        )}

        {step === "done" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
              <FaCheck />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">You’re ready</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/70">
              Your workspace is set up. Invite teammates anytime and start collaborating.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={goToWorkspace}
                className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Open workspace
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Go to dashboard
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Onboarding;

