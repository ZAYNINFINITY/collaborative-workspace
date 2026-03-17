import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import API from "../api";
import { socket } from "../socket";

const ChatRoom = ({ workspaceId, messages, onMessageSent, canEdit = true }) => {
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveMessages, setLiveMessages] = useState(messages);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages]);

  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await API.get("/auth/user");
        setCurrentUser(res.data);
      } catch {
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const onNewMessage = (message) => {
      setLiveMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    socket.on("message:new", onNewMessage);
    return () => socket.off("message:new", onNewMessage);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!canEdit || !newMessage.trim()) return;

    try {
      setLoading(true);
      const res = await API.post(`/workspaces/${workspaceId}/messages`, {
        content: newMessage,
      });
      setNewMessage("");
      if (onMessageSent) onMessageSent(res.data);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  const isOwnMessage = (msg) => currentUser && msg.author?._id === currentUser._id;

  return (
    <section className="flex h-[600px] flex-col rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <header className="mb-3 border-b border-white/10 pb-3">
        <h3 className="text-lg font-semibold text-white">Team Chat</h3>
        <p className="text-xs text-white/60">Real-time collaboration · {liveMessages.length} messages</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {liveMessages.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center text-center">
            <div>
              <p className="text-sm text-white/60">No messages yet</p>
              <p className="text-xs text-white/40">Start the conversation with your team</p>
            </div>
          </div>
        ) : (
          liveMessages.map((msg, index) => {
            const own = isOwnMessage(msg);
            const prev = index > 0 ? liveMessages[index - 1] : null;
            const sameAuthor = prev && prev.author?._id === msg.author?._id;
            const showAvatar = !sameAuthor;

            return (
              <article key={msg._id} className="w-full">
                <div className={`flex gap-2 ${own ? "justify-end" : "justify-start"}`}>
                  {!own && showAvatar ? (
                    <img
                      src={(msg.author?.avatar || msg.author?.avatarUrl) || "https://ui-avatars.com/api/?background=111827&color=67e8f9&name=" + encodeURIComponent(msg.author?.displayName || msg.author?.username || "U")}
                      alt={msg.author?.displayName || msg.author?.username || "User"}
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                  ) : !own ? (
                    <div className="w-8" />
                  ) : null}

                  <div className={`flex max-w-[80%] flex-col ${own ? "items-end" : "items-start"}`}>
                    {showAvatar && !own && (
                      <p className="mb-1 text-xs font-medium text-white/70">
                        {msg.author?.displayName || msg.author?.username}
                      </p>
                    )}
                    <div
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        own
                          ? "border-cyan-400/30 bg-cyan-500/20 text-white"
                          : "border-white/15 bg-white/5 text-white"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {showAvatar && (
                      <p className="mt-1 text-xs text-white/50">
                        {new Date(msg.createdAt || msg.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="mt-3 border-t border-white/10 pt-3">
        {!canEdit && (
          <p className="mb-2 text-xs text-amber-300">
            Read-only access: you can view chat history but cannot send messages.
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={loading || !canEdit}
            className="flex-1 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !canEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-50"
          >
            <FaPaperPlane />
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ChatRoom;
