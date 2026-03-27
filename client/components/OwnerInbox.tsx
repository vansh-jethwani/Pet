import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  Wifi,
  WifiOff,
  Circle,
  CheckCheck,
  Clock,
  PawPrint,
  Phone,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InboxRoom } from "@/hooks/useOwnerInbox";
import { ChatMessage } from "@/hooks/useChat";

/* ─── Styles ─────────────────────────────────────────────────────────────────*/
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500&display=swap');

  .inbox-root { font-family: 'Syne', sans-serif; }
  .inbox-mono { font-family: 'DM Mono', monospace; }

  @keyframes inbox-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes inbox-slide { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
  @keyframes dot-bounce  { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes badge-pop   { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
  @keyframes msg-in      { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
  @keyframes msg-out     { from{opacity:0;transform:translateX(10px)}  to{opacity:1;transform:none} }

  .inbox-in    { animation: inbox-in    .28s ease both; }
  .inbox-slide { animation: inbox-slide .24s ease both; }
  .badge-pop   { animation: badge-pop   .22s cubic-bezier(.34,1.56,.64,1) both; }
  .msg-in      { animation: msg-in .2s ease both; }
  .msg-out     { animation: msg-out .2s ease both; }

  .typing-dot { animation: dot-bounce 1.4s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation-delay: .2s; }
  .typing-dot:nth-child(3) { animation-delay: .4s; }

  .inbox-scroll::-webkit-scrollbar { width: 3px; }
  .inbox-scroll::-webkit-scrollbar-thumb { background: #fed7aa; border-radius: 999px; }

  .conv-row:hover { background: linear-gradient(90deg, #fff7ed, #fff); }
  .conv-row.active { background: linear-gradient(90deg, #fff7ed, #fef3c7 50%, #fff7ed); border-left: 3px solid #f97316; }
`;

/* ─── helpers ────────────────────────────────────────────────────────────────*/
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── MessageBubble ──────────────────────────────────────────────────────────*/
function Bubble({ msg, isOwner }: { msg: ChatMessage; isOwner: boolean }) {
  const t = new Date(msg.timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  if (msg.type === "system") {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-2", isOwner ? "flex-row-reverse msg-out" : "msg-in")}>
      {!isOwner && (
        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">
          {msg.senderAvatar?.startsWith("http") ? (
            <img src={msg.senderAvatar} className="w-full h-full rounded-full object-cover" alt="" />
          ) : (
            msg.senderAvatar || "🐾"
          )}
        </div>
      )}
      <div className={cn(
        "max-w-[72%] px-4 py-2.5 text-sm leading-relaxed",
        isOwner
          ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white rounded-2xl rounded-br-sm shadow-sm shadow-orange-200"
          : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm"
      )}>
        {!isOwner && (
          <p className="text-[10px] font-bold text-orange-500 mb-0.5">{msg.senderName}</p>
        )}
        <p>{msg.text}</p>
        <div className={cn("flex items-center gap-1 mt-0.5", isOwner ? "justify-end" : "justify-start")}>
          <span className={cn("text-[10px]", isOwner ? "text-white/60" : "text-gray-400")}>{t}</span>
          {isOwner && <CheckCheck className="w-3 h-3 text-white/60" />}
        </div>
      </div>
    </div>
  );
}

/* ─── ConversationRow ────────────────────────────────────────────────────────*/
function ConversationRow({
  room, isActive, ownerId, onClick,
}: {
  room: InboxRoom; isActive: boolean; ownerId: string; onClick: () => void;
}) {
  const lastMsg = room.messages[room.messages.length - 1];
  const preview = lastMsg
    ? lastMsg.senderId === ownerId ? `You: ${lastMsg.text}` : lastMsg.text
    : "No messages yet — say hello!";

  return (
    <button
      onClick={onClick}
      className={cn(
        "conv-row w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 transition-all text-left",
        isActive && "active"
      )}
    >
      <div className="relative flex-shrink-0">
        {room.petPhoto ? (
          <img src={room.petPhoto} alt={room.petName} className="w-11 h-11 rounded-xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-300 to-amber-300 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs">
          {room.seekerAvatar?.startsWith("http") ? (
            <img src={room.seekerAvatar} className="w-full h-full rounded-full object-cover" alt="" />
          ) : (
            <span style={{ fontSize: 12 }}>{room.seekerAvatar || "🐾"}</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-gray-900 text-sm truncate">{room.seekerName}</p>
          {lastMsg && (
            <span className="text-[10px] text-gray-400 flex-shrink-0 inbox-mono">
              {timeAgo(lastMsg.timestamp)}
            </span>
          )}
        </div>
        <p className="text-xs text-orange-500 font-semibold truncate mb-0.5">re: {room.petName}</p>
        <p className="text-xs text-gray-500 truncate">{preview}</p>
      </div>

      {room.unreadCount > 0 && (
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center badge-pop">
          {room.unreadCount > 9 ? "9+" : room.unreadCount}
        </div>
      )}
    </button>
  );
}

/* ─── ChatPanel ──────────────────────────────────────────────────────────────*/
function ChatPanel({
  room,
  ownerId,
  ownerName,
  onBack,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  // FIX BUG-11: receive typing state from parent (driven by useOwnerInbox socket listener)
  // instead of local dead state that was never set.
  externalTypingUser,
}: {
  room: InboxRoom;
  ownerId: string;
  ownerName: string;
  onBack: () => void;
  onSendMessage: (roomId: string, text: string) => void;
  onTypingStart: (roomId: string) => void;
  onTypingStop: (roomId: string) => void;
  externalTypingUser: string | null;
}) {
  const [text, setText] = useState("");
  // FIX BUG-11: removed dead local `typingUser` state — driven by externalTypingUser prop
  const endRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: clear input text when the room changes (switching conversations)
  const prevRoomIdRef = useRef(room.id);
  useEffect(() => {
    if (prevRoomIdRef.current !== room.id) {
      setText("");
      prevRoomIdRef.current = room.id;
      if (typingRef.current) clearTimeout(typingRef.current);
    }
  }, [room.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.messages, externalTypingUser]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(room.id, text.trim());
    setText("");
    onTypingStop(room.id);
    if (typingRef.current) clearTimeout(typingRef.current);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTypingStart(room.id);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => onTypingStop(room.id), 1500);
  };

  return (
    <div className="flex flex-col h-full inbox-slide">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-white border border-orange-100 flex items-center justify-center text-gray-500 hover:text-orange-500 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {room.petPhoto ? (
          <img src={room.petPhoto} alt={room.petName} className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-300 to-amber-300 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-none truncate">{room.seekerName}</p>
          <p className="text-xs text-orange-500 font-semibold mt-0.5 truncate">About {room.petName}</p>
        </div>

        <div className="flex gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
            <Video className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 inbox-scroll bg-gradient-to-b from-orange-50/30 to-white">
        {room.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-orange-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-sm">
                {room.seekerName} is interested in {room.petName}
              </p>
              <p className="text-xs text-gray-400 mt-1">Reply to start the conversation!</p>
            </div>
            <button
              onClick={() => setText(`Hi ${room.seekerName}! Thanks for your interest in ${room.petName} 🐾`)}
              className="text-xs px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold hover:bg-orange-200 transition-colors"
            >
              👋 Say hello
            </button>
          </div>
        )}

        {room.messages.map(msg => (
          <Bubble key={msg.id} msg={msg} isOwner={msg.senderId === ownerId} />
        ))}

        {/* FIX BUG-11: use externalTypingUser driven by socket, not dead local state */}
        {externalTypingUser && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm">🐾</div>
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-orange-100 shadow-sm flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-1">{externalTypingUser}</span>
              {[0, 1, 2].map(i => (
                <div key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-orange-400" />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-orange-100/60 bg-white/80">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={handleChange}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={`Reply to ${room.seekerName}…`}
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
              text.trim()
                ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200 hover:scale-105"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── OwnerInbox (main export) ───────────────────────────────────────────────*/
interface OwnerInboxProps {
  rooms: InboxRoom[];
  activeRoom: InboxRoom | null;
  activeRoomId: string | null;
  totalUnread: number;
  isConnected: boolean;
  ownerId: string;
  ownerName: string;
  // FIX BUG-11: typingUser is now passed from parent (Dashboard) via useOwnerInbox
  typingUser: string | null;
  onOpenRoom: (roomId: string) => void;
  onCloseRoom: () => void;
  onSendMessage: (roomId: string, text: string) => void;
  onTypingStart: (roomId: string) => void;
  onTypingStop: (roomId: string) => void;
}

export default function OwnerInbox({
  rooms,
  activeRoom,
  activeRoomId,
  totalUnread,
  isConnected,
  ownerId,
  ownerName,
  typingUser,
  onOpenRoom,
  onCloseRoom,
  onSendMessage,
  onTypingStart,
  onTypingStop,
}: OwnerInboxProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = rooms.filter(
    r => !searchTerm ||
      r.seekerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.petName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="inbox-root h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {activeRoom ? (
          <ChatPanel
            room={activeRoom}
            ownerId={ownerId}
            ownerName={ownerName}
            onBack={onCloseRoom}
            onSendMessage={onSendMessage}
            onTypingStart={onTypingStart}
            onTypingStop={onTypingStop}
            // FIX BUG-11: pass socket-driven typing state down
            externalTypingUser={typingUser}
          />
        ) : (
          <div className="flex flex-col h-full inbox-in">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black badge-pop">
                      {totalUnread}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                  isConnected
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                )}>
                  {isConnected ? (
                    <><Circle className="w-2 h-2 fill-green-500 text-green-500" />Live</>
                  ) : (
                    <><WifiOff className="w-3 h-3" />Offline</>
                  )}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto inbox-scroll">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-orange-300" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {searchTerm ? "No results" : "No messages yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {searchTerm
                        ? "Try a different search term."
                        : "When someone likes your pet on Pet Companion, their message will appear here."}
                    </p>
                  </div>
                </div>
              ) : (
                filtered.map(room => (
                  <ConversationRow
                    key={room.id}
                    room={room}
                    isActive={room.id === activeRoomId}
                    ownerId={ownerId}
                    onClick={() => onOpenRoom(room.id)}
                  />
                ))
              )}
            </div>

            {/* Footer stats */}
            {rooms.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/60">
                <span className="text-xs text-gray-500">
                  {rooms.length} conversation{rooms.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updates in real-time
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
