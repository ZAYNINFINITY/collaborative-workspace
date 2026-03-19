import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaComment,
  FaEdit,
  FaHistory,
  FaPaperclip,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";
import { diffFields } from "../lib/diff";

const initialTaskForm = {
  title: "",
  description: "",
  priority: "medium",
  assignee: "",
  deadline: "",
};

const KanbanBoard = ({
  workspaceId,
  tasks,
  onTaskUpdate,
  canEdit = true,
  currentUserRole = "member",
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState(initialTaskForm);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [members, setMembers] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [compareRevision, setCompareRevision] = useState(null);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const res = await API.get(`/workspaces/${workspaceId}`);
        setMembers(res.data.workspace.members || []);
      } catch {
        setMembers([]);
      }
    };

    fetchWorkspaceData();

    const onTaskUpdated = (data) => {
      if (data.workspaceId === workspaceId) onTaskUpdate(data.task);
    };
    const onTaskCreated = (data) => {
      if (data.workspaceId === workspaceId) onTaskUpdate(data.task);
    };
    const onTaskDeleted = (data) => {
      if (data.workspaceId === workspaceId) {
        onTaskUpdate({ _id: data.taskId, deleted: true });
      }
    };

    socket.on("workspace:taskUpdated", onTaskUpdated);
    socket.on("workspace:taskCreated", onTaskCreated);
    socket.on("workspace:taskDeleted", onTaskDeleted);

    return () => {
      socket.off("workspace:taskUpdated", onTaskUpdated);
      socket.off("workspace:taskCreated", onTaskCreated);
      socket.off("workspace:taskDeleted", onTaskDeleted);
    };
  }, [workspaceId, onTaskUpdate]);

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo").sort((a, b) => a.order - b.order),
      in_progress: tasks
        .filter((t) => t.status === "in_progress")
        .sort((a, b) => a.order - b.order),
      done: tasks.filter((t) => t.status === "done").sort((a, b) => a.order - b.order),
    }),
    [tasks],
  );

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "high":
        return "border-red-400/30 bg-red-500/20 text-red-200";
      case "medium":
        return "border-amber-400/30 bg-amber-500/20 text-amber-200";
      case "low":
        return "border-emerald-400/30 bg-emerald-500/20 text-emerald-200";
      default:
        return "border-cyan-400/30 bg-cyan-500/20 text-cyan-200";
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: "Overdue", className: "bg-red-500/20 text-red-200" };
    if (daysLeft === 0) return { label: "Today", className: "bg-amber-500/20 text-amber-200" };
    if (daysLeft <= 3) return { label: "Urgent", className: "bg-orange-500/20 text-orange-200" };
    return null;
  };

  const handleDragEnd = async (result) => {
    if (!canEdit) return;
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((t) => t._id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    const newOrder = destination.index;

    try {
      await API.put(`/workspaces/${workspaceId}/tasks/${task._id}`, {
        status: newStatus,
        order: newOrder,
      });
      onTaskUpdate({ ...task, status: newStatus, order: newOrder });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleCreateTask = async () => {
    if (!canEdit) return;
    if (!newTask.title.trim()) return;
    try {
      const res = await API.post(`/workspaces/${workspaceId}/tasks`, {
        title: newTask.title.trim(),
        description: newTask.description,
        priority: newTask.priority,
        assignee: newTask.assignee || null,
        deadline: newTask.deadline || null,
      });
      onTaskUpdate(res.data);
      setNewTask(initialTaskForm);
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleEditTask = async () => {
    if (!canEdit) return;
    if (!selectedTask) return;

    try {
      const res = await API.put(`/workspaces/${workspaceId}/tasks/${selectedTask._id}`, {
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        assignee: selectedTask.assignee?._id || selectedTask.assignee || null,
        deadline: selectedTask.deadline || null,
      });
      onTaskUpdate(res.data);
      setEditOpen(false);
      setSelectedTask(null);
      setHistoryOpen(false);
      setRevisions([]);
      setCompareRevision(null);
    } catch (err) {
      console.error("Failed to edit task:", err);
    }
  };

  const loadTaskHistory = async (taskId) => {
    if (!taskId) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await API.get(`/workspaces/${workspaceId}/tasks/${taskId}/revisions`);
      setRevisions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to load task history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const restoreTaskRevision = async (taskId, revisionId) => {
    if (!taskId || !revisionId) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await API.post(
        `/workspaces/${workspaceId}/tasks/${taskId}/revisions/${revisionId}/restore`,
      );
      onTaskUpdate(res.data);
      setSelectedTask(res.data);
      await loadTaskHistory(taskId);
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to restore revision");
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateVersionStatus = async (taskId, revisionId, action) => {
    if (!taskId || !revisionId) return;
    try {
      setHistoryLoading(true);
      setHistoryError("");
      await API.post(
        `/workspaces/${workspaceId}/tasks/${taskId}/revisions/${revisionId}/status`,
        { action },
      );
      await loadTaskHistory(taskId);
    } catch (err) {
      setHistoryError(err.response?.data?.msg || "Failed to update version status");
    } finally {
      setHistoryLoading(false);
    }
  };

  const canApproveVersions = ["admin", "owner"].includes(currentUserRole);

  const handleDeleteTask = async (taskId) => {
    if (!canEdit) return;
    try {
      await API.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
      onTaskUpdate({ _id: taskId, deleted: true });
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const TaskCard = ({ task, index }) => {
    const deadlineStatus = getDeadlineStatus(task.deadline);
    const isExpanded = expandedTasks.has(task._id);

    return (
      <Draggable draggableId={task._id} index={index}>
        {(provided, snapshot) => (
          <article
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-2 rounded-xl border border-white/10 bg-white/5 p-3 transition ${
              snapshot.isDragging ? "shadow-xl" : "hover:border-white/20"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{task.title}</p>
                <div className="flex items-center gap-1">
                  <span className={`rounded px-2 py-0.5 text-xs border ${getPriorityStyles(task.priority)}`}>
                    {task.priority}
                  </span>
                  {deadlineStatus && (
                    <span className={`rounded px-2 py-0.5 text-xs ${deadlineStatus.className}`}>
                      {deadlineStatus.label}
                    </span>
                  )}
                </div>
              </div>

              {task.description && <p className="text-xs text-white/70">{task.description}</p>}

              <div className="flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-2">
                  {task.assignee && (
                    <span>{task.assignee.displayName || task.assignee.username}</span>
                  )}
                  {task.deadline && (
                    <span className="inline-flex items-center gap-1">
                      <FaCalendarAlt />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {task.attachments?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FaPaperclip /> {task.attachments.length}
                    </span>
                  )}
                  {task.comments?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FaComment /> {task.comments.length}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 text-xs text-cyan-300"
                onClick={() => {
                  setExpandedTasks((prev) => {
                    const next = new Set(prev);
                    if (next.has(task._id)) next.delete(task._id);
                    else next.add(task._id);
                    return next;
                  });
                }}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />} {isExpanded ? "Hide" : "Show"} Details
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t border-white/10 pt-2">
                  {task.comments?.slice(0, 3).map((comment) => (
                    <div key={comment._id} className="rounded-md bg-black/20 p-2 text-xs text-white/70">
                      {comment.text}
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canEdit}
                      className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-500/20 px-2 py-1 text-xs text-cyan-200"
                      onClick={() => {
                        setSelectedTask(task);
                        setEditOpen(true);
                      }}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      className="inline-flex items-center gap-1 rounded-md border border-red-400/30 bg-red-500/20 px-2 py-1 text-xs text-red-200"
                      onClick={() => handleDeleteTask(task._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        )}
      </Draggable>
    );
  };

  const TaskColumn = ({ title, tasksInColumn, droppableId }) => (
    <section className="min-h-[500px] flex-1">
      <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">
            {tasksInColumn.length}
          </span>
        </div>

        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[400px] rounded-xl p-2 transition ${
                snapshot.isDraggingOver ? "bg-cyan-500/10" : "bg-transparent"
              }`}
            >
              {tasksInColumn.map((task, index) => (
                <TaskCard key={task._id} task={task} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </section>
  );

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Task Board</h3>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!canEdit}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-200 disabled:opacity-50"
        >
          <FaPlus /> Add Task
        </button>
      </header>

      {!canEdit && (
        <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Read-only access: you can view tasks but cannot modify them.
        </p>
      )}

      <DragDropContext onDragEnd={canEdit ? handleDragEnd : () => {}}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <TaskColumn title="To Do" tasksInColumn={groupedTasks.todo} droppableId="todo" />
          <TaskColumn
            title="In Progress"
            tasksInColumn={groupedTasks.in_progress}
            droppableId="in_progress"
          />
          <TaskColumn title="Done" tasksInColumn={groupedTasks.done} droppableId="done" />
        </div>
      </DragDropContext>

      {createOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1f] p-5">
            <h4 className="mb-4 text-lg font-semibold text-white">Create New Task</h4>
            <div className="space-y-3">
              <input
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Task description"
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={newTask.assignee}
                onChange={(e) => setNewTask((prev) => ({ ...prev, assignee: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.displayName || member.user.username}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask((prev) => ({ ...prev, deadline: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-200"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && selectedTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1f] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-white">Edit Task</h4>
              <button
                type="button"
                onClick={async () => {
                  const next = !historyOpen;
                  setHistoryOpen(next);
                  if (next) await loadTaskHistory(selectedTask._id);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <FaHistory />
                History
              </button>
            </div>

            {historyOpen && (
              <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Task history</p>
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
                    <div className="space-y-2 text-sm text-white/70">
                      {diffFields(compareRevision, selectedTask, [
                        "title",
                        "description",
                        "status",
                        "priority",
                        "assignee",
                        "deadline",
                      ])
                        .filter((row) => row.changed)
                        .map((row) => (
                          <div key={row.field} className="rounded-md border border-white/10 bg-black/20 p-2">
                            <p className="text-xs uppercase tracking-wide text-white/50">{row.field}</p>
                            <p className="text-xs text-white/60">
                              Before: <span className="text-white/80">{String(row.before ?? "")}</span>
                            </p>
                            <p className="text-xs text-white/60">
                              After: <span className="text-white/80">{String(row.after ?? "")}</span>
                            </p>
                          </div>
                        ))}
                      {diffFields(compareRevision, selectedTask, [
                        "title",
                        "description",
                        "status",
                        "priority",
                        "assignee",
                        "deadline",
                      ]).every((r) => !r.changed) && (
                        <p className="text-sm text-white/60">No differences detected.</p>
                      )}
                    </div>
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
                            onClick={() => restoreTaskRevision(selectedTask._id, rev._id)}
                            className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
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
                          {canEdit && rev.versionStatus !== "working" && (
                            <button
                              type="button"
                              onClick={() => updateVersionStatus(selectedTask._id, rev._id, "ready")}
                              className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
                            >
                              Mark Ready
                            </button>
                          )}
                          {canApproveVersions && rev.versionStatus === "ready" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateVersionStatus(selectedTask._id, rev._id, "approve")
                                }
                                className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
                              >
                                Approve (Working)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateVersionStatus(selectedTask._id, rev._id, "reject")
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
              </div>
            )}
            <div className="space-y-3">
              <input
                value={selectedTask.title || ""}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
              <textarea
                value={selectedTask.description || ""}
                onChange={(e) =>
                  setSelectedTask((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
              <select
                value={selectedTask.priority || "medium"}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={selectedTask.assignee?._id || selectedTask.assignee || ""}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, assignee: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.displayName || member.user.username}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={selectedTask.deadline ? new Date(selectedTask.deadline).toISOString().split("T")[0] : ""}
                onChange={(e) => setSelectedTask((prev) => ({ ...prev, deadline: e.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false);
                  setSelectedTask(null);
                  setHistoryOpen(false);
                  setCompareRevision(null);
                }}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditTask}
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/20 px-3 py-2 text-sm text-cyan-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default KanbanBoard;
