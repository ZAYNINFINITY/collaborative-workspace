import React, { useEffect, useMemo, useState } from "react";
import API from "../api";
import { socket } from "../socket";
import { useAuth } from "../auth/useAuth";

const buildTree = (comments) => {
  const byId = new Map();
  const roots = [];

  (comments || []).forEach((c) => {
    byId.set(c._id, { ...c, replies: [] });
  });

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByCreated = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
  const sortTree = (items) => {
    items.sort(sortByCreated);
    items.forEach((i) => sortTree(i.replies));
  };
  sortTree(roots);
  return roots;
};

const CommentsThread = ({
  workspaceId,
  entityType,
  entityId,
  currentUserRole = "member",
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const canModerate = useMemo(
    () => ["admin", "owner"].includes(currentUserRole),
    [currentUserRole],
  );

  const load = async () => {
    if (!workspaceId || !entityType || !entityId) return;
    try {
      setLoading(true);
      setError("");
      const res = await API.get(
        `/workspaces/${workspaceId}/comments?entityType=${encodeURIComponent(
          entityType,
        )}&entityId=${encodeURIComponent(entityId)}`,
      );
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, entityType, entityId]);

  useEffect(() => {
    if (!workspaceId) return;

    const onNew = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      const c = payload?.comment;
      if (!c) return;
      if (String(c.entityType) !== String(entityType)) return;
      if (String(c.entityId) !== String(entityId)) return;
      setComments((prev) => {
        if (prev.some((p) => p._id === c._id)) return prev;
        return [...prev, c];
      });
    };

    const onUpdated = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      const c = payload?.comment;
      if (!c) return;
      setComments((prev) => prev.map((p) => (p._id === c._id ? c : p)));
    };

    socket.on("comment:new", onNew);
    socket.on("comment:updated", onUpdated);
    return () => {
      socket.off("comment:new", onNew);
      socket.off("comment:updated", onUpdated);
    };
  }, [workspaceId, entityType, entityId]);

  const submit = async () => {
    if (!content.trim()) return;
    try {
      setError("");
      const res = await API.post(`/workspaces/${workspaceId}/comments`, {
        entityType,
        entityId,
        parentId: replyTo?._id || null,
        content: content.trim(),
      });
      setContent("");
      setReplyTo(null);
      setComments((prev) => [...prev, res.data]);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send comment");
    }
  };

  const resolve = async (commentId) => {
    try {
      setError("");
      const res = await API.post(
        `/workspaces/${workspaceId}/comments/${commentId}/resolve`,
      );
      setComments((prev) => prev.map((c) => (c._id === res.data._id ? res.data : c)));
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to resolve");
    }
  };

  const tree = useMemo(() => buildTree(comments), [comments]);

  const CommentNode = ({ node, depth }) => {
    const authorName =
      node.user?.displayName || node.user?.username || "Someone";
    const isMine = user?._id && node.user?._id === user._id;
    const canResolve = canModerate || isMine;

    return (
      <div
        className="rounded-xl border border-white/10 bg-black/20 p-3"
        style={{ marginLeft: depth ? depth * 12 : 0 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white/85">
              {authorName}
            </p>
            <p className="text-xs text-white/50">
              {new Date(node.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {node.isResolved && (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                Resolved
              </span>
            )}
            {!node.isResolved && (
              <button
                type="button"
                onClick={() => setReplyTo(node)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:bg-white/10"
              >
                Reply
              </button>
            )}
            {!node.isResolved && canResolve && (
              <button
                type="button"
                onClick={() => resolve(node._id)}
                className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-emerald-200 hover:bg-emerald-500/20"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">
          {node.content}
        </p>

        {node.replies?.length > 0 && (
          <div className="mt-3 space-y-2">
            {node.replies.map((r) => (
              <CommentNode key={r._id} node={r} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Comments</p>
        {loading && <span className="text-xs text-white/50">Loading…</span>}
      </div>

      {error && (
        <div className="mb-2 rounded-md border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {replyTo && (
        <div className="mb-2 rounded-md border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200">
          Replying to{" "}
          {replyTo.user?.displayName || replyTo.user?.username || "comment"}{" "}
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="ml-2 underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
          >
            cancel
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tree.length === 0 ? (
          <p className="text-sm text-white/60">No comments yet.</p>
        ) : (
          tree.map((c) => <CommentNode key={c._id} node={c} depth={0} />)
        )}
      </div>

      <div className="mt-3 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Write a comment… Use @username or @all"
          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!content.trim()}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsThread;
