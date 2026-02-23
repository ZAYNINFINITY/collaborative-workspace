import React from "react";
import { FaFileAlt, FaFileImage, FaFilePdf } from "react-icons/fa";

const cardClass =
  "rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]";

const FileUploadsWidget = ({ documents, loading }) => {
  const recentDocuments = documents.slice(0, 5);

  const getFileIcon = (filename) => {
    const ext = filename?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return <FaFileImage className="text-blue-400" />;
    }
    if (ext === "pdf") {
      return <FaFilePdf className="text-red-400" />;
    }
    return <FaFileAlt className="text-slate-400" />;
  };

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} transition hover:border-white/20`}>
      <h3 className="mb-4 text-sm font-semibold text-white">Latest File Uploads</h3>
      {recentDocuments.length === 0 ? (
        <p className="text-sm text-white/55">No files uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {recentDocuments.map((doc) => (
            <div key={doc._id} className="flex items-center gap-3">
              {getFileIcon(doc.name)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                <p className="text-xs text-white/50">{new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadsWidget;
