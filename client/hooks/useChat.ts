import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  type: "text" | "system";
}

export interface CallState {
  status: "idle" | "calling" | "incoming" | "connected" | "ended";
  callType?: "video" | "voice";   // BUG-I/J FIX: expose so UI can hide camera controls on voice calls
  callerName?: string;
  callerAvatar?: string;
  callerId?: string;
  remoteSocketId?: string;
}

interface UseChatOptions {
  userId: string;
  userName: string;
  userAvatar: string;
}

interface JoinRoomOptions {
  petId: string;
  petName: string;
  petPhoto?: string;
  ownerId: string;
  ownerName: string;
  seekerId: string;
  seekerName: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function dedupeMsg(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  if (prev.some(m => m.id === msg.id)) return prev;
  const optIdx = prev.findIndex(
    m => m.id.startsWith("opt_") &&
      m.senderId === msg.senderId &&
      m.text === msg.text &&
      Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
  );
  if (optIdx !== -1) {
    const next = [...prev];
    next[optIdx] = msg;
    return next;
  }
  return [...prev, msg];
}

export function useChat({ userId, userName, userAvatar }: UseChatOptions) {
  const socketRef            = useRef<Socket | null>(null);
  const pcRef                = useRef<RTCPeerConnection | null>(null);
  const localStreamRef       = useRef<MediaStream | null>(null);
  const remoteSocketIdRef    = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const currentRoomIdRef     = useRef<string | null>(null);
  const callerIdRef          = useRef<string | null>(null);
  // BUG-A FIX: store the callType from incoming_call so acceptCall knows
  // whether to request camera. Previously acceptCall always requested video:true
  // even when the caller initiated a voice-only call.
  const incomingCallTypeRef  = useRef<"video" | "voice">("video");

  const [isConnected,   setIsConnected]   = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [typingUser,    setTypingUser]    = useState<string | null>(null);
  const [callState,     setCallState]    = useState<CallState>({ status: "idle" });
  const [localStream,   setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream,  setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted,       setIsMuted]      = useState(false);
  const [isCameraOff,   setIsCameraOff]  = useState(false);

  const setRoom = useCallback((id: string | null) => {
    currentRoomIdRef.current = id;
    setCurrentRoomId(id);
    // BUG-C FIX: clear stale typing indicator when switching rooms
    setTypingUser(null);
  }, []);

  const userIdRef     = useRef(userId);
  const userNameRef   = useRef(userName);
  const userAvatarRef = useRef(userAvatar);
  useEffect(() => { userIdRef.current     = userId;     }, [userId]);
  useEffect(() => { userNameRef.current   = userName;   }, [userName]);
  useEffect(() => { userAvatarRef.current = userAvatar; }, [userAvatar]);

  // ── WebRTC helpers ─────────────────────────────────────────────────────────

  function addTracksToPC(pc: RTCPeerConnection, stream: MediaStream) {
    const existing = new Set(pc.getSenders().map(s => s.track?.id));
    stream.getTracks().forEach(track => {
      if (!existing.has(track.id)) pc.addTrack(track, stream);
    });
  }

  function getPeerConnection(): RTCPeerConnection {
    if (pcRef.current) {
      const st = pcRef.current.connectionState;
      if (st !== "closed" && st !== "failed" && st !== "disconnected") return pcRef.current;
      pcRef.current.close();
      pcRef.current = null;
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    pc.onicecandidate = (e) => {
      if (e.candidate && remoteSocketIdRef.current && socketRef.current)
        socketRef.current.emit("webrtc_ice_candidate", {
          roomId: currentRoomIdRef.current,
          candidate: e.candidate.toJSON(),
          targetSocketId: remoteSocketIdRef.current,
        });
    };
    pc.ontrack = (e) => setRemoteStream(e.streams[0] ?? null);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanupCall();
        setCallState({ status: "ended" });
        setTimeout(() => setCallState({ status: "idle" }), 2000);
      }
    };
    if (localStreamRef.current) addTracksToPC(pc, localStreamRef.current);
    return pc;
  }

  async function createOffer(targetSocketId: string) {
    const pc = getPeerConnection();
    if (localStreamRef.current) addTracksToPC(pc, localStreamRef.current);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("webrtc_offer", {
      roomId: currentRoomIdRef.current,
      offer,
      targetSocketId,
    });
  }

  function cleanupCall() {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    remoteSocketIdRef.current   = null;
    pendingCandidatesRef.current = [];
  }

  // ── Socket Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io("/chat", { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // FIX: subscribe as BOTH owner AND seeker so both personal message channels are joined.
    // Also join the callChannel (server side via registerUser) which is handled
    // automatically when the server processes owner_subscribe / seeker_subscribe.
    const doSubscribe = () => {
      const id   = userIdRef.current;
      const name = userNameRef.current;
      if (!id?.trim() || !socket.connected) return;
      socket.emit("owner_subscribe",  { ownerId:  id, ownerName:  name });
      socket.emit("seeker_subscribe", { seekerId: id, seekerName: name });
    };

    socket.on("connect",    () => { setIsConnected(true);  doSubscribe(); });
    socket.on("disconnect", () =>   setIsConnected(false));
    (socket as any)._doSubscribe = doSubscribe;

    // Always replace messages when joining a room (don't append stale history)
    socket.on("room_joined", (data: { roomId: string; messages: ChatMessage[] }) => {
      setRoom(data.roomId);
      setMessages(data.messages ?? []);
    });

    // Primary delivery via room socket
    socket.on("new_message", (msg: ChatMessage) => {
      if (msg.roomId !== currentRoomIdRef.current) return;
      setMessages(prev => dedupeMsg(prev, msg));
    });

    // Personal channel delivery — for when the user has not yet joined the room socket
    socket.on("inbox_message", (data: { roomId: string; message: ChatMessage }) => {
      if (data.roomId === currentRoomIdRef.current) {
        setMessages(prev => dedupeMsg(prev, data.message));
      }
    });

    socket.on("user_typing",         ({ userName: n }: { userName: string }) => setTypingUser(n));
    socket.on("user_stopped_typing", () => setTypingUser(null));

    // Call signals arrive on callChannel (server side) — single delivery guaranteed
    socket.on("incoming_call", (data: {
      roomId: string; callerId: string; callerName: string;
      callerAvatar: string; socketId: string; callType?: "video" | "voice";
    }) => {
      remoteSocketIdRef.current    = data.socketId;
      callerIdRef.current          = data.callerId;
      // BUG-A FIX: persist callType so acceptCall uses the correct media constraints
      incomingCallTypeRef.current  = data.callType ?? "video";
      setCallState({
        status: "incoming",
        callType:       data.callType ?? "video",
        callerName:     data.callerName,
        callerAvatar:   data.callerAvatar,
        callerId:       data.callerId,
        remoteSocketId: data.socketId,
      });
    });

    socket.on("call_accepted", async (data: { answererName: string; socketId: string }) => {
      remoteSocketIdRef.current = data.socketId;
      setCallState(prev => ({ ...prev, status: "connected", remoteSocketId: data.socketId }));
      await createOffer(data.socketId);
    });

    socket.on("call_rejected", () => {
      setCallState({ status: "ended" });
      setTimeout(() => setCallState({ status: "idle" }), 2000);
      cleanupCall();
    });

    socket.on("call_ended", () => {
      setCallState({ status: "ended" });
      setTimeout(() => setCallState({ status: "idle" }), 2000);
      cleanupCall();
    });

    socket.on("webrtc_offer", async (data: { offer: RTCSessionDescriptionInit; fromSocketId: string }) => {
      remoteSocketIdRef.current = data.fromSocketId;
      const pc = getPeerConnection();
      if (localStreamRef.current) addTracksToPC(pc, localStreamRef.current);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      for (const c of pendingCandidatesRef.current)
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc_answer", {
        roomId: currentRoomIdRef.current,
        answer,
        targetSocketId: data.fromSocketId,
      });
    });

    socket.on("webrtc_answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState !== "have-local-offer") return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      for (const c of pendingCandidatesRef.current)
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
      pendingCandidatesRef.current = [];
    });

    socket.on("webrtc_ice_candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
    });

    return () => { socket.disconnect(); cleanupCall(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-subscribe when Clerk userId becomes available (loads asynchronously)
  useEffect(() => {
    if (!userId?.trim()) return;
    const s = socketRef.current as any;
    if (s?.connected && s._doSubscribe) s._doSubscribe();
  }, [userId]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const joinRoom = useCallback((opts: JoinRoomOptions) => {
    socketRef.current?.emit("join_room", {
      petId:        opts.petId,
      petName:      opts.petName,
      petPhoto:     opts.petPhoto ?? "",
      ownerId:      opts.ownerId,
      ownerName:    opts.ownerName,
      seekerId:     opts.seekerId,
      seekerName:   opts.seekerName,
      seekerAvatar: userAvatarRef.current,
    });
  }, []);

  const sendMessage = useCallback((text: string) => {
    const roomId = currentRoomIdRef.current;
    const socket = socketRef.current;
    if (!text.trim() || !socket || !roomId) return;
    // ROOT CAUSE FIX: never fall back to "guest" — if userId is not yet loaded
    // the server will fail isRoomMember() and silently drop the message.
    const senderId = userIdRef.current?.trim();
    if (!senderId) {
      console.warn("[useChat] sendMessage: userId not yet available, skipping");
      return;
    }
    const optimistic: ChatMessage = {
      id:           `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      roomId,
      senderId,
      senderName:   userNameRef.current,
      senderAvatar: userAvatarRef.current,
      text:         text.trim(),
      timestamp:    new Date().toISOString(),
      type:         "text",
    };
    setMessages(prev => [...prev, optimistic]);
    socket.emit("send_message", {
      roomId,
      senderId,
      senderName:   userNameRef.current,
      senderAvatar: userAvatarRef.current,
      text:         text.trim(),
    });
  }, []);

  const sendTypingStart = useCallback(() => {
    if (!currentRoomIdRef.current) return;
    socketRef.current?.emit("typing_start", {
      roomId: currentRoomIdRef.current,
      userName: userNameRef.current,
    });
  }, []);

  const sendTypingStop = useCallback(() => {
    if (!currentRoomIdRef.current) return;
    socketRef.current?.emit("typing_stop", { roomId: currentRoomIdRef.current });
  }, []);

  const startCall = useCallback(async (callType: "video" | "voice" = "video") => {
    try {
      // FIX BUG-2: support voice-only calls — only request video for video calls
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = getPeerConnection();
      addTracksToPC(pc, stream);
      setCallState({ status: "calling", callType });
      socketRef.current?.emit("call_initiate", {
        roomId:       currentRoomIdRef.current,
        callerId:     userIdRef.current,
        callerName:   userNameRef.current,
        callerAvatar: userAvatarRef.current,
        callType,
      });
    } catch (err) {
      console.error("Failed to get media:", err);
      alert("Could not access microphone/camera. Please check permissions.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptCall = useCallback(async () => {
    // BUG-A FIX: use the stored callType to only request camera for video calls
    const callType = incomingCallTypeRef.current ?? "video";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = getPeerConnection();
      addTracksToPC(pc, stream);
      setCallState(prev => ({ ...prev, status: "connected", callType }));
      socketRef.current?.emit("call_accepted", {
        roomId:       currentRoomIdRef.current,
        callerId:     callerIdRef.current,
        answererName: userNameRef.current,
        callType,
      });
    } catch (err) {
      console.error("Failed to get media:", err);
      rejectCall("Camera/microphone access denied");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rejectCall = useCallback((reason?: string) => {
    socketRef.current?.emit("call_rejected", {
      roomId:   currentRoomIdRef.current,
      reason,
      // BUG-H FIX: send our userId so server can route reliably without socketUserMap
      callerId: userIdRef.current,
    });
    setCallState({ status: "idle" });
    callerIdRef.current = null;
  }, []);

  const endCall = useCallback(() => {
    socketRef.current?.emit("call_ended", {
      roomId:   currentRoomIdRef.current,
      // BUG-H FIX: send our userId so server can route reliably without socketUserMap
      callerId: userIdRef.current,
    });
    cleanupCall();
    setCallState({ status: "idle" });
    callerIdRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = useCallback(() => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  }, []);

  const toggleCamera = useCallback(() => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsCameraOff(!t.enabled); }
  }, []);

  return {
    isConnected, currentRoomId, messages, typingUser,
    callState, localStream, remoteStream, isMuted, isCameraOff,
    joinRoom, sendMessage, sendTypingStart, sendTypingStop,
    startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera,
  };
}
