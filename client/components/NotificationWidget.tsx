import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, X, Check, CheckCheck, Trash2, RefreshCw,
  ChevronDown, Circle, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/hooks/useNotifications";

// ─── Color map ────────────────────────────────────────────────────────────────
const COLORS: Record<string, { bg: string; text: string; dot: string; light: string }> = {
  orange: { bg: "bg-orange-500", text: "text-orange-600", dot: "bg-orange-500", light: "bg-orange-50" },
  red:    { bg: "bg-red-500",    text: "text-red-600",    dot: "bg-red-500",    light: "bg-red-50"    },
  green:  { bg: "bg-green-500",  text: "text-green-600",  dot: "bg-green-500",  light: "bg-green-50"  },
  blue:   { bg: "bg-blue-500",   text: "text-blue-600",   dot: "bg-blue-500",   light: "bg-blue-50"   },
  purple: { bg: "bg-purple-500", text: "text-purple-600", dot: "bg-purple-500", light: "bg-purple-50" },
  yellow: { bg: "bg-yellow-500", text: "text-yellow-600", dot: "bg-yellow-500", light: "bg-yellow-50" },
  gray:   { bg: "bg-gray-400",   text: "text-gray-500",   dot: "bg-gray-400",   light: "bg-gray-50"   },
};
const getC = (c: string) => COLORS[c] ?? COLORS.orange;

// ─── Type → icon ──────────────────────────────────────────────────────────────

// ─── Time ago ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)     return "just now";
  if (s < 3600)   return `${Math.floor(s / 60)}m`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
type Tab = "all" | "unread" | "breeding" | "vet" | "community" | "orders";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" }, { id: "unread", label: "Unread" },
  { id: "breeding", label: "Breeding" }, { id: "vet", label: "Vet" },
  { id: "community", label: "Community" }, { id: "orders", label: "Orders" },
];

function applyTab(ns: AppNotification[], tab: Tab) {
  if (tab === "unread")    return ns.filter(n => !n.read);
  if (tab === "breeding")  return ns.filter(n => ["breeding_like","breeding_match","breeding_message","adoption_applied","adoption_approved","hosting_request","hosting_confirmed"].includes(n.type));
  if (tab === "vet")       return ns.filter(n => n.type.startsWith("vet"));
  if (tab === "community") return ns.filter(n => n.type.startsWith("community"));
  if (tab === "orders")    return ns.filter(n => ["store_order","marketplace_interest","insurance_expiry"].includes(n.type));
  return ns;
}

// ─── Single notification row ──────────────────────────────────────────────────
function NRow({ n, onRead, onUnread, onDelete, onAction }: {
  n: AppNotification;
  onRead: (id: string) => void;
  onUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (n: AppNotification) => void;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const c = getC(n.color);

  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menu]);

  return (
    <div
      onClick={() => { if (!n.read) onRead(n.id); if (n.actionUrl) onAction(n); }}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 cursor-pointer transition-colors",
        n.read ? "bg-white hover:bg-gray-50/80" : `${c.light} hover:opacity-90`
      )}
    >
      {/* Unread indicator */}
      {!n.read && <div className={cn("absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full", c.dot)} />}

      {/* Icon bubble */}
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base", n.read ? "bg-gray-100" : c.light)}>
        {n.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold leading-snug", n.read ? "text-gray-600" : "text-gray-900")}>
            {n.title}
          </p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5 font-medium whitespace-nowrap">
            {timeAgo(n.createdAt)}
          </span>
        </div>
        <p className={cn("text-xs mt-0.5 leading-relaxed line-clamp-2", n.read ? "text-gray-400" : "text-gray-600")}>
          {n.message}
        </p>
        {n.actionLabel && n.actionUrl && (
          <span className={cn("inline-flex items-center gap-0.5 mt-1 text-[11px] font-bold", c.text)}>
            {n.actionLabel} →
          </span>
        )}
      </div>

      {/* Context menu */}
      <div ref={menuRef} className="flex-shrink-0 relative" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenu(s => !s)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 text-sm font-bold"
        >
          ···
        </button>
        {menu && (
          <div className="absolute right-0 top-7 z-[60] w-44 bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden">
            {n.read ? (
              <button type="button" onClick={() => { onUnread(n.id); setMenu(false); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Circle className="w-3.5 h-3.5 text-blue-500" /> Mark as unread
              </button>
            ) : (
              <button type="button" onClick={() => { onRead(n.id); setMenu(false); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Check className="w-3.5 h-3.5 text-green-500" /> Mark as read
              </button>
            )}
            {n.actionUrl && (
              <button type="button" onClick={() => { onAction(n); setMenu(false); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <ChevronDown className="w-3.5 h-3.5 text-orange-500 -rotate-90" /> {n.actionLabel || "Open"}
              </button>
            )}
            <div className="border-t border-gray-100" />
            <button type="button" onClick={() => { onDelete(n.id); setMenu(false); }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const EMPTY: Record<Tab, { emoji: string; title: string; sub: string }> = {
  all:       { emoji: "🔔", title: "No notifications yet",     sub: "Activity from all features will appear here." },
  unread:    { emoji: "✅", title: "All caught up!",           sub: "No unread notifications." },
  breeding:  { emoji: "🐾", title: "No breeding updates",      sub: "Like pets to start seeing activity." },
  vet:       { emoji: "🩺", title: "No vet updates",           sub: "Book a consultation to get notified." },
  community: { emoji: "👥", title: "No community updates",     sub: "Post or reply to get notified." },
  orders:    { emoji: "📦", title: "No order updates",         sub: "Shop to see activity here." },
};

// ─── Wiggle CSS injected once ─────────────────────────────────────────────────
const STYLE = `
@keyframes notif-wiggle {
  0%,100% { transform: rotate(0deg); }
  15%     { transform: rotate(-18deg); }
  30%     { transform: rotate(16deg); }
  45%     { transform: rotate(-12deg); }
  60%     { transform: rotate(10deg); }
  75%     { transform: rotate(-6deg); }
}
.notif-wiggle { animation: notif-wiggle 0.6s ease-in-out; }
.notif-hide-scroll::-webkit-scrollbar { display: none; }
.notif-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// BELL BUTTON — exported for use in Header
// ═══════════════════════════════════════════════════════════════════════════════
export function NotificationBell({ unreadCount, justReceived, isOpen, onClick }: {
  unreadCount: number;
  justReceived: boolean;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <>
      <style>{STYLE}</style>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all select-none",
          isOpen
            ? "bg-orange-50 border-orange-300 text-orange-600"
            : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
      >
        <Bell className={cn("w-4 h-4", justReceived && "notif-wiggle")} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm select-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {justReceived && (
          <span className="absolute inset-0 rounded-xl bg-orange-400/30 animate-ping pointer-events-none" />
        )}
      </button>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION WIDGET — floating panel
// ═══════════════════════════════════════════════════════════════════════════════
interface WidgetProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  isConnected: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClearAllRead: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export default function NotificationWidget(props: WidgetProps) {
  const {
    notifications, unreadCount, loading, hasMore, isConnected,
    isOpen, onClose, onMarkRead, onMarkUnread, onMarkAllRead,
    onDelete, onClearAllRead, onLoadMore, onRefresh,
  } = props;

  const navigate   = useNavigate();
  const panelRef   = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("all");

  const filtered  = applyTab(notifications, tab);
  const readCount = notifications.filter(n => n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 150);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const handleAction = useCallback((n: AppNotification) => {
    if (!n.read) onMarkRead(n.id);
    if (n.actionUrl) { navigate(n.actionUrl); onClose(); }
  }, [onMarkRead, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{STYLE}</style>

      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-[45] sm:hidden bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-50 right-4 top-[73px] w-[calc(100vw-32px)] sm:w-[400px] max-h-[80vh] sm:max-h-[580px] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.05)" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm leading-none">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-[10px] text-orange-500 font-semibold mt-0.5">{unreadCount} unread</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
                isConnected ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
              )}>
                {isConnected ? <><Wifi className="w-2.5 h-2.5" /> Live</> : <><WifiOff className="w-2.5 h-2.5" /> Offline</>}
              </span>
              <button type="button" onClick={onRefresh}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </button>
              <button type="button" onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {(unreadCount > 0 || readCount > 0) && (
            <div className="flex items-center justify-between">
              {unreadCount > 0 && (
                <button type="button" onClick={onMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              {readCount > 0 && (
                <button type="button" onClick={onClearAllRead}
                  className={cn("flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors", unreadCount === 0 && "ml-auto")}>
                  <Trash2 className="w-3 h-3" /> Clear read
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex-shrink-0 flex gap-1 px-3 pb-2.5 overflow-x-auto notif-hide-scroll">
          {TABS.map(t => {
            const count = t.id === "unread" ? unreadCount : t.id === "all" ? notifications.length : applyTab(notifications, t.id).length;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0",
                  tab === t.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}>
                {t.label}
                {count > 0 && (
                  <span className={cn("text-[10px] font-black px-1 rounded-full", tab === t.id ? "bg-white/25 text-white" : "bg-gray-300 text-gray-600")}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-shrink-0 h-px bg-gray-100" />

        {/* List */}
        <div className="flex-1 overflow-y-auto notif-hide-scroll">
          {loading && notifications.length === 0 ? (
            // Skeleton
            <div>
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-50 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-3 bg-gray-100 rounded w-32" />
                    <div className="h-2.5 bg-gray-100 rounded w-48" />
                    <div className="h-2.5 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="text-3xl mb-2">{EMPTY[tab].emoji}</div>
              <p className="font-bold text-gray-800 text-sm">{EMPTY[tab].title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{EMPTY[tab].sub}</p>
            </div>
          ) : (
            <>
              {filtered.map(n => (
                <NRow
                  key={n.id}
                  n={n}
                  onRead={onMarkRead}
                  onUnread={onMarkUnread}
                  onDelete={onDelete}
                  onAction={handleAction}
                />
              ))}
              {hasMore && tab === "all" && (
                <div className="py-3 text-center">
                  <button type="button" onClick={onLoadMore} disabled={loading}
                    className="text-[11px] font-bold text-orange-500 hover:text-orange-600 disabled:opacity-40 flex items-center gap-1 mx-auto">
                    {loading ? <><RefreshCw className="w-3 h-3 animate-spin" /> Loading…</> : <><ChevronDown className="w-3 h-3" /> Load more</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2.5 bg-gray-50/60 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</span>
          <span className={cn("flex items-center gap-1 text-[10px] font-medium", isConnected ? "text-green-500" : "text-gray-400")}>
            <Circle className="w-1.5 h-1.5 fill-current" />
            {isConnected ? "Real-time" : "Connecting…"}
          </span>
        </div>
      </div>
    </>
  );
}
