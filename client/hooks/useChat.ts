import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ICE_SERVERS } from "@/lib/iceServers";

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
    extraHeaders: {
      "ngrok-skip-browser-warning": "true",
    },
  };
}

export function useChat({ userId, userName, userAvatar }: UseChatOptions) {
  const socketRef            = useRef<Socket | null>(null);
  const pcRef                = useRef<RTCPeerConnection | null>(null);
  const localStreamRef       = useRef<MediaStream | null>(null);
  const remoteSocketIdRef    = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const currentRoomIdRef     = useRef<string | null>(null);

  const [isConnected,   setIsConnected]   = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [typingUser,    setTypingUser]    = useState<string | null>(null);
  const [callState,     setCallState]     = useState<CallState>({ status: "idle" });
  const [localStream,   setLocalStream]   = useState<MediaStream | null>(null);
  const [remoteStream,  setRemoteStream]  = useState<MediaStream | null>(null);
  const [isMuted,       setIsMuted]       = useState(false);
  const [isCameraOff,   setIsCameraOff]   = useState(false);

  const setRoom = useCallback((id: string | null) => {
    currentRoomIdRef.current = id;
    setCurrentRoomId(id);
  }, []);

  useEffect(() => {
    const socket = io(`${getSocketUrl()}/chat`, getSocketOptions());
    socketRef.current = socket;

    const doSubscribe = () => {
      if (!userId || !socket.connected) return;
      socket.emit("seeker_subscribe", { seekerId: userId, seekerName: userName });
    };

    socket.on("connect",       () => { setIsConnected(true); doSubscribe(); });
    socket.on("connect_error", (err) => console.error("[useChat] Connection error:", err.message));
    socket.on("disconnect",    (reason) => { console.warn("[useChat] Disconnected:", reason); setIsConnected(false); });
    (socket as any)._doSubscribe = doSubscribe;

    socket.on("room_joined", (data: { roomId: string; messages: ChatMessage[] }) => {
      setRoom(data.roomId);
      setMessages(data.messages);
    });

    socket.on("new_message", (msg: ChatMessage) => {
      if (msg.roomId !== currentRoomIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const optIdx = prev.findIndex(
          (m) => m.id.startsWith("opt_") && m.senderId === msg.senderId && m.text === msg.text &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 10000
        );
        if (optIdx !== -1) { const next = [...prev]; next[optIdx] = msg; return next; }
        return [...prev, msg];
      });
    });

    socket.on("user_typing",         ({ userName: n }: { userName: string }) => setTypingUser(n));
    socket.on("user_stopped_typing", () => setTypingUser(null));

    // ── Call signaling ────────────────────────────────────────────────────
    socket.on("incoming_call", (data: {
      roomId: string; callerId: string; callerName: string;
      callerAvatar: string; socketId: string;
    }) => {
      remoteSocketIdRef.current = data.socketId;
      setCallState({
        status: "incoming", callerName: data.callerName,
        callerAvatar: data.callerAvatar, callerId: data.callerId,
        remoteSocketId: data.socketId,
      });
    });

    socket.on("call_accepted", async (data: { answererName: string; socketId: string }) => {
      remoteSocketIdRef.current = data.socketId;
      setCallState((prev) => ({ ...prev, status: "connected", remoteSocketId: data.socketId }));
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

    // ── WebRTC signaling ──────────────────────────────────────────────────
    socket.on("webrtc_offer", async (data: {
      offer: RTCSessionDescriptionInit; fromSocketId: string;
    }) => {
      remoteSocketIdRef.current = data.fromSocketId;
      const pc = getPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", {
          roomId: currentRoomIdRef.current, answer,
          targetSocketId: data.fromSocketId,
        });
      } catch (err) {
        console.error("[useChat] offer handling failed:", err);
      }
    });

    socket.on("webrtc_answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
        }
      } catch (err) {
        console.error("[useChat] answer handling failed:", err);
      }
    });

    socket.on("webrtc_ice_candidate", async (data: { candidate: RTCIceCandidateInit | null }) => {
      if (!data.candidate) return;
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }
      try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); }
      catch (err) { console.warn("[useChat] addIceCandidate:", err); }
    });

    return () => { socket.disconnect(); cleanupCall(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = socketRef.current as any;
    if (socket?._doSubscribe) socket._doSubscribe();
  }, [userId]);

  // ── PeerConnection ─────────────────────────────────────────────────────
  function getPeerConnection(): RTCPeerConnection {
    if (pcRef.current) {
      const state = pcRef.current.connectionState;
      if (state !== "closed" && state !== "failed") return pcRef.current;
      pcRef.current.close();
      pcRef.current = null;
    }

    // ICE_SERVERS imported from iceServers.ts — uses your Metered credentials
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current && socketRef.current) {
        socketRef.current.emit("webrtc_ice_candidate", {
          roomId:         currentRoomIdRef.current,
          candidate:      event.candidate.toJSON(),
          targetSocketId: remoteSocketIdRef.current,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] Got remote track:", event.track.kind);
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanupCall();
        setCallState({ status: "ended" });
        setTimeout(() => setCallState({ status: "idle" }), 2000);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }

  async function createOffer(targetSocketId: string) {
    const pc = getPeerConnection();
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("webrtc_offer", {
        roomId: currentRoomIdRef.current, offer, targetSocketId,
      });
    } catch (err) {
      console.error("[useChat] createOffer failed:", err);
    }
  }

  function cleanupCall() {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteSocketIdRef.current = null;
    pendingCandidatesRef.current = [];
  }

  async function acquireMedia(video: boolean): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = video
      ? {
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }
      : {
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        };
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      if (video) {
        try { return await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); } catch {}
      }
      const n = err?.name ?? "";
      if (n === "NotAllowedError" || n === "PermissionDeniedError")
        throw new Error("Camera/microphone permission denied. Please allow access in your browser settings.");
      if (n === "NotFoundError")
        throw new Error("No camera or microphone found.");
      if (n === "NotReadableError")
        throw new Error("Camera/microphone is already in use by another application.");
      throw new Error("Could not access camera/microphone. Please check browser permissions.");
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  const joinRoom = useCallback((opts: JoinRoomOptions) => {
    socketRef.current?.emit("join_room", {
      ...opts, petPhoto: opts.petPhoto ?? "", seekerAvatar: userAvatar,
    });
  }, [userAvatar]);

  const sendMessage = useCallback((text: string) => {
    const roomId = currentRoomIdRef.current;
    const socket = socketRef.current;
    if (!text.trim() || !socket || !roomId) return;
    const optimistic: ChatMessage = {
      id:           `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      roomId, senderId: userId, senderName: userName, senderAvatar: userAvatar,
      text: text.trim(), timestamp: new Date().toISOString(), type: "text",
    };
    setMessages((prev) => [...prev, optimistic]);
    socket.emit("send_message", {
      roomId, senderId: userId, senderName: userName, senderAvatar: userAvatar, text: text.trim(),
    });
  }, [userId, userName, userAvatar]);

  const sendTypingStart = useCallback(() => {
    if (!currentRoomIdRef.current) return;
    socketRef.current?.emit("typing_start", { roomId: currentRoomIdRef.current, userName });
  }, [userName]);

  const sendTypingStop = useCallback(() => {
    if (!currentRoomIdRef.current) return;
    socketRef.current?.emit("typing_stop", { roomId: currentRoomIdRef.current });
  }, []);

  const startCall = useCallback(async () => {
    try {
      const stream = await acquireMedia(true);
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      const pc = getPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setCallState({ status: "calling" });
      socketRef.current?.emit("call_initiate", {
        roomId: currentRoomIdRef.current, callerId: userId,
        callerName: userName, callerAvatar: userAvatar, callType: "video",
      });
    } catch (err: any) {
      alert(err?.message ?? "Could not start call.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userName, userAvatar]);

  const acceptCall = useCallback(async () => {
    try {
      const stream = await acquireMedia(true);
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      const pc = getPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setCallState((prev) => ({ ...prev, status: "connected" }));
      socketRef.current?.emit("call_accepted", {
        roomId: currentRoomIdRef.current, callerId: callState.callerId,
        answererName: userName, callType: "video",
      });
    } catch (err: any) {
      alert(err?.message ?? "Could not access camera/microphone.");
      rejectCall("Permission denied");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState.callerId, userName]);

  const rejectCall = useCallback((reason?: string) => {
    socketRef.current?.emit("call_rejected", { roomId: currentRoomIdRef.current, reason });
    setCallState({ status: "idle" });
  }, []);

  const endCall = useCallback(() => {
    socketRef.current?.emit("call_ended", { roomId: currentRoomIdRef.current });
    cleanupCall();
    setCallState({ status: "idle" });
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
