import React, { useMemo } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const cardClass =
  "rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

const DeadlineWidget = ({ deadline, loading }) => {
  const deadlineInfo = useMemo(() => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));

    let status = "upcoming";
    let accent = "#3b82f6";
    let progress = 0;

    if (timeDiff < 0) {
      status = "overdue";
      accent = "#ef4444";
      progress = 100;
    } else if (daysLeft <= 1) {
      status = "urgent";
      accent = "#f97316";
      progress = 90;
    } else if (daysLeft <= 7) {
      status = "soon";
      accent = "#fbbf24";
      progress = 70;
    } else {
      progress = Math.max(0, 100 - (daysLeft / 30) * 100);
    }

    return {
      daysLeft,
      hoursLeft,
      status,
      accent,
      progress,
      formattedDate: deadlineDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, [deadline]);

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-10 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (!deadlineInfo) {
    return (
      <div className={`${cardClass} transition hover:border-white/20`}>
        <h3 className="mb-4 text-sm font-semibold text-white">Project Deadline</h3>
        <p className="text-sm text-white/55">No deadline set.</p>
      </div>
    );
  }

  return (
    <div className={`${cardClass} transition hover:border-white/20`}>
      <h3 className="mb-4 text-sm font-semibold text-white">Project Deadline</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white/80">
            <FaCalendarAlt />
            <p className="text-sm font-semibold text-white">{deadlineInfo.formattedDate}</p>
          </div>
          <span
            className="rounded-full border px-2 py-0.5 text-xs font-semibold"
            style={{
              color: deadlineInfo.accent,
              backgroundColor: `${deadlineInfo.accent}20`,
              borderColor: `${deadlineInfo.accent}40`,
            }}
          >
            {deadlineInfo.status === "overdue"
              ? "Overdue"
              : deadlineInfo.daysLeft <= 1
                ? `${deadlineInfo.hoursLeft}h left`
                : `${deadlineInfo.daysLeft}d left`}
          </span>
        </div>

        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${deadlineInfo.progress}%`, background: deadlineInfo.accent }}
            />
          </div>
          <p className="mt-1 text-xs text-white/50">Time progress to deadline</p>
        </div>
      </div>
    </div>
  );
};

export default DeadlineWidget;
