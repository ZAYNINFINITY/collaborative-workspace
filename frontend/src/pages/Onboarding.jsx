import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCheck, FaClipboard, FaPlus, FaRocket, FaUsers } from "react-icons/fa";
import API from "../api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Safe localStorage wrapper — silently ignores errors (private/incognito mode,
// storage quota exceeded, etc.) so the page never crashes.
const store = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
  },
  del: (key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

const STORAGE_KEY = "collab_onboarding_v2";

// ─── Templates ────────────────────────────────────────────────────────────────
const templates = [
  {
    id: "students",
    label: "Student Project",
    description: "Assign tasks to teammates, track who did what, and never lose the latest version.",
    seed: {
      taskTitle:      "Define project scope and divide work",
      noteTitle:      "Project meeting notes",
      noteContent:    "Date: \n\nPresent:\n- \n\nAgenda:\n- \n\nAction items:\n- [ ] ",
      message:        "Workspace is live! Drop your updates and tag teammates here 👋",
    },
  },
  {
    id: "product",
    label: "Product Team",
    description: "Plan sprints, track tasks, and keep specs next to your discussions.",
    seed: {
      taskTitle:      "Define MVP scope",
      noteTitle:      "Product spec",
      noteContent:    "Goals:\n- \n\nOpen questions:\n- ",
      message:        "Welcome! Drop your updates here 🚀",
    },
  },
  {
    id: "agency",
    label: "Agency / Freelance",
    description: "Track deliverables and decisions with a clear activity log.",
    seed: {
      taskTitle:      "Draft project timeline",
      noteTitle:      "Client requirements",
      noteContent:    "Requirements:\n- \n\nConstraints:\n- ",
      message:        "Client workspace created. Share files and notes here.",
    },
  },
];

const STEPS = [
  { id: "workspace", label: "Workspace" },
  { id: "invite",    label: "Invite" },
  { id: "first",     label: "First items" },
  { id: "done",      label: "Done" },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Onboarding = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // If the user came from an invite link (set by Signup or RequireAuth),
  // remember it so we can redirect there after onboarding instead of /workspaces.
  const pendingInvite = useRef(location.state?.from || null);

  const [step,                 setStep]       = useState("workspace");
  const [workspaceId,          setWsId]       = useState("");
  const [workspaceName,        setWsName]     = useState("");
  const [workspaceDescription, setWsDesc]     = useState("");
  const [templateId,           setTemplate]   = useState("students");
  const [error,                setError]      = useState("");

  const [inviteCode,           setCode]       = useState("");
  const [loadingCode,          setLoadingCode]= useState(false);
  const [copied,               setCopied]     = useState(false);
  const [inviteEmail,          setEmail]      = useState("");
  const [inviting,             setInviting]   = useState(false);
  const [inviteStatus,         setIStatus]    = useState("");

  const [seeding,              setSeeding]    = useState(false);
  const [creating,             setCreating]   = useState(false);

  const tpl = useMemo(() => templates.find((t) => t.id === templateId) || templates[0], [templateId]);

  const [taskTitle,     setTaskTitle]     = useState(tpl.seed.taskTitle);
  const [noteTitle,     setNoteTitle]     = useState(tpl.seed.noteTitle);
  const [noteContent,   setNoteContent]   = useState(tpl.seed.noteContent);
  const [welcomeMsg,    setWelcomeMsg]    = useState(tpl.seed.message);

  // Sync seed fields when template changes
  useEffect(() => {
    setTaskTitle(tpl.seed.taskTitle);
    setNoteTitle(tpl.seed.noteTitle);
    setNoteContent(tpl.seed.noteContent);
    setWelcomeMsg(tpl.seed.message);
  }, [tpl]);

  // ── Restore progress from storage (survives accidental refresh) ────────────
  useEffect(() => {
    const saved = store.get(STORAGE_KEY);
    if (!saved) return;
    if (saved.workspaceId)   setWsId(saved.workspaceId);
    if (saved.workspaceName) setWsName(saved.workspaceName);
    if (saved.workspaceDescription) setWsDesc(saved.workspaceDescription);
    if (saved.templateId)    setTemplate(saved.templateId);
    if (saved.step)          setStep(saved.step);
    if (saved.pendingInvite) pendingInvite.current = saved.pendingInvite;
  }, []);

  // ── Persist progress ───────────────────────────────────────────────────────
  useEffect(() => {
    store.set(STORAGE_KEY, {
      step, workspaceId, workspaceName, workspaceDescription, templateId,
      pendingInvite: pendingInvite.current,
    });
  }, [step, workspaceId, workspaceName, workspaceDescription, templateId]);

  // ── Load invite code when on invite step ──────────────────────────────────
  useEffect(() => {
    if (!workspaceId || step !== "invite") return;
    let alive = true;
    (async () => {
      try {
        setLoadingCode(true);
        const res = await API.get(`/workspaces/${workspaceId}/invitation-code`);
        if (alive) setCode(res.data?.code || "");
      } catch (err) {
        if (alive) setIStatus(err.response?.data?.msg || "Could not load invitation code.");
      } finally {
        if (alive) setLoadingCode(false);
      }
    })();
    return () => { alive = false; };
  }, [workspaceId, step]);

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  // ── Step 1: Create workspace ───────────────────────────────────────────────
  const createWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) { setError("Workspace name is required."); return; }
    try {
      setCreating(true);
      setError("");
      const res = await API.post("/workspaces", {
        name:        workspaceName.trim(),
        description: workspaceDescription.trim(),
      });
      const id = res.data?._id;
      if (!id) { setError("Workspace created but could not be opened."); return; }
      setWsId(id);
      setStep("invite");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  // ── Step 2: Invite ─────────────────────────────────────────────────────────
  const copyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setIStatus("Copy failed — select and copy the code manually.");
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !workspaceId) return;
    try {
      setInviting(true);
      setIStatus("");
      await API.post(`/workspaces/${workspaceId}/invite`, {
        email: inviteEmail.trim(),
        role:  "member",
      });
      setEmail("");
      setIStatus("Invite sent ✓");
    } catch (err) {
      setIStatus(err.response?.data?.msg || "Invite could not be sent.");
    } finally {
      setInviting(false);
    }
  };

  // ── Step 3: Seed first actions ─────────────────────────────────────────────
  const seedActions = async () => {
    if (!workspaceId) return;
    try {
      setSeeding(true);
      setError("");
      await Promise.allSettled([
        welcomeMsg.trim() &&
          API.post(`/workspaces/${workspaceId}/messages`, { content: welcomeMsg.trim() }),
        taskTitle.trim() &&
          API.post(`/workspaces/${workspaceId}/tasks`, { title: taskTitle.trim(), status: "todo" }),
        noteContent.trim() &&
          API.post(`/workspaces/${workspaceId}/notes`, {
            title:   noteTitle.trim() || "Notes",
            content: noteContent.trim(),
          }),
      ].filter(Boolean));
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create starter items.");
    } finally {
      setSeeding(false);
    }
  };

  // ── Done: go to workspace or pending invite ────────────────────────────────
  const finish = (target = "workspace") => {
    store.del(STORAGE_KEY);

    // If the student was invited somewhere BEFORE signing up, take them there now.
    if (pendingInvite.current?.startsWith("/invite/")) {
      navigate(pendingInvite.current, { replace: true });
      return;
    }
    if (target === "dashboard") {
      navigate("/dashboard", { replace: true });
      return;
    }
    navigate(workspaceId ? `/workspaces/${workspaceId}` : "/workspaces", { replace: true });
  };

  // ── Shared input classes ───────────────────────────────────────────────────
  const inputCls =
    "w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30";

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Getting started
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Set up your workspace
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Takes about 2 minutes. A workspace = your project. Create one, invite your
            group, assign tasks.
          </p>
        </header>

        {/* Progress steps */}
        <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          {STEPS.map((s, idx) => {
            const done   = idx < currentIndex;
            const active = s.id === step;
            return (
              <div
                key={s.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                    : done
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/40"
                }`}
              >
                {done ? <FaCheck /> : <span className="text-[10px]">{idx + 1}</span>}
                {s.label}
              </div>
            );
          })}
        </nav>

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── Step 1: workspace ── */}
        {step === "workspace" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <form onSubmit={createWorkspace} className="space-y-4">
              <div>
                <label htmlFor="ws-name" className="mb-1 block text-sm text-white/85">
                  Workspace name{" "}
                  <span className="text-white/40 text-xs">(e.g. "FYP Group 2025")</span>
                </label>
                <input
                  id="ws-name"
                  value={workspaceName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="My Project"
                  maxLength={100}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="ws-desc" className="mb-1 block text-sm text-white/85">
                  Description <span className="text-white/40 text-xs">(optional)</span>
                </label>
                <input
                  id="ws-desc"
                  value={workspaceDescription}
                  onChange={(e) => setWsDesc(e.target.value)}
                  placeholder="What is this project about?"
                  maxLength={220}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-white/85">Pick a template</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        t.id === templateId
                          ? "border-cyan-400/40 bg-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-cyan-500/5"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{t.label}</p>
                      <p className="mt-1 text-xs text-white/55">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
              >
                <FaPlus />
                {creating ? "Creating…" : "Create workspace"}
              </button>
            </form>
          </section>
        )}

        {/* ── Step 2: invite ── */}
        {step === "invite" && (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Invite your group</h2>
                <p className="mt-1 text-sm text-white/60">
                  Share the code on WhatsApp — it's the fastest way for teammates to join.
                </p>
              </div>
              <FaUsers className="mt-1 shrink-0 text-white/20" />
            </div>

            {/* Invite code — hero element */}
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                Share this code with your group
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex-1 rounded-lg border border-white/15 bg-black/30 px-4 py-3 font-mono text-2xl font-bold tracking-widest text-white select-all">
                  {loadingCode ? "···" : inviteCode || "—"}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  disabled={!inviteCode}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
                  title="Copy code"
                >
                  {copied ? <FaCheck className="text-emerald-400" /> : <FaClipboard />}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Teammates enter this code on the Workspaces page to join instantly.
              </p>
            </div>

            {/* Email invite */}
            <form
              onSubmit={sendInvite}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <p className="text-sm font-semibold text-white">Or invite by email</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {inviting ? "Sending…" : "Send"}
                </button>
              </div>
              {inviteStatus && (
                <p className={`mt-2 text-xs ${inviteStatus.includes("✓") ? "text-emerald-300" : "text-amber-200"}`}>
                  {inviteStatus}
                </p>
              )}
            </form>

            <div className="flex justify-between gap-2">
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

        {/* ── Step 3: first items ── */}
        {step === "first" && (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Create your first items</h2>
                <p className="mt-1 text-sm text-white/60">
                  These help your team see the tool's value immediately. You can edit or delete them anytime.
                </p>
              </div>
              <FaRocket className="mt-1 shrink-0 text-white/20" />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <label htmlFor="seed-msg" className="text-sm font-semibold text-white">
                Welcome message
              </label>
              <textarea
                id="seed-msg"
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                rows={2}
                className={`${inputCls} mt-2 resize-none`}
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <label htmlFor="seed-task" className="text-sm font-semibold text-white">
                First task
              </label>
              <input
                id="seed-task"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className={`${inputCls} mt-2`}
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
                className={`${inputCls} mt-2`}
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
                className={`${inputCls} mt-2 resize-none`}
              />
            </div>

            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep("invite")}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={seedActions}
                disabled={seeding}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {seeding ? "Creating…" : "Finish setup →"}
              </button>
            </div>
          </section>
        )}

        {/* ── Step 4: done ── */}
        {step === "done" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-300">
              <FaCheck />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">You're all set!</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
              {pendingInvite.current?.startsWith("/invite/")
                ? "Your workspace is ready. You also have a pending invitation to accept."
                : "Your workspace is live. Share the invite code with your group and start collaborating."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {pendingInvite.current?.startsWith("/invite/") && (
                <button
                  type="button"
                  onClick={() => finish("invite")}
                  className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
                >
                  Accept pending invitation
                </button>
              )}
              <button
                type="button"
                onClick={() => finish("workspace")}
                className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                Open workspace
              </button>
              <button
                type="button"
                onClick={() => finish("dashboard")}
                className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
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
