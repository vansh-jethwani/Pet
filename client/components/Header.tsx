import { Link, useNavigate } from "react-router-dom";
import { Heart, Menu, X, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useUser, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { io, Socket } from "socket.io-client";

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
    extraHeaders: { "ngrok-skip-browser-warning": "true" },
  };
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(`${getSocketUrl()}/chat`, getSocketOptions());
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("owner_subscribe", {
        ownerId:   user.id,
        ownerName: user.fullName ?? user.firstName ?? "Owner",
      });
    });

    socket.on("owner_inbox", () => { setUnreadCount(0); });

    socket.on("inbox_message", (data: { roomId: string; message: { senderId: string } }) => {
      if (data.message.senderId !== userIdRef.current) {
        setUnreadCount((n) => n + 1);
      }
    });

    return () => { socket.disconnect(); };
  }, [user?.id]);

  const handleBellClick = () => { setUnreadCount(0); navigate("/chat"); };

  const navItems = [
    { label: "Home",           href: "/" },
    { label: "Messages",       href: "/chat" },
    { label: "Breeding Match", href: "/breeding" },
    { label: "Adoption",       href: "/adoption" },
    { label: "Host a Pet",     href: "/hosting" },
    { label: "Marketplace",    href: "/marketplace" },
    { label: "Vets",           href: "/vets" },
    { label: "Insurance",      href: "/insurance" },
    { label: "Store",          href: "/store" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-dogs to-orange-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-dogs to-orange-400 bg-clip-text text-transparent hidden sm:inline">
            PetMatch
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-dogs rounded-lg hover:bg-orange-50 transition-colors">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <SignedOut>
            <Link to="/signin" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-dogs rounded-lg hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl">
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <button onClick={handleBellClick}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 transition-colors"
              title="Messages">
              <Bell className="w-4 h-4 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Link to="/dashboard" className="text-sm text-gray-700 font-medium hover:text-orange-500 transition-colors">
              Hi, {user?.firstName ?? "there"} 👋
            </Link>
            <button onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Sign Out
            </button>
          </SignedIn>
        </div>

        <button onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
          {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
        </button>
      </nav>

      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-gray-50">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-dogs rounded-lg hover:bg-white transition-colors">
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <SignedOut>
                <Link to="/signin" onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-center">
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-dogs rounded-lg hover:bg-orange-600 transition-colors text-center">
                  Sign Up
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="flex-1 flex flex-col gap-2">
                  <button onClick={() => { setUnreadCount(0); navigate("/chat"); setIsOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                    <Bell className="w-4 h-4" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 font-medium text-center">
                    Hi, {user?.firstName ?? "there"} 👋
                  </span>
                  <button onClick={() => { signOut(); setIsOpen(false); }}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-center">
                    Sign Out
                  </button>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
