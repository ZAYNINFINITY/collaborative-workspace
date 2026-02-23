import React from "react";
import { FaCheckCircle, FaClock, FaExclamationTriangle } from "react-icons/fa";

const cardClass =
  "rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

const ProgressWidget = ({ tasks, loading }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < new Date()).length;
  const highPriorityTasks = tasks.filter((t) => t.priority === "high").length;
  const mediumPriorityTasks = tasks.filter((t) => t.priority === "medium").length;
  const lowPriorityTasks = tasks.filter((t) => t.priority === "low").length;

  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-10 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className={`${cardClass} transition hover:border-white/20`}>
      <h3 className="mb-4 text-sm font-semibold text-white">Task Progress</h3>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-white/85">
            <span>Overall Completion</span>
            <span className="font-semibold">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="flex items-center gap-1 text-xs text-white/60">
              <FaCheckCircle className="text-emerald-400" /> Done
            </p>
            <p className="text-lg font-semibold text-white">{completedTasks}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-white/60">
              <FaClock className="text-amber-400" /> In Progress
            </p>
            <p className="text-lg font-semibold text-white">{inProgressTasks}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-white/60">
              <FaExclamationTriangle className="text-red-400" /> To Do
            </p>
            <p className="text-lg font-semibold text-white">{todoTasks}</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-white/55">Priority Distribution:</p>
            <div className="flex items-center gap-1">
              <span className="rounded border border-red-400/30 bg-red-500/20 px-1.5 py-0.5 text-red-200">H: {highPriorityTasks}</span>
              <span className="rounded border border-amber-400/30 bg-amber-500/20 px-1.5 py-0.5 text-amber-200">M: {mediumPriorityTasks}</span>
              <span className="rounded border border-emerald-400/30 bg-emerald-500/20 px-1.5 py-0.5 text-emerald-200">L: {lowPriorityTasks}</span>
            </div>
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-red-300">Overdue Tasks:</p>
              <span className="rounded border border-red-400/30 bg-red-500/20 px-1.5 py-0.5 text-red-200">{overdueTasks}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressWidget;
