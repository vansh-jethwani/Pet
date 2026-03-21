/**
 * client/pages/Chat.tsx
 *
 * Fixes:
 * 1. ICE servers imported from @/lib/iceServers.ts (uses Metered TURN credentials)
 * 2. Socket connects to window.location.origin (works on localhost, LAN, ngrok)
 * 3. ngrok-skip-browser-warning header
 * 4. Proper ICE candidate buffering
 */

import {
  useState, useRef, useEffect, useCallback, useMemo,
} from "react";
import { useUser } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { ICE_SERVERS } from "@/lib/iceServers";
import {
  Send, Phone, Video, PhoneOff, Mic, MicOff, VideoOff,
  Search, PawPrint, Circle, Wifi, WifiOff, CheckCheck,
  ArrowLeft, PhoneIncoming, MessageSquare, Users,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
interface ChatMessage {
  id: string; roomId: string; senderId: string; senderName: string;
  senderAvatar: string; text: string; timestamp: string; type: "text" | "system";
}

interface ConvRoom {
  id: string; petId: string; petName: string; petPhoto: string;
  ownerId: string; ownerName: string; seekerId: string; seekerName: string;
  seekerAvatar: string; messages: ChatMessage[]; createdAt: string; unread: number;
}

type CallStatus = "idle" | "calling" | "voice_calling" | "incoming" | "connected" | "voice_connected" | "ended";

interface CallInfo {
  status: CallStatus; callType?: "video" | "voice";
  callerName?: string; callerAvatar?: string; callerId?: string; remoteSocket?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
.ch { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.ch-mono { font-family: 'JetBrains Mono', monospace; }
@keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes popIn    { 0%{transform:scale(.85);opacity:0} 65%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
@keyframes msgMe    { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:none} }
@keyframes msgThem  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes ring     { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.5)} 70%{box-shadow:0 0 0 14px rgba(249,115,22,0)} }
@keyframes dotBounce{ 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
@keyframes badgePop { 0%{transform:scale(0)} 65%{transform:scale(1.35)} 100%{transform:scale(1)} }
.anim-fadeUp  { animation:fadeUp  .28s cubic-bezier(.34,1.56,.64,1) both; }
.anim-popIn   { animation:popIn   .24s cubic-bezier(.34,1.56,.64,1) both; }
.anim-msgMe   { animation:msgMe   .18s ease both; }
.anim-msgThem { animation:msgThem .18s ease both; }
.anim-badge   { animation:badgePop .2s cubic-bezier(.34,1.56,.64,1) both; }
.anim-pulse   { animation:pulse 1.6s ease-in-out infinite; }
.anim-ring    { animation:ring  1.8s ease-in-out infinite; }
.typing-dot { animation:dotBounce 1.4s ease-in-out infinite; }
.typing-dot:nth-child(2){ animation-delay:.18s }
.typing-dot:nth-child(3){ animation-delay:.36s }
.scroll-thin::-webkit-scrollbar { width:4px; }
.scroll-thin::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
.scroll-side::-webkit-scrollbar { width:3px; }
.scroll-side::-webkit-scrollbar-thumb { background:#fed7aa; border-radius:99px; }
.conv-row { transition:background .12s ease; border-left:3px solid transparent; }
.conv-row:hover { background:#fff7ed; border-left-color:#fed7aa; }
.conv-row.active { background:linear-gradient(90deg,#fff7ed 0%,#fffbeb 100%); border-left-color:#f97316; }
.bubble-me { background:linear-gradient(135deg,#f97316,#f59e0b); border-radius:18px 18px 4px 18px; color:#fff; }
.bubble-them { background:#fff; border:1px solid #f1f5f9; border-radius:18px 18px 18px 4px; color:#1e293b; box-shadow:0 1px 3px rgba(0,0,0,.06); }
.call-bg { backdrop-filter:blur(20px); background:rgba(15,23,42,.9); }
.vring { position:relative; }
.vring::before,.vring::after { content:''; position:absolute; inset:-10px; border-radius:50%; border:2px solid rgba(249,115,22,.35); animation:ring 2s ease-in-out infinite; }
.vring::after { inset:-20px; animation-delay:.6s; }
.send-btn { transition:transform .12s ease; }
.send-btn:not(:disabled):hover { transform:scale(1.1); }
.send-btn:not(:disabled):active { transform:scale(.93); }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function getSocketUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function getSocketOptions() {
  return {
    transports: ["websocket", "polling"] as ("websocket" | "polling")[],
    path: "/socket.io",
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    extraHeaders: { "ngrok-skip-browser-warning": "true" },
  };
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDur(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function mergeRooms(prev: ConvRoom[], incoming: ConvRoom[]): ConvRoom[] {
  const map = new Map<string, ConvRoom>();
  prev.forEach((r) => map.set(r.id, r));
  incoming.forEach((r) => {
    const existing = map.get(r.id);
    map.set(r.id, { ...r, unread: existing ? existing.unread : r.unread });
  });
  return Array.from(map.values()).sort((a, b) => {
    const la = a.messages[a.messages.length - 1]?.timestamp ?? a.createdAt;
    const lb = b.messages[b.messages.length - 1]?.timestamp ?? b.createdAt;
    return lb.localeCompare(la);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */
function Av({ src, name, size = 9, className = "" }: { src?: string; name?: string; size?: number; className?: string }) {
  const [err, setErr] = useState(false);
  const sz = `w-${size} h-${size}`;
  if (!err && src && src.startsWith("http"))
    return <img src={src} alt={name} onError={() => setErr(true)} className={cn(sz, "rounded-full object-cover flex-shrink-0", className)} />;
  if (!err && src && src.length <= 4 && !src.startsWith("http"))
    return <div className={cn(sz, "rounded-full bg-orange-100 flex items-center justify-center text-base flex-shrink-0", className)}>{src}</div>;
  const ini = (name ?? "?").slice(0, 2).toUpperCase();
  return <div className={cn(sz, "rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0", className)}>{ini}</div>;
}

function PetAv({ photo, name, cls = "" }: { photo?: string; name: string; cls?: string }) {
  const [err, setErr] = useState(false);
  if (!err && photo)
    return <img src={photo} alt={name} onError={() => setErr(true)} className={cn("rounded-xl object-cover flex-shrink-0", cls)} />;
  return (
    <div className={cn("rounded-xl bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center flex-shrink-0", cls)}>
      <PawPrint className="w-1/2 h-1/2 text-orange-500" />
    </div>
  );
}

function IncomingBanner({ info, onVideo, onVoice, onReject }: {
  info: CallInfo; onVideo: () => void; onVoice: () => void; onReject: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-50 p-3 anim-popIn">
      <div className="mx-auto max-w-sm rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl border border-orange-500/20"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
        <div className="relative flex-shrink-0">
          <Av src={info.callerAvatar} name={info.callerName} size={12} className="ring-2 ring-orange-500/50 rounded-full" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-slate-900">
            <PhoneIncoming className="w-2.5 h-2.5 text-white" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{info.callerName}</p>
          <p className="text-orange-400 text-xs anim-pulse">Incoming {info.callType === "voice" ? "Voice" : "Video"} Call…</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onReject} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
            <PhoneOff className="w-4 h-4 text-white" />
          </button>
          {info.callType !== "voice" && (
            <button onClick={onVoice} className="w-10 h-10 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center transition-colors shadow-lg">
              <Phone className="w-4 h-4 text-white" />
            </button>
          )}
          <button onClick={info.callType === "voice" ? onVoice : onVideo}
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg anim-ring">
            {info.callType === "voice" ? <Phone className="w-4 h-4 text-white" /> : <Video className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function CallOverlay({ localStream, remoteStream, info, isMuted, isCameraOff, elapsed, onMute, onCam, onEnd }: {
  localStream: MediaStream | null; remoteStream: MediaStream | null; info: CallInfo;
  isMuted: boolean; isCameraOff: boolean; elapsed: number; onMute: () => void; onCam: () => void; onEnd: () => void;
}) {
  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);

  useEffect(() => { if (localRef.current && localStream) localRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => {
    if (!remoteStream) return;
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
    if (audioRef.current)  audioRef.current.srcObject  = remoteStream;
  }, [remoteStream]);

  const isVoice = info.callType === "voice" || info.status === "voice_connected" || info.status === "voice_calling";
  const isConn  = info.status === "connected" || info.status === "voice_connected";

  return (
    <div className="absolute inset-0 z-40 call-bg flex flex-col rounded-r-2xl overflow-hidden anim-popIn">
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      <div className="flex-1 relative flex items-center justify-center bg-slate-950">
        {!isVoice && remoteStream
          ? <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center gap-5">
              <div className="relative vring">
                <Av src={info.callerAvatar} name={info.callerName} size={28} className="ring-4 ring-orange-500/40" />
              </div>
              <div className="text-center">
                <p className="text-white text-xl font-bold">{info.callerName}</p>
                <p className="text-orange-400 text-sm mt-1 anim-pulse">
                  {isConn ? fmtDur(elapsed) : isVoice ? "Calling…" : "Ringing…"}
                </p>
              </div>
            </div>
          )
        }
        {!isVoice && (
          <div className="absolute top-4 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800">
            {isCameraOff
              ? <div className="w-full h-full flex items-center justify-center"><VideoOff className="w-6 h-6 text-white/30" /></div>
              : <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            }
          </div>
        )}
        {isConn && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-white text-xs font-medium ch-mono flex items-center gap-1.5">
              <Circle className="w-2 h-2 fill-green-400 text-green-400 anim-pulse" />
              {fmtDur(elapsed)}
            </span>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-center gap-4 py-5 px-4 border-t border-white/10">
        <button onClick={onMute} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg", isMuted ? "bg-red-500 text-white" : "bg-white/15 text-white hover:bg-white/25")}>
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        {!isVoice && (
          <button onClick={onCam} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg", isCameraOff ? "bg-red-500 text-white" : "bg-white/15 text-white hover:bg-white/25")}>
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}
        <button onClick={onEnd} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all hover:scale-105">
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const { user }  = useUser();
  const location  = useLocation();

  const myId     = user?.id        ?? "";
  const myName   = user?.firstName ?? user?.fullName ?? "You";
  const myAvatar = user?.imageUrl  ?? "🐾";

  const socketRef       = useRef<Socket | null>(null);
  const pcRef           = useRef<RTCPeerConnection | null>(null);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const remoteSocketRef = useRef<string | null>(null);
  const icePendingRef   = useRef<RTCIceCandidateInit[]>([]);
  const activeRoomIdRef = useRef<string | null>(null);
  const autoOpenDoneRef = useRef(false);
  const myIdRef         = useRef(myId);
  const myNameRef       = useRef(myName);
  const myAvatarRef     = useRef(myAvatar);
  const ringtoneCtxRef  = useRef<AudioContext | null>(null);
  const startRingRef    = useRef<() => void>(() => {});
  const stopRingRef     = useRef<() => void>(() => {});

  useEffect(() => { myIdRef.current     = myId;     }, [myId]);
  useEffect(() => { myNameRef.current   = myName;   }, [myName]);
  useEffect(() => { myAvatarRef.current = myAvatar; }, [myAvatar]);
  useEffect(() => {
    if (!myId) return;
    const s = socketRef.current as any;
    if (s?._doSubscribe) s._doSubscribe();
  }, [myId]);

  const [connected,    setConnected]        = useState(false);
  const [rooms,        setRooms]            = useState<ConvRoom[]>([]);
  const [activeRoomId, setActiveRoomIdState]= useState<string | null>(null);
  const [messages,     setMessages]         = useState<ChatMessage[]>([]);
  const [typingUser,   setTypingUser]       = useState<string | null>(null);
  const [inputText,    setInputText]        = useState("");
  const [searchQ,      setSearchQ]          = useState("");
  const [callInfo,     setCallInfo]         = useState<CallInfo>({ status: "idle" });
  const [localStream,  setLocalStream]      = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream]     = useState<MediaStream | null>(null);
  const [isMuted,      setIsMuted]          = useState(false);
  const [isCameraOff,  setIsCameraOff]      = useState(false);
  const [callElapsed,  setCallElapsed]      = useState(0);
  const [callError,    setCallError]        = useState<string | null>(null);
  const [showSidebar,  setShowSidebar]      = useState(true);

  const setActiveRoomId = useCallback((id: string | null) => {
    activeRoomIdRef.current = id;
    setActiveRoomIdState(id);
  }, []);

  const activeRoom  = useMemo(() => rooms.find((r) => r.id === activeRoomId) ?? null, [rooms, activeRoomId]);
  const totalUnread = useMemo(() => rooms.reduce((s, r) => s + r.unread, 0), [rooms]);

  useEffect(() => {
    if (callInfo.status !== "connected" && callInfo.status !== "voice_connected") { setCallElapsed(0); return; }
    const t = setInterval(() => setCallElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [callInfo.status]);

  const msgEndRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUser]);

  /* ── WebRTC helpers ─────────────────────────────────────────────────────── */
  const cleanupCall = useCallback(() => {
    pcRef.current?.close(); pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop()); localStreamRef.current = null;
    setLocalStream(null); setRemoteStream(null);
    remoteSocketRef.current = null; icePendingRef.current = [];
    setIsMuted(false); setIsCameraOff(false);
  }, []);

  const getPC = useCallback((): RTCPeerConnection => {
    if (pcRef.current) {
      const s = pcRef.current.connectionState;
      if (s !== "closed" && s !== "failed" && s !== "disconnected") return pcRef.current;
      pcRef.current.close(); pcRef.current = null;
    }
    // Uses ICE_SERVERS from @/lib/iceServers.ts which reads VITE_TURN_USERNAME
    // and VITE_TURN_CREDENTIAL from your .env file
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && remoteSocketRef.current && socketRef.current) {
        socketRef.current.emit("webrtc_ice_candidate", {
          roomId: activeRoomIdRef.current, candidate: e.candidate.toJSON(),
          targetSocketId: remoteSocketRef.current,
        });
      }
    };
    pc.oniceconnectionstatechange = () => console.log("[WebRTC] ICE:", pc.iceConnectionState);
    pc.ontrack = (e) => { console.log("[WebRTC] Got remote track:", e.track.kind); setRemoteStream(e.streams[0]); };
    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallInfo((prev) => ({ ...prev, status: prev.callType === "voice" ? "voice_connected" : "connected" }));
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        stopRingRef.current(); cleanupCall();
        setCallInfo({ status: "ended" }); setTimeout(() => setCallInfo({ status: "idle" }), 2500);
      }
    };
    return pc;
  }, [cleanupCall]);

  const addTracksToPC = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    const existing = new Set(pc.getSenders().map((s) => s.track?.id));
    stream.getTracks().forEach((track) => { if (!existing.has(track.id)) pc.addTrack(track, stream); });
  }, []);

  const createAndSendOffer = useCallback(async (targetSocketId: string) => {
    const pc = pcRef.current; if (!pc) return;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("webrtc_offer", { roomId: activeRoomIdRef.current, offer, targetSocketId });
    } catch (err) { console.error("[WebRTC] createOffer failed:", err); }
  }, []);

  /* ── Ringtone ───────────────────────────────────────────────────────────── */
  const startRingtone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ringtoneCtxRef.current = ctx;
      const playBeep = (t: number) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = "sine";
        osc.frequency.setValueAtTime(480, t); osc.frequency.setValueAtTime(420, t + 0.4);
        gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.start(t); osc.stop(t + 0.8);
      };
      for (let i = 0; i < 3; i++) playBeep(ctx.currentTime + i * 1.5);
    } catch {}
  }, []);

  const stopRingtone = useCallback(() => {
    try { ringtoneCtxRef.current?.close(); ringtoneCtxRef.current = null; } catch {}
  }, []);

  useEffect(() => { startRingRef.current = startRingtone; }, [startRingtone]);
  useEffect(() => { stopRingRef.current  = stopRingtone;  }, [stopRingtone]);

  /* ── Media ──────────────────────────────────────────────────────────────── */
  async function acquireMedia(video: boolean): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = video
      ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
      : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false };
    try { return await navigator.mediaDevices.getUserMedia(constraints); }
    catch (err: any) {
      if (video) { try { return await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); } catch {} }
      const n = err?.name ?? "";
      if (n === "NotAllowedError" || n === "PermissionDeniedError") throw new Error("Camera/microphone permission denied. Please allow access in your browser settings.");
      if (n === "NotFoundError") throw new Error("No camera or microphone found.");
      if (n === "NotReadableError") throw new Error("Camera/microphone is already in use by another application.");
      throw new Error("Could not access camera/microphone. Please check browser permissions.");
    }
  }

  /* ── Socket.io setup ────────────────────────────────────────────────────── */
  useEffect(() => {
    const socket = io(`${getSocketUrl()}/chat`, getSocketOptions());
    socketRef.current = socket;

    const doSubscribe = () => {
      const id = myIdRef.current; const name = myNameRef.current;
      if (!id || !socket.connected) return;
      socket.emit("owner_subscribe",  { ownerId: id,  ownerName: name });
      socket.emit("seeker_subscribe", { seekerId: id, seekerName: name });
    };

    socket.on("connect",       () => { setConnected(true);  doSubscribe(); });
    socket.on("connect_error", (err) => console.error("[Chat] Socket error:", err.message));
    socket.on("disconnect",    (r)   => { console.warn("[Chat] Disconnected:", r); setConnected(false); });
    (socket as any)._doSubscribe = doSubscribe;

    socket.on("owner_inbox",  (data: { rooms: ConvRoom[] }) => setRooms((prev) => mergeRooms(prev, data.rooms.map((r) => ({ ...r, unread: 0 })))));
    socket.on("seeker_inbox", (data: { rooms: ConvRoom[] }) => setRooms((prev) => mergeRooms(prev, data.rooms.map((r) => ({ ...r, unread: 0 })))));
    socket.on("new_conversation", (data: { room: ConvRoom }) => setRooms((prev) => mergeRooms(prev, [{ ...data.room, unread: 1 }])));

    socket.on("room_joined", (data: { roomId: string; messages: ChatMessage[]; petPhoto?: string; petId?: string; petName?: string; ownerId?: string; ownerName?: string; seekerId?: string; seekerName?: string; seekerAvatar?: string }) => {
      setMessages(data.messages);
      setRooms((prev) => {
        const exists = prev.some((r) => r.id === data.roomId);
        if (exists) return prev.map((r) => r.id === data.roomId ? { ...r, messages: data.messages, petPhoto: data.petPhoto ?? r.petPhoto, unread: 0 } : r);
        const auto = (location.state as any)?.autoOpen;
        if (auto) {
          const newRoom: ConvRoom = {
            id: data.roomId, petId: data.petId ?? auto.petId ?? "", petName: data.petName ?? auto.petName ?? "",
            petPhoto: data.petPhoto ?? auto.petPhoto ?? "", ownerId: data.ownerId ?? auto.ownerId ?? "",
            ownerName: data.ownerName ?? auto.ownerName ?? "", seekerId: data.seekerId ?? myIdRef.current ?? "",
            seekerName: data.seekerName ?? myNameRef.current ?? "", seekerAvatar: data.seekerAvatar ?? myAvatarRef.current ?? "",
            messages: data.messages, createdAt: new Date().toISOString(), unread: 0,
          };
          return [newRoom, ...prev];
        }
        return prev;
      });
    });

    socket.on("room_messages", (data: { roomId: string; messages: ChatMessage[] }) => {
      if (data.roomId === activeRoomIdRef.current) setMessages(data.messages);
    });

    socket.on("new_message", (msg: ChatMessage) => {
      if (msg.roomId === activeRoomIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const optIdx = prev.findIndex((m) => m.id.startsWith("opt_") && m.senderId === msg.senderId && m.text === msg.text && Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000);
          if (optIdx !== -1) { const next = [...prev]; next[optIdx] = msg; return next; }
          return [...prev, msg];
        });
      } else {
        setRooms((prev) => prev.map((r) => { if (r.id !== msg.roomId || r.messages.some((m) => m.id === msg.id)) return r; return { ...r, messages: [...r.messages, msg] }; }));
      }
    });

    socket.on("inbox_message", (data: { roomId: string; message: ChatMessage }) => {
      const { roomId, message: msg } = data;
      if (roomId === activeRoomIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const optIdx = prev.findIndex((m) => m.id.startsWith("opt_") && m.senderId === msg.senderId && m.text === msg.text && Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000);
          if (optIdx !== -1) { const next = [...prev]; next[optIdx] = msg; return next; }
          return [...prev, msg];
        });
        setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, unread: 0 } : r));
      } else {
        setRooms((prev) => prev.map((r) => { if (r.id !== roomId || r.messages.some((m) => m.id === msg.id)) return r; return { ...r, messages: [...r.messages, msg], unread: r.unread + 1 }; }));
      }
    });

    socket.on("user_typing",         ({ userName: n }: { userName: string }) => setTypingUser(n));
    socket.on("user_stopped_typing", () => setTypingUser(null));

    socket.on("incoming_call", (data: { roomId: string; callerId: string; callerName: string; callerAvatar: string; callType: "video" | "voice"; socketId: string }) => {
      remoteSocketRef.current = data.socketId;
      setCallInfo({ status: "incoming", callerName: data.callerName, callerAvatar: data.callerAvatar, callerId: data.callerId, callType: data.callType, remoteSocket: data.socketId });
      startRingRef.current();
    });

    socket.on("call_accepted", async (data: { answererName: string; callType: "video" | "voice"; socketId: string }) => {
      stopRingRef.current(); remoteSocketRef.current = data.socketId;
      setCallInfo((prev) => ({ ...prev, status: data.callType === "voice" ? "voice_connected" : "connected", remoteSocket: data.socketId, callType: data.callType }));
      await createAndSendOffer(data.socketId);
    });

    socket.on("call_rejected", () => { stopRingRef.current(); setCallInfo({ status: "ended" }); setTimeout(() => setCallInfo({ status: "idle" }), 2500); cleanupCall(); });
    socket.on("call_ended",    () => { stopRingRef.current(); setCallInfo({ status: "ended" }); setTimeout(() => setCallInfo({ status: "idle" }), 2000); cleanupCall(); });

    socket.on("webrtc_offer", async (data: { offer: RTCSessionDescriptionInit; fromSocketId: string }) => {
      remoteSocketRef.current = data.fromSocketId;
      let pc = pcRef.current;
      if (!pc) { pc = getPC(); if (localStreamRef.current) addTracksToPC(pc, localStreamRef.current); }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        for (const c of icePendingRef.current) await pc.addIceCandidate(new RTCIceCandidate(c));
        icePendingRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", { roomId: activeRoomIdRef.current, answer, targetSocketId: data.fromSocketId });
      } catch (err) { console.error("[WebRTC] offer handling failed:", err); }
    });

    socket.on("webrtc_answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current; if (!pc) return;
      try { if (pc.signalingState === "have-local-offer") { await pc.setRemoteDescription(new RTCSessionDescription(data.answer)); for (const c of icePendingRef.current) await pc.addIceCandidate(new RTCIceCandidate(c)); icePendingRef.current = []; } }
      catch (err) { console.error("[WebRTC] answer failed:", err); }
    });

    socket.on("webrtc_ice_candidate", async (data: { candidate: RTCIceCandidateInit | null }) => {
      if (!data.candidate) return;
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) { icePendingRef.current.push(data.candidate); return; }
      try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); }
      catch (err) { console.warn("[WebRTC] addIceCandidate:", err); }
    });

    return () => { socket.disconnect(); cleanupCall(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Open room ───────────────────────────────────────────────────────────── */
  const openRoom = useCallback((room: ConvRoom) => {
    setActiveRoomId(room.id); setMessages([]); setShowSidebar(false);
    setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, unread: 0 } : r));
    const id = myIdRef.current; const name = myNameRef.current;
    const isOwner = room.ownerId === id || room.ownerName === id || room.ownerName === name;
    if (isOwner) {
      socketRef.current?.emit("owner_join_room", { roomId: room.id, ownerId: id, ownerName: name });
    } else {
      socketRef.current?.emit("join_room", { petId: room.petId, petName: room.petName, petPhoto: room.petPhoto, ownerId: room.ownerId, ownerName: room.ownerName, seekerId: id, seekerName: name, seekerAvatar: myAvatarRef.current });
    }
  }, [setActiveRoomId]);

  /* ── Auto-open ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const state = location.state as { autoOpen?: { petId: string; petName: string; petPhoto?: string; ownerId: string; ownerName: string; ownerAvatar?: string } } | null;
    const auto = state?.autoOpen;
    if (!auto || !myId || autoOpenDoneRef.current || !connected) return;
    autoOpenDoneRef.current = true;
    const roomId = `pet_${auto.petId}_seeker_${myId}`;
    const existing = rooms.find((r) => r.id === roomId);
    if (existing) { openRoom(existing); } else {
      setActiveRoomId(roomId); setShowSidebar(false);
      socketRef.current?.emit("join_room", { petId: auto.petId, petName: auto.petName, petPhoto: auto.petPhoto ?? "", ownerId: auto.ownerId, ownerName: auto.ownerName, seekerId: myId, seekerName: myNameRef.current, seekerAvatar: myAvatarRef.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, rooms, connected]);

  /* ── Send message ────────────────────────────────────────────────────────── */
  const sendMessage = useCallback(() => {
    const text = inputText.trim(); const roomId = activeRoomIdRef.current; const socket = socketRef.current;
    if (!text || !roomId || !socket) return;
    const senderId = myIdRef.current || "guest";
    const opt: ChatMessage = { id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, roomId, senderId, senderName: myNameRef.current, senderAvatar: myAvatarRef.current, text, timestamp: new Date().toISOString(), type: "text" };
    setMessages((prev) => [...prev, opt]);
    socket.emit("send_message", { roomId, senderId, senderName: myNameRef.current, senderAvatar: myAvatarRef.current, text });
    setInputText(""); socket.emit("typing_stop", { roomId });
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, [inputText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const rid = activeRoomIdRef.current; if (!rid) return;
    socketRef.current?.emit("typing_start", { roomId: rid, userName: myNameRef.current });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit("typing_stop", { roomId: rid }), 1500);
  };

  /* ── Call handlers ───────────────────────────────────────────────────────── */
  const startCall = useCallback(async (type: "video" | "voice") => {
    if (!activeRoomIdRef.current) return;
    setCallError(null);
    try {
      cleanupCall();
      const stream = await acquireMedia(type === "video");
      localStreamRef.current = stream; setLocalStream(stream);
      const pc = getPC(); addTracksToPC(pc, stream);
      setCallInfo({ status: type === "voice" ? "voice_calling" : "calling", callType: type });
      startRingtone();
      socketRef.current?.emit("call_initiate", { roomId: activeRoomIdRef.current, callerId: myIdRef.current, callerName: myNameRef.current, callerAvatar: myAvatarRef.current, callType: type });
    } catch (err: any) { setCallError(err?.message ?? "Could not start call."); cleanupCall(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPC, addTracksToPC, startRingtone, cleanupCall]);

  const acceptCall = useCallback(async (type: "video" | "voice") => {
    stopRingtone(); setCallError(null);
    try {
      const stream = await acquireMedia(type === "video");
      localStreamRef.current = stream; setLocalStream(stream);
      const pc = getPC(); addTracksToPC(pc, stream);
      setCallInfo((prev) => ({ ...prev, status: type === "voice" ? "voice_connected" : "connected", callType: type }));
      socketRef.current?.emit("call_accepted", { roomId: activeRoomIdRef.current, callerId: callInfo.callerId, answererName: myNameRef.current, callType: type });
    } catch (err: any) { setCallError(err?.message ?? "Could not access camera/microphone."); socketRef.current?.emit("call_rejected", { roomId: activeRoomIdRef.current, reason: "Permission denied" }); setCallInfo({ status: "idle" }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callInfo.callerId, getPC, addTracksToPC, stopRingtone]);

  const rejectCall = useCallback(() => { stopRingtone(); socketRef.current?.emit("call_rejected", { roomId: activeRoomIdRef.current }); setCallInfo({ status: "idle" }); }, [stopRingtone]);
  const endCall    = useCallback(() => { stopRingtone(); socketRef.current?.emit("call_ended", { roomId: activeRoomIdRef.current }); cleanupCall(); setCallInfo({ status: "idle" }); }, [cleanupCall, stopRingtone]);
  const toggleMute   = useCallback(() => { const t = localStreamRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); } }, []);
  const toggleCamera = useCallback(() => { const t = localStreamRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setIsCameraOff(!t.enabled); } }, []);

  const callActive   = ["calling","voice_calling","connected","voice_connected"].includes(callInfo.status);
  const filteredRooms = useMemo(() => rooms.filter((r) => !searchQ || r.seekerName.toLowerCase().includes(searchQ.toLowerCase()) || r.ownerName.toLowerCase().includes(searchQ.toLowerCase()) || r.petName.toLowerCase().includes(searchQ.toLowerCase())), [rooms, searchQ]);
  const otherName     = activeRoom ? (activeRoom.ownerId === myId || activeRoom.ownerName === myName) ? activeRoom.seekerName : activeRoom.ownerName : "";

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{STYLES}</style>
      <div className="ch min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Header />
        <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 py-10 sm:py-14">
          <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-2 opacity-75 text-xs font-bold uppercase tracking-widest"><MessageSquare className="w-4 h-4" /> Pet Conversations</div>
                <h1 className="text-4xl sm:text-5xl font-black mb-2">Messages</h1>
                <p className="text-white/70 text-sm max-w-md">Chat with pet owners &amp; seekers. Voice and video calls built-in.</p>
              </div>
              <div className="flex gap-3">
                {[{ label: "Chats", val: rooms.length }, { label: "Unread", val: totalUnread }].map(({ label, val }) => (
                  <div key={label} className="bg-white/15 border border-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 text-white text-center min-w-[80px]">
                    <p className="text-3xl font-black">{val}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mt-0.5">{label}</p>
                  </div>
                ))}
                <div className={cn("bg-white/15 border backdrop-blur-sm rounded-2xl px-4 py-3 text-center min-w-[80px]", connected ? "border-green-400/40" : "border-red-400/40")}>
                  {connected ? <Wifi className="w-5 h-5 mx-auto text-green-300 mb-1" /> : <WifiOff className="w-5 h-5 mx-auto text-red-300 mb-1" />}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{connected ? "Live" : "Away"}</p>
                </div>
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 28" preserveAspectRatio="none"><path d="M0,28 C480,0 960,0 1440,28 L1440,28 L0,28 Z" fill="rgb(255,247,237)" /></svg>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden flex" style={{ height: "calc(100vh - 272px)", minHeight: 520 }}>

            {/* SIDEBAR */}
            <div className={cn("flex-shrink-0 border-r border-gray-100 flex flex-col w-full sm:w-80 lg:w-96", !showSidebar && activeRoom ? "hidden sm:flex" : "flex")}>
              <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900">Inbox</h2>
                    {totalUnread > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black anim-badge">{totalUnread}</span>}
                  </div>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5", connected ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200")}>
                    <Circle className={cn("w-2 h-2 fill-current", connected ? "text-green-500" : "text-gray-400")} />
                    {connected ? "Live" : "Offline"}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search conversations…" className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scroll-side">
                {!user ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center"><Users className="w-7 h-7 text-orange-300" /></div>
                    <p className="font-bold text-gray-800">Sign in to chat</p>
                    <Link to="/signin" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">Sign In</Link>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center"><MessageSquare className="w-7 h-7 text-orange-300" /></div>
                    <div>
                      <p className="font-bold text-gray-800">{searchQ ? "No results" : "No conversations yet"}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{searchQ ? "Try a different search term." : "Like a pet on Breeding Match to start a conversation."}</p>
                    </div>
                    {!searchQ && <Link to="/breeding" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">Browse Pets</Link>}
                  </div>
                ) : (
                  filteredRooms.map((room, i) => {
                    const last = room.messages.length > 0 ? room.messages[room.messages.length - 1] : undefined;
                    const isActive = room.id === activeRoomId;
                    const amOwner = room.ownerId === myId || room.ownerName === myName;
                    const other = amOwner ? room.seekerName : room.ownerName;
                    const otherAv = amOwner ? room.seekerAvatar : undefined;
                    return (
                      <div key={room.id} className={cn("conv-row flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer anim-fadeUp select-none", isActive && "active")} style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }} onClick={() => openRoom(room)}>
                        <div className="relative flex-shrink-0">
                          <PetAv photo={room.petPhoto} name={room.petName} cls="w-12 h-12" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white overflow-hidden"><Av src={otherAv} name={other} size={6} /></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={cn("font-bold text-sm truncate", isActive ? "text-orange-600" : "text-gray-900")}>{other}</p>
                            {last && <span className="text-[10px] text-gray-400 flex-shrink-0 ch-mono">{timeAgo(last.timestamp)}</span>}
                          </div>
                          <p className="text-xs text-orange-500 font-semibold truncate">{room.petName}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{last ? (last.senderId === myId ? `You: ${last.text}` : last.text) : "Tap to open chat"}</p>
                        </div>
                        {room.unread > 0 && <div className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 anim-badge">{room.unread > 9 ? "9+" : room.unread}</div>}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-5 py-2.5 border-t border-gray-100 flex-shrink-0 bg-orange-50/40 text-center">
                <p className="text-[11px] text-gray-400">{rooms.length} conversation{rooms.length !== 1 ? "s" : ""} · Real-time</p>
              </div>
            </div>

            {/* CHAT PANEL */}
            <div className={cn("flex-1 flex flex-col relative min-w-0", showSidebar && !activeRoom ? "hidden sm:flex" : "flex")}>
              {callInfo.status === "incoming" && <IncomingBanner info={callInfo} onVideo={() => acceptCall("video")} onVoice={() => acceptCall("voice")} onReject={rejectCall} />}
              {callActive && <CallOverlay localStream={localStream} remoteStream={remoteStream} info={callInfo} isMuted={isMuted} isCameraOff={isCameraOff} elapsed={callElapsed} onMute={toggleMute} onCam={toggleCamera} onEnd={endCall} />}
              {callInfo.status === "ended" && <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full anim-popIn shadow-xl">Call ended</div>}

              {!activeRoom ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center border-2 border-dashed border-orange-200"><MessageSquare className="w-10 h-10 text-orange-400" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Select a Conversation</h3>
                    <p className="text-gray-500 text-sm max-w-xs">Choose from the sidebar, or like a pet on Breeding Match to start chatting.</p>
                  </div>
                  <Link to="/breeding" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-md">Browse Pets</Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white/80 backdrop-blur-sm">
                    <button className="sm:hidden w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center" onClick={() => setShowSidebar(true)}><ArrowLeft className="w-4 h-4 text-gray-500" /></button>
                    <PetAv photo={activeRoom.petPhoto} name={activeRoom.petName} cls="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">{otherName}</p>
                      <p className="text-xs text-orange-500 font-semibold truncate">{activeRoom.ownerId === myId || activeRoom.ownerName === myName ? "Interested in " : "Owner of "}{activeRoom.petName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startCall("voice")} disabled={callInfo.status !== "idle" || !connected} title="Voice call" className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", callInfo.status !== "idle" || !connected ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-100 text-green-600 hover:bg-green-200")}><Phone className="w-4 h-4" /></button>
                      <button onClick={() => startCall("video")} disabled={callInfo.status !== "idle" || !connected} title="Video call" className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", callInfo.status !== "idle" || !connected ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-orange-100 text-orange-600 hover:bg-orange-200")}><Video className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-thin bg-gradient-to-b from-orange-50/20 to-white">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10 anim-fadeUp">
                        <PetAv photo={activeRoom.petPhoto} name={activeRoom.petName} cls="w-16 h-16 shadow-md" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{activeRoom.ownerId === myId || activeRoom.ownerName === myName ? `${activeRoom.seekerName} is interested in ${activeRoom.petName}!` : `Start your conversation about ${activeRoom.petName}`}</p>
                          <p className="text-xs text-gray-400 mt-1">Say hello to get started 👋</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(activeRoom.ownerId === myId || activeRoom.ownerName === myName
                            ? [`Hi ${activeRoom.seekerName}! Thanks for your interest 🐾`, "Happy to answer any questions!", "Would you like to schedule a meeting?"]
                            : [`Hi! I'm interested in ${activeRoom.petName} 🐾`, "Can you share more details?", "Is the pet still available?"]
                          ).map((s) => <button key={s} onClick={() => setInputText(s)} className="text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors">{s}</button>)}
                        </div>
                      </div>
                    )}
                    {messages.map((msg, i) => {
                      const isMe = msg.senderId === myId;
                      if (msg.type === "system") return <div key={msg.id} className="flex justify-center"><span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.text}</span></div>;
                      return (
                        <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "flex-row-reverse anim-msgMe" : "anim-msgThem")} style={{ animationDelay: `${Math.min(i, 5) * 25}ms` }}>
                          {!isMe && <Av src={msg.senderAvatar} name={msg.senderName} size={8} className="mb-0.5" />}
                          <div className={cn("max-w-[72%] px-4 py-2.5 text-sm shadow-sm", isMe ? "bubble-me" : "bubble-them")}>
                            {!isMe && <p className="text-[10px] font-bold text-orange-500 mb-0.5">{msg.senderName}</p>}
                            <p className="leading-relaxed break-words">{msg.text}</p>
                            <div className={cn("flex items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                              <span className={cn("text-[10px] ch-mono", isMe ? "text-white/60" : "text-gray-400")}>{fmtTime(msg.timestamp)}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-white/60" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {typingUser && (
                      <div className="flex items-end gap-2 anim-msgThem">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">🐾</div>
                        <div className="bubble-them px-4 py-3 flex items-center gap-1 shadow-sm">
                          <span className="text-xs text-gray-400 mr-1.5">{typingUser}</span>
                          {[0, 1, 2].map((i) => <div key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-orange-400" />)}
                        </div>
                      </div>
                    )}
                    <div ref={msgEndRef} />
                  </div>

                  <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white/90">
                    <div className="flex items-center gap-2.5">
                      <input ref={inputRef} value={inputText} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={`Message ${otherName}…`} className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-gray-400" />
                      <button onClick={sendMessage} disabled={!inputText.trim()} className={cn("send-btn w-11 h-11 rounded-2xl flex items-center justify-center", inputText.trim() ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200" : "bg-gray-100 text-gray-400 cursor-not-allowed")}><Send className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => startCall("voice")} disabled={callInfo.status !== "idle" || !connected} className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", callInfo.status !== "idle" || !connected ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-100 text-green-700 hover:bg-green-200")}><Phone className="w-3 h-3" /> Voice Call</button>
                      <button onClick={() => startCall("video")} disabled={callInfo.status !== "idle" || !connected} className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors", callInfo.status !== "idle" || !connected ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-orange-100 text-orange-700 hover:bg-orange-200")}><Video className="w-3 h-3" /> Video Call</button>
                      {!connected && <span className="ml-auto text-xs text-gray-400 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Reconnecting…</span>}
                    </div>
                    {callError && (
                      <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                        <span>⚠️ {callError}</span>
                        <button onClick={() => setCallError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
