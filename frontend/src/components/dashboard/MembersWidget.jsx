import React from "react";

const cardClass =
  "rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

function avatarFromUser(user, size = "md") {
  const cls = size === "xs" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs";
  const name = user?.displayName || user?.username || "U";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className={`${cls} rounded-full border border-white/15 object-cover`} />;
  }

  return <div className={`${cls} grid place-items-center rounded-full border border-white/15 bg-white/10 font-semibold text-white`}>{initials}</div>;
}

function roleClass(role) {
  switch (role) {
    case "admin":
      return "bg-violet-500/20 text-violet-300 border-violet-400/30";
    case "owner":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";
    default:
      return "bg-blue-500/20 text-blue-300 border-blue-400/30";
  }
}

const MembersWidget = ({ members, loading }) => {
  if (loading) {
    return (
      <div className={cardClass}>
        <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-4 flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} transition hover:border-white/20`}>
      <h3 className="mb-4 text-sm font-semibold text-white">Active Members ({members.length})</h3>
      {members.length === 0 ? (
        <p className="text-sm text-white/55">No members yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center -space-x-2">
            {members.slice(0, 5).map((member) => (
              <div key={member.user._id}>{avatarFromUser(member.user)}</div>
            ))}
            {members.length > 5 && (
              <span className="ml-2 text-xs text-white/60">+{members.length - 5}</span>
            )}
          </div>

          <div className="space-y-2">
            {members.slice(0, 3).map((member) => (
              <div key={member.user._id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {avatarFromUser(member.user, "xs")}
                  <p className="text-sm text-white">{member.user.displayName || member.user.username}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${roleClass(member.role)}`}>
                  {member.role}
                </span>
              </div>
            ))}
            {members.length > 3 && <p className="text-xs text-white/50">+{members.length - 3} more members</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersWidget;
