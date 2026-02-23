import React from "react";

const cardClass =
  "rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

function Avatar({ name, src }) {
  const initials = (name || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name || "avatar"} className="h-6 w-6 rounded-full border border-white/15 object-cover" />;
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[10px] font-semibold text-white">
      {initials}
    </div>
  );
}

const ChatPreviewWidget = ({ messages, loading }) => {
  const recentMessages = messages.slice(-5).reverse();

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-6 w-6 animate-pulse rounded-full bg-white/10" />
              <div className="w-full space-y-2">
                <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} transition hover:border-white/20`}>
      <h3 className="mb-4 text-sm font-semibold text-white">Recent Chat Messages</h3>
      {recentMessages.length === 0 ? (
        <p className="text-sm text-white/55">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {recentMessages.map((message) => (
            <div key={message._id} className="flex items-start gap-3">
              <Avatar
                name={message.sender?.displayName || message.sender?.username}
                src={message.sender?.avatar}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {message.sender?.displayName || message.sender?.username}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(message.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm text-white/75">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPreviewWidget;
