import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X, Send, Phone, PhoneOff, Video, VideoOff,
  Mic, MicOff, Minimize2, Maximize2, Wifi, WifiOff, CheckCheck,
  PhoneIncoming
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat, ChatMessage } from "@/hooks/useChat";

export interface ChatTarget {
  petId: string;
  petName: string;
  petPhoto?: string;
  ownerId?: string;   // Clerk user ID of the owner — may be absent for demo pets
  ownerName: string;
  ownerAvatar?: string;
}

interface PetChatProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  target: ChatTarget;
  onClose: () => void;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  .chat-widget { font-family: 'Syne', sans-serif; }
  .chat-mono   { font-family: 'DM Mono', monospace; }

  @keyframes chat-slide-up   { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes chat-pop        { 0%{transform:scale(.92);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
  @keyframes chat-pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,.6)} 50%{box-shadow:0 0 0 14px rgba(251,146,60,0)} }
  @keyframes chat-blink      { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes chat-msg-in     { from{transform:translateX(-12px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes chat-msg-out    { from{transform:translateX(12px);opacity:0}  to{transform:translateX(0);opacity:1} }
  @keyframes typing-dot      { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

  .chat-slide-up    { animation: chat-slide-up .32s cubic-bezier(.34,1.56,.64,1) both; }
  .chat-pop         { animation: chat-pop .28s cubic-bezier(.34,1.56,.64,1) both; }
  .chat-pulse-ring  { animation: chat-pulse-ring 2s ease-in-out infinite; }
  .chat-blink       { animation: chat-blink 1.2s ease-in-out infinite; }
  .chat-msg-in      { animation: chat-msg-in .22s ease both; }
  .chat-msg-out     { animation: chat-msg-out .22s ease both; }

  .typing-dot:nth-child(1){animation:typing-dot 1.4s ease-in-out infinite}
  .typing-dot:nth-child(2){animation:typing-dot 1.4s ease-in-out .2s infinite}
  .typing-dot:nth-child(3){animation:typing-dot 1.4s ease-in-out .4s infinite}

  .chat-scrollbar::-webkit-scrollbar{width:3px}
  .chat-scrollbar::-webkit-scrollbar-thumb{background:#fed7aa;border-radius:999px}
  .glass-dark  { background:rgba(15,15,15,.82); backdrop-filter:blur(20px); }
  .glass-light { background:rgba(255,255,255,.94); backdrop-filter:blur(20px); }
`;

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 chat-msg-in">
      <div className="text-xl">🐾</div>
      <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-orange-100 shadow-sm flex items-center gap-1.5">
        <span className="text-xs text-gray-400 mr-1">{name}</span>
        {[0,1,2].map(i => <div key={i} className="typing-dot w-2 h-2 rounded-full bg-orange-400" />)}
      </div>
    </div>
  );
}

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const time = new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  
  const isSystem = msg.type === "system";
  // Defensive: check if text looks like a call log JSON even if type is not "call_log"
  const isCallLog = msg.type === "call_log" || (msg.text.startsWith('{"type":') && msg.text.includes('"status":'));

  if (isSystem)
    return <div className="flex justify-center"><span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.text}</span></div>;
  
  if (isCallLog) {
    let data = { type: "video" as "video"|"voice", status: "missed", duration: 0 };
    try { data = JSON.parse(msg.text); } catch (e) {}
    const isVideo = data.type === "video";
    const Icon = data.status === "missed" || data.status === "rejected" ? PhoneOff : (isVideo ? Video : Phone);
    const label = data.status === "missed" ? `Missed ${data.type} call` : 
                  data.status === "rejected" ? `${data.type} call declined` :
                  `${isVideo ? "Video" : "Voice"} call, ${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, "0")}`;
    
    return (
      <div className="flex justify-center my-2 chat-pop">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", 
            data.status === "missed" ? "bg-red-100 text-red-500" : "bg-orange-100 text-orange-600")}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-700">{label}</span>
            <span className="text-[9px] text-gray-400 mt-0.5">{time}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-2", isMe ? "flex-row-reverse chat-msg-out" : "chat-msg-in")}>
      {!isMe && <div className="text-xl flex-shrink-0">{msg.senderAvatar || "🐾"}</div>}
      <div className={cn("max-w-[75%] px-4 py-2.5 text-sm leading-relaxed",
        isMe ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white rounded-2xl rounded-br-sm shadow-md shadow-orange-200/50"
             : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm shadow-sm")}>
        {!isMe && <p className="text-[10px] font-bold text-orange-500 mb-0.5">{msg.senderName}</p>}
        <p>{msg.text}</p>
        <div className={cn("flex items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
          <span className={cn("text-[10px]", isMe ? "text-white/60" : "text-gray-400")}>{time}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-white/60" />}
        </div>
      </div>
    </div>
  );
}

function IncomingCallBanner({ callerName, callerAvatar, callType, onAccept, onReject }: {
  callerName: string; callerAvatar?: string;
  callType: "video" | "voice";
  onAccept: () => void; onReject: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-10 z-[110] px-4 anim-popIn pointer-events-none">
      <div className="mx-auto max-w-sm rounded-[2rem] p-4 flex items-center gap-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-white/10 pointer-events-auto"
        style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(24px)" }}>
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-orange-500/20 ring-2 ring-orange-500/50 flex items-center justify-center text-2xl overflow-hidden">
            {callerAvatar || "🐾"}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-slate-900 chat-blink">
            <PhoneIncoming className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-base truncate tracking-tight">{callerName}</p>
          <p className="text-orange-400 text-[11px] font-bold uppercase tracking-wider chat-blink">
            Incoming {callType === "voice" ? "Voice" : "Video"} Call
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onReject} className="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95">
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
          <button onClick={onAccept} className="w-11 h-11 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shadow-lg chat-pulse-ring hover:scale-105 active:scale-95">
            {callType === "voice" ? <Phone className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoCallPanel({ localStream, remoteStream, callStatus, callerName, isVoice, isMuted, isCameraOff, onToggleMute, onToggleCamera, onEndCall }: {
  localStream: MediaStream | null; remoteStream: MediaStream | null;
  callStatus: string; callerName?: string;
  isVoice: boolean;
  isMuted: boolean; isCameraOff: boolean;
  onToggleMute: () => void; onToggleCamera: () => void; onEndCall: () => void;
}) {
  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { if (localRef.current  && localStream)  localRef.current.srcObject  = localStream;  }, [localStream]);
  useEffect(() => { 
    if (remoteStream) {
      if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
      if (audioRef.current) {
        audioRef.current.srcObject = remoteStream;
        audioRef.current.muted = false;
        audioRef.current.volume = 1;
      }
    }
  }, [remoteStream]);
  useEffect(() => {
    if (callStatus !== "connected") return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const isConn = callStatus === "connected";

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col chat-pop">
      <audio ref={audioRef} autoPlay playsInline />
      
      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-white/10 flex items-center justify-center text-2xl">🐾</div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 chat-blink" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{callerName}</h3>
            <p className="text-white/60 text-xs flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              {isConn ? fmt(elapsed) : isVoice ? "Voice Calling..." : "Video Calling..."}
            </p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Pet Chat Call</span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!isVoice && remoteStream
          ? <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                 <div className="absolute inset-0 bg-orange-500 rounded-full blur-3xl opacity-20 chat-blink" />
                 <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-6xl relative z-10">🐾</div>
              </div>
              <div className="text-center relative z-10">
                <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-3">Call with Owner</p>
                <p className="text-white text-4xl font-black tracking-tight">{callerName}</p>
                <p className="text-orange-400 text-lg font-bold mt-4 chat-mono">{isConn ? fmt(elapsed) : "Connecting..."}</p>
              </div>
            </div>
          )}
        
        {!isVoice && (
          <div className="absolute top-24 right-6 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 transition-all hover:scale-105">
            {isCameraOff
              ? <div className="w-full h-full flex items-center justify-center bg-gray-900"><VideoOff className="w-8 h-8 text-white/20" /></div>
              : <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            }
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 pb-12 pt-8 px-6 bg-gradient-to-t from-black/80 to-transparent">
        <button onClick={onToggleMute} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl bg-white/10 border border-white/10 text-white", isMuted && "bg-red-500 border-red-400")}>
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button onClick={onEndCall} className="w-18 h-18 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all hover:scale-110 border-4 border-white/5">
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
        {!isVoice && (
          <button onClick={onToggleCamera} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl bg-white/10 border border-white/10 text-white", isCameraOff && "bg-red-500 border-red-400")}>
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PetChat({
  currentUserId, currentUserName, currentUserAvatar = "🐾", target, onClose,
}: PetChatProps) {
  const chat = useChat({ userId: currentUserId, userName: currentUserName, userAvatar: currentUserAvatar });

  const [inputText,   setInputText]   = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded,  setIsExpanded]  = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const typingTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJoinedKey  = useRef<string>("");

  // Join room whenever connected OR target changes — retries on reconnect
  useEffect(() => {
    const targetKey = `${target.petId}_${target.ownerId ?? ""}_${currentUserId}`;
    if (lastJoinedKey.current === targetKey && chat.isConnected) return;
    if (!chat.isConnected) return;

    lastJoinedKey.current = targetKey;
    chat.joinRoom({
      petId:     target.petId,
      petName:   target.petName,
      petPhoto:  target.petPhoto ?? "",
      // FIX BUG-1: NEVER fall back to ownerName (a display name) as ownerId.
      // If target.ownerId is absent (demo/seeded pets), pass "" so the room
      // is created as a seeker-only conversation instead of silently failing auth.
      ownerId:   target.ownerId ?? "",
      ownerName: target.ownerName,
      seekerId:  currentUserId,
      seekerName:currentUserName,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.isConnected, target.petId, target.ownerId, currentUserId]);

  // Reset join key on unmount so remounting always rejoins
  useEffect(() => {
    return () => {
      lastJoinedKey.current = "";
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, isMinimized]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    chat.sendMessage(inputText);
    setInputText("");
    chat.sendTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }, [inputText, chat]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    chat.sendTypingStart();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => chat.sendTypingStop(), 1500);
  };

  const isVideoCallActive = chat.callState.status === "connected" || chat.callState.status === "calling";
  const widgetWidth  = isExpanded ? "w-[520px]" : "w-[360px]";
  const widgetHeight = isExpanded ? "h-[620px]" : "h-[520px]";
  const callDisabled = chat.callState.status !== "idle" || !chat.isConnected;

  return (
    <>
      <style>{STYLES}</style>
      <div className={cn(
        "fixed bottom-6 right-6 z-50 chat-widget chat-slide-up flex flex-col",
        "rounded-2xl overflow-hidden shadow-2xl border border-orange-100 glass-light",
        widgetWidth, isMinimized ? "h-14" : widgetHeight, "transition-all duration-300"
      )} style={{ boxShadow: "0 24px 60px -12px rgba(234,88,12,.22), 0 0 0 1px rgba(251,146,60,.15)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg,#ea580c 0%,#f97316 50%,#f59e0b 100%)" }}
          onClick={() => setIsMinimized(m => !m)}>
          <div className="relative flex-shrink-0">
            {target.petPhoto
              ? <img src={target.petPhoto} alt={target.petName} className="w-9 h-9 rounded-xl object-cover border-2 border-white/30" />
              : <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">🐾</div>}
            <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-orange-500", chat.isConnected ? "bg-green-400" : "bg-gray-400")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">{target.petName}</p>
            <p className="text-white/70 text-[10px] mt-0.5 truncate">{target.ownerName}</p>
          </div>
          <div className="flex items-center gap-1 mr-1">
            {chat.isConnected ? <Wifi className="w-3.5 h-3.5 text-white/70" /> : <WifiOff className="w-3.5 h-3.5 text-white/50" />}
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsExpanded(ex => !ex)} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col flex-1 relative overflow-hidden">
            {chat.callState.status === "incoming" && (
              <IncomingCallBanner
                callerName={chat.callState.callerName || ""}
                callerAvatar={chat.callState.callerAvatar}
                callType={chat.callState.callType ?? "video"}
                onAccept={chat.acceptCall}
                onReject={() => chat.rejectCall("Declined")}
              />
            )}
            {isVideoCallActive && (
              <VideoCallPanel
                localStream={chat.localStream} remoteStream={chat.remoteStream}
                callStatus={chat.callState.status} callerName={target.ownerName}
                isVoice={chat.callState.callType === "voice"}
                isMuted={chat.isMuted} isCameraOff={chat.isCameraOff}
                onToggleMute={chat.toggleMute} onToggleCamera={chat.toggleCamera}
                onEndCall={chat.endCall}
              />
            )}
            {chat.callState.status === "ended" && (
              <div className="absolute inset-x-4 top-4 z-20 chat-pop">
                <div className="rounded-xl px-4 py-3 bg-gray-900/90 text-white text-xs text-center font-semibold">Call ended</div>
              </div>
            )}
            {/* VideoCallPanel renders itself when status is 'calling' or 'connected'. 
                We don't need the redundant overlay here that was covering the buttons. */}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scrollbar bg-gradient-to-b from-orange-50/30 to-white">
              {chat.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                  <div className="text-5xl">🐾</div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 text-sm">Chat with {target.ownerName}</p>
                    <p className="text-xs text-gray-400 mt-1">About {target.petName} · Say hello!</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center mt-2">
                    {[`Hi! I'm interested in ${target.petName} 👋`, "Can we video call?", "Tell me more!"].map(s => (
                      <button key={s} onClick={() => { setInputText(s); inputRef.current?.focus(); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {chat.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === currentUserId} />
              ))}
              {chat.typingUser && <TypingIndicator name={chat.typingUser} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3 border-t border-orange-100/60 bg-white/80">
              <div className="flex items-center gap-2 mb-2">
                {/* FIX BUG-2: Video Call button calls startCall("video") */}
                <button onClick={() => chat.startCall("video")} disabled={callDisabled}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    callDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-orange-100 text-orange-700 hover:bg-orange-200")}>
                  <Video className="w-3.5 h-3.5" /> Video
                </button>
                {/* FIX BUG-2: Voice Call button calls startCall("voice") — was incorrectly calling startCall() (video) */}
                <button onClick={() => chat.startCall("voice")} disabled={callDisabled}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    callDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-100 text-green-700 hover:bg-green-200")}>
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
                {!chat.isConnected && <span className="text-[10px] text-gray-400 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Connecting…</span>}
              </div>
              <div className="flex items-center gap-2">
                <input ref={inputRef} value={inputText} onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${target.ownerName}…`}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-gray-400" />
                <button onClick={handleSend} disabled={!inputText.trim() || !chat.isConnected}
                  className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                    inputText.trim() && chat.isConnected ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200 hover:scale-105" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
