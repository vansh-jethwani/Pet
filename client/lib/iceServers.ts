/**
 * client/lib/iceServers.ts
 *
 * Multiple TURN providers with direct IP fallback.
 * This handles DNS lookup failures like "TURN host lookup received error".
 *
 * Priority order:
 * 1. Metered.ca with your credentials (most reliable)
 * 2. Metered.ca via direct IP (bypasses DNS issues)
 * 3. Open Relay Project (no account needed, free fallback)
 */

const TURN_USERNAME   = import.meta.env.VITE_TURN_USERNAME   ?? "";
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL ?? "";

// Build TURN entries for Metered.ca — included only if credentials are set
const meteredServers: RTCIceServer[] = (TURN_USERNAME && TURN_CREDENTIAL) ? [
  // Domain-based (works when DNS resolves)
  { urls: "turn:relay.metered.ca:80",                   username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:relay.metered.ca:443",                  username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:relay.metered.ca:443?transport=tcp",    username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turns:relay.metered.ca:443",                 username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  // Direct IP fallback (bypasses DNS — works even when domain lookup fails)
  { urls: "turn:52.25.20.215:80",                       username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:52.25.20.215:443",                      username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:52.25.20.215:443?transport=tcp",        username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:54.201.61.144:80",                      username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:54.201.61.144:443",                     username: TURN_USERNAME, credential: TURN_CREDENTIAL },
] : [];

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // STUN servers
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },

    // Metered.ca with your credentials (domain + direct IP)
    ...meteredServers,

    // Open Relay Project — free, no account, reliable fallback
    { urls: "turn:openrelay.metered.ca:80",                 username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443",                username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp",  username: "openrelayproject", credential: "openrelayproject" },
  ],

  iceCandidatePoolSize: 10,
  iceTransportPolicy: "all",
  bundlePolicy:  "max-bundle",
  rtcpMuxPolicy: "require",
};
