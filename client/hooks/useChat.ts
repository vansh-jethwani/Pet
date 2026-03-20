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

export function useChat({ userId, userName, userAvatar }: UseChatOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ── Socket Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io("/chat", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("seeker_subscribe", { seekerId: userId, seekerName: userName });
    });
    socket.on("disconnect", () => setIsConnected(false));

    socket.on(
      "room_joined",
      (data: { roomId: string; messages: ChatMessage[] }) => {
        setCurrentRoomId(data.roomId);
        setMessages(data.messages);
      }
    );

    socket.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("user_typing", ({ userName: name }: { userName: string }) => {
      setTypingUser(name);
    });

    socket.on("user_stopped_typing", () => setTypingUser(null));

    // ── Incoming call ──
    socket.on(
      "incoming_call",
      (data: {
        roomId: string;
        callerId: string;
        callerName: string;
        callerAvatar: string;
        socketId: string;
      }) => {
        remoteSocketIdRef.current = data.socketId;
        setCallState({
          status: "incoming",
          callerName: data.callerName,
          callerAvatar: data.callerAvatar,
          callerId: data.callerId,
          remoteSocketId: data.socketId,
        });
      }
    );

    socket.on(
      "call_accepted",
      async (data: { answererName: string; socketId: string }) => {
        remoteSocketIdRef.current = data.socketId;
        setCallState((prev) => ({
          ...prev,
          status: "connected",
          remoteSocketId: data.socketId,
        }));
        // Caller creates and sends the offer
        await createOffer(data.socketId);
      }
    );

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

    // ── WebRTC Signaling ──
    socket.on(
      "webrtc_offer",
      async (data: { offer: RTCSessionDescriptionInit; fromSocketId: string }) => {
        remoteSocketIdRef.current = data.fromSocketId;
        const pc = getPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Flush pending ICE candidates
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          roomId: currentRoomId,
          answer,
          targetSocketId: data.fromSocketId,
        });
      }
    );

    socket.on(
      "webrtc_answer",
      async (data: { answer: RTCSessionDescriptionInit }) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    );

    socket.on(
      "webrtc_ice_candidate",
      async (data: { candidate: RTCIceCandidateInit }) => {
        const pc = pcRef.current;
        if (!pc || !pc.remoteDescription) {
          pendingCandidatesRef.current.push(data.candidate);
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    );

    return () => {
      socket.disconnect();
      cleanupCall();
    };
  }, []);

  // ── PeerConnection factory ─────────────────────────────────────────────────
  function getPeerConnection(): RTCPeerConnection {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current && socketRef.current) {
        socketRef.current.emit("webrtc_ice_candidate", {
          roomId: currentRoomId,
          candidate: event.candidate.toJSON(),
          targetSocketId: remoteSocketIdRef.current,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        cleanupCall();
        setCallState({ status: "ended" });
        setTimeout(() => setCallState({ status: "idle" }), 2000);
      }
    };

    // Add local tracks if stream is already active
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }

  async function createOffer(targetSocketId: string) {
    const pc = getPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("webrtc_offer", {
      roomId: currentRoomId,
      offer,
      targetSocketId,
    });
  }

  function cleanupCall() {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteSocketIdRef.current = null;
    pendingCandidatesRef.current = [];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  const joinRoom = useCallback(
    (opts: JoinRoomOptions) => {
      socketRef.current?.emit("join_room", {
        ...opts,
        seekerAvatar: userAvatar,
      });
    },
    [userAvatar]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!currentRoomId || !text.trim()) return;
      socketRef.current?.emit("send_message", {
        roomId: currentRoomId,
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        text: text.trim(),
      });
    },
    [currentRoomId, userId, userName, userAvatar]
  );

  const sendTypingStart = useCallback(() => {
    if (!currentRoomId) return;
    socketRef.current?.emit("typing_start", {
      roomId: currentRoomId,
      userName,
    });
  }, [currentRoomId, userName]);

  const sendTypingStop = useCallback(() => {
    if (!currentRoomId) return;
    socketRef.current?.emit("typing_stop", { roomId: currentRoomId });
  }, [currentRoomId]);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Add tracks to peer connection
      const pc = getPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setCallState({ status: "calling" });
      socketRef.current?.emit("call_initiate", {
        roomId: currentRoomId,
        callerId: userId,
        callerName: userName,
        callerAvatar: userAvatar,
      });
    } catch (err) {
      console.error("Failed to get media:", err);
      alert(
        "Could not access camera/microphone. Please check permissions."
      );
    }
  }, [currentRoomId, userId, userName, userAvatar]);

  const acceptCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = getPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setCallState((prev) => ({ ...prev, status: "connected" }));
      socketRef.current?.emit("call_accepted", {
        roomId: currentRoomId,
        callerId: callState.callerId,
        answererName: userName,
      });
    } catch (err) {
      console.error("Failed to get media:", err);
      rejectCall("Camera/microphone access denied");
    }
  }, [currentRoomId, callState.callerId, userName]);

  const rejectCall = useCallback(
    (reason?: string) => {
      socketRef.current?.emit("call_rejected", {
        roomId: currentRoomId,
        reason,
      });
      setCallState({ status: "idle" });
    },
    [currentRoomId]
  );

  const endCall = useCallback(() => {
    socketRef.current?.emit("call_ended", { roomId: currentRoomId });
    cleanupCall();
    setCallState({ status: "idle" });
  }, [currentRoomId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  return {
    isConnected,
    currentRoomId,
    messages,
    typingUser,
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    joinRoom,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
