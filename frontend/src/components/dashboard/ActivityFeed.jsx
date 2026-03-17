import React, { useEffect, useState } from "react";
import { FaComment, FaFileAlt, FaTasks, FaUserPlus } from "react-icons/fa";
import API from "../../api";
import { socket } from "../../socket";

const cardClass =
  "rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

const ActivityFeed = ({ workspaceId, loading: parentLoading }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const getActivityIcon = (type) => {
    switch (type) {
      case "task_created":
      case "task_updated":
        return <FaTasks className="text-blue-400" />;
      case "project_file_created":
      case "project_file_updated":
      case "project_file_deleted":
        return <FaFileAlt className="text-cyan-300" />;
      case "message_sent":
        return <FaComment className="text-emerald-400" />;
      case "document_uploaded":
        return <FaFileAlt className="text-violet-400" />;
      case "member_joined":
        return <FaUserPlus className="text-orange-400" />;
      default:
        return <FaComment className="text-slate-400" />;
    }
  };

  const formatActivityText = (activity) => {
    const user = activity.user?.displayName || activity.user?.username || "Someone";
    const details = activity.metadata || activity.details || {};

    switch (activity.type) {
      case "task_created":
        return `${user} created a new task: "${details.title || "Untitled"}"`;
      case "task_updated":
        return `${user} updated task: "${details.title || "Untitled"}"`;
      case "message_sent":
        return `${user} sent a message`;
      case "document_uploaded":
        return `${user} uploaded "${details.name || "a document"}"`;
      case "project_file_created":
        return `${user} created file "${details.path || "a file"}"`;
      case "project_file_updated":
        return `${user} updated file "${details.path || "a file"}"`;
      case "project_file_deleted":
        return `${user} deleted file "${details.path || "a file"}"`;
      case "member_joined":
        return `${user} joined the workspace`;
      default:
        return activity.description ? `${user}: ${activity.description}` : `${user} performed an action`;
    }
  };

  useEffect(() => {
    if (!workspaceId) return;

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/activities?workspace=${workspaceId}&limit=10`);
        setActivities(res.data || []);
      } catch (err) {
        console.error("Failed to load activities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const onActivityNew = (payload) => {
      if (!payload || payload.workspaceId !== workspaceId) return;
      const nextActivity = payload.activity;
      if (!nextActivity?._id) return;
      setActivities((prev) => {
        const withoutDup = prev.filter((a) => a?._id !== nextActivity._id);
        return [nextActivity, ...withoutDup].slice(0, 10);
      });
    };

    socket.on("activity:new", onActivityNew);
    return () => socket.off("activity:new", onActivityNew);
  }, [workspaceId]);

  if (parentLoading || loading) {
    return (
      <div className={cardClass}>
        <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
              <div className="w-full space-y-2">
                <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} transition hover:border-white/20`}>
      <h3 className="mb-4 text-sm font-semibold text-white">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-white/55">No recent activity yet.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity._id} className="flex items-start gap-3">
              <span className="mt-0.5">{getActivityIcon(activity.type)}</span>
              <div>
                <p className="text-sm text-white/80">{formatActivityText(activity)}</p>
                <p className="text-xs text-white/50">
                  {new Date(activity.createdAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
