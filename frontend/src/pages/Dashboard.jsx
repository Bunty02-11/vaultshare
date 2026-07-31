import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(name = "") {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

function fileKind(fileType = "", name = "") {
  const t = (fileType || "").toLowerCase();
  const ext = fileExt(name).toLowerCase();
  if (t.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (t.startsWith("video/") || ["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (t.includes("pdf") || ext === "pdf") return "pdf";
  if (t.includes("zip") || ["zip", "rar", "7z"].includes(ext)) return "archive";
  if (t.includes("sheet") || ["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  if (t.includes("word") || ["doc", "docx"].includes(ext)) return "doc";
  return "file";
}

const KIND_STYLE = {
  image: { bg: "from-emerald-100 to-teal-200 dark:from-emerald-900/40 dark:to-teal-900/40", accent: "text-emerald-700 dark:text-emerald-300", label: "Image" },
  video: { bg: "from-violet-100 to-purple-200 dark:from-violet-900/40 dark:to-purple-900/40", accent: "text-violet-700 dark:text-violet-300", label: "Video" },
  pdf: { bg: "from-rose-100 to-orange-100 dark:from-rose-900/40 dark:to-orange-900/40", accent: "text-rose-700 dark:text-rose-300", label: "PDF" },
  archive: { bg: "from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40", accent: "text-amber-700 dark:text-amber-300", label: "Archive" },
  sheet: { bg: "from-green-100 to-lime-100 dark:from-green-900/40 dark:to-lime-900/40", accent: "text-green-700 dark:text-green-300", label: "Sheet" },
  doc: { bg: "from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40", accent: "text-sky-700 dark:text-sky-300", label: "Doc" },
  file: { bg: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700", accent: "text-app-muted", label: "File" },
};

function FileThumb({ asset }) {
  const kind = fileKind(asset.fileType, asset.fileName);
  const style = KIND_STYLE[kind];
  const isImage = kind === "image" && asset.fileUrl;

  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${style.bg}`}
    >
      {isImage ? (
        <img
          src={asset.fileUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className={`flex flex-col items-center gap-1 ${style.accent}`}>
          <FileTypeIcon kind={kind} />
          <span className="text-xs font-semibold tracking-wide">{fileExt(asset.fileName)}</span>
        </div>
      )}
    </div>
  );
}

function FileTypeIcon({ kind }) {
  const cls = "h-10 w-10";
  if (kind === "video") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  if (kind === "pdf" || kind === "doc") {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function AssetCard({ asset, onDownload, onDelete, onShareOpen, onCopyLink, onDetails, shared }) {
  const kind = fileKind(asset.fileType, asset.fileName);
  const style = KIND_STYLE[kind];
  const meta = shared
    ? `Shared · ${asset.owner?.name || "Someone"}`
    : `${style.label} · ${formatSize(asset.size)}`;

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg bg-app-card text-app-text shadow-md border-2 border-white-800 backdrop-blur transition hover:bg-app-hover";

  return (
    <div className="group relative rounded-2xl p-2 transition hover:bg-app-hover/60">
      <div className="relative">
        <FileThumb asset={asset} />

        {/* Hover actions on thumbnail */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetails(asset);
            }}
            className={iconBtn}
            aria-label="Details"
            title="Details"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {!shared && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShareOpen(asset);
              }}
              className={iconBtn}
              aria-label="Share"
              title="Share"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(asset._id);
            }}
            className={iconBtn}
            aria-label="Download"
            title="Download"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          {!shared && asset.shortUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink(asset.shortUrl);
              }}
              className={iconBtn}
              aria-label="Copy link"
              title="Copy link"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-start  gap-1 px-0.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-app-text" title={asset.fileName}>
            {asset.fileName}
          </p>
          <p className="mt-0.5 truncate text-xs text-app-muted">{meta}</p>
        </div>

        {!shared && (
          <button
            type="button"
            onClick={() => onDelete(asset._id)}
            className="flex h-7 w-7 shrink-0 border-2 border-white-800 items-center justify-center rounded-full text-app-muted opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
            aria-label="Delete"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function ShareModal({ asset, friends, onClose, onShare }) {
  const [sharingId, setSharingId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const sharedIds = new Set(
    (asset.sharedWith || []).map((id) => String(id?._id || id))
  );

  const filtered = friends.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.uniqueId?.toLowerCase().includes(q)
    );
  });

  const handleShare = async (friendId) => {
    setSharingId(friendId);
    try {
      await onShare(asset._id, friendId);
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl"
        style={{ backgroundColor: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-app-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-app-muted">Share file</p>
            <h3
              id="share-modal-title"
              className="mt-1 truncate text-lg font-semibold text-app-text"
              title={asset.fileName}
            >
              {asset.fileName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-app-muted hover:bg-app-hover hover:text-app-text"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-app-border px-5 py-3">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends"
              className="h-10 w-full rounded-xl border border-app-border bg-app-input pl-9 pr-3 text-sm text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {friends.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-app-muted">
              No friends yet. Add friends to share files.
            </p>
          )}
          {friends.length > 0 && filtered.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-app-muted">No friends match your search</p>
          )}
          {filtered.map((f) => {
            const alreadyShared = sharedIds.has(String(f._id));
            const busy = sharingId === f._id;
            return (
              <div
                key={f._id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-app-hover/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-accent text-sm font-semibold text-app-on-accent">
                  {f.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-app-text">{f.name}</p>
                  <p className="truncate text-xs text-app-muted">{f.email || f.uniqueId}</p>
                </div>
                {alreadyShared ? (
                  <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                    Shared
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleShare(f._id)}
                    className="shrink-0 rounded-lg bg-app-primary px-3 py-1.5 text-xs font-medium text-app-on-primary hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Sharing…" : "Share"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-app-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-app-border py-2.5 text-sm font-medium text-app-text hover:bg-app-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ asset, onClose, onCopyLink }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const sharedCount = Array.isArray(asset.sharedWith) ? asset.sharedWith.length : 0;
  const downloads = asset.downloadCount || 0;

  const Field = ({ label, children }) => (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</p>
      <div className="text-sm text-app-text">{children}</div>
    </div>
  );

  const UrlRow = ({ url }) => (
    <div className="flex items-start gap-2 rounded-xl border border-app-border bg-app-hover px-3 py-2.5">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 break-all text-sm text-app-primary hover:underline"
      >
        {url || "—"}
      </a>
      {url && (
        <button
          type="button"
          onClick={() => onCopyLink(url)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-app-muted hover:bg-app-card hover:text-app-text"
        >
          Copy
        </button>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-detail-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl"
        style={{ backgroundColor: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-app-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-app-muted">File details</p>
            <h3
              id="asset-detail-title"
              className="mt-1 truncate text-lg font-semibold text-app-text"
              title={asset.fileName}
            >
              {asset.fileName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-app-muted hover:bg-app-hover hover:text-app-text"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <Field label="File name">
            <p className="break-all font-medium">{asset.fileName}</p>
          </Field>

          <Field label="Original URL">
            <UrlRow url={asset.fileUrl} />
          </Field>

          <Field label="Short URL">
            <UrlRow url={asset.shortUrl} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-app-border px-4 py-3 ">
              <p className="text-xs font-medium uppercase tracking-wide text-app-muted">Downloads</p>
              <p className="mt-1 text-2xl font-semibold text-app-text">{downloads}</p>
              <p className="text-xs text-app-muted">
                {downloads === 1 ? "person downloaded" : "people downloaded"}
              </p>
            </div>
            <div className="rounded-xl border border-app-border px-4 py-3 ">
              <p className="text-xs font-medium uppercase tracking-wide text-app-muted">Shared with</p>
              <p className="mt-1 text-2xl font-semibold text-app-text">{sharedCount}</p>
              <p className="text-xs text-app-muted">
                {sharedCount === 1 ? "person" : "people"}
              </p>
            </div>
          </div>

          {asset.size != null && (
            <p className="text-xs text-app-muted">
              Size · {formatSize(asset.size)}
              {asset.fileType ? ` · ${asset.fileType}` : ""}
            </p>
          )}
        </div>

        <div className="border-t border-app-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-app-primary py-2.5 text-sm font-medium text-app-on-primary hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [assets, setAssets] = useState({ owned: [], sharedWithMe: [] });
  const [friends, setFriends] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [detailAsset, setDetailAsset] = useState(null);
  const [shareAsset, setShareAsset] = useState(null);
  const fileInputRef = useRef(null);

  const loadAssets = async () => {
    const { data } = await api.get("/assets");
    setAssets(data);
  };

  const loadFriends = async () => {
    const { data } = await api.get("/friends");
    setFriends(data.friends);
  };

  useEffect(() => {
    loadAssets();
    loadFriends();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { data: presign } = await api.post("/assets/presign", {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        size: file.size,
      });

      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("S3 upload failed");

      await api.post("/assets/confirm", {
        key: presign.key,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        size: file.size,
      });

      await loadAssets();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCopyLink = async (shortUrl) => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy link");
    }
  };

  const handleDownload = async (assetId) => {
    const { data } = await api.get(`/assets/${assetId}/download`);
    const response = await fetch(data.downloadUrl);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = data.fileName || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleShare = async (assetId, friendId) => {
    if (!friendId) return;
    const { data } = await api.post(`/assets/${assetId}/share`, { friendId });
    await loadAssets();
    // Keep modal in sync so "Shared" badge updates immediately
    if (shareAsset && String(shareAsset._id) === String(assetId)) {
      setShareAsset((prev) => ({
        ...prev,
        sharedWith: data.sharedWith || prev.sharedWith,
      }));
    }
  };

  const handleDelete = async (assetId) => {
    await api.delete(`/assets/${assetId}`);
    await loadAssets();
  };

  const actionCard =
    "flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition sm:h-32 sm:w-32";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />

      {/* Action cards */}
      <div className="mb-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`${actionCard} border-white-500 border-2 bg-app-primary text-app-on-primary hover:opacity-90 disabled:opacity-60`}
        >
           <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {uploading ? "Uploading…" : "Upload file"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {copied && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Link copied
        </div>
      )}

      {/* My files */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-app-text">My files</h2>
          <span className="text-sm text-app-muted">{assets.owned.length}</span>
        </div>

        {assets.owned.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-app-border px-6 py-16 text-center ">
            <p className="text-sm text-app-muted">No files yet — upload something to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {assets.owned.map((asset) => (
              <AssetCard
                key={asset._id}
                asset={asset}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onShareOpen={setShareAsset}
                onCopyLink={handleCopyLink}
                onDetails={setDetailAsset}
              />
            ))}
          </div>
        )}
      </section>

      {/* Shared — below my files */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-app-text">Shared with me</h2>
          <span className="text-sm text-app-muted">{assets.sharedWithMe.length}</span>
        </div>

        {assets.sharedWithMe.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-app-border px-6 py-12 text-center ">
            <p className="text-sm text-app-muted">Nothing shared with you yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {assets.sharedWithMe.map((asset) => (
              <AssetCard
                key={asset._id}
                asset={asset}
                shared
                onDownload={handleDownload}
                onDelete={handleDelete}
                onShareOpen={setShareAsset}
                onCopyLink={handleCopyLink}
                onDetails={setDetailAsset}
              />
            ))}
          </div>
        )}
      </section>

      {detailAsset && (
        <DetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onCopyLink={handleCopyLink}
        />
      )}

      {shareAsset && (
        <ShareModal
          asset={shareAsset}
          friends={friends}
          onClose={() => setShareAsset(null)}
          onShare={handleShare}
        />
      )}
    </div>
  );
}
