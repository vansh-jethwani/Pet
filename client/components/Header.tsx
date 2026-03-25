import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useUser, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/NotificationWidget";
import NotificationWidget from "@/components/NotificationWidget";

export default function Header() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { pathname } = useLocation();

  const { user }    = useUser();
  const { signOut } = useClerk();

  // The notification hook manages its own socket — runs for any signed-in user.
  // Because it's always rendered (hook call is unconditional), the socket stays
  // alive across navigation and doesn't reset on panel open/close.
  const notif = useNotifications();

  // Stable callbacks — must not change reference on every render so the
  // NotificationWidget's outside-click useEffect doesn't re-register constantly.
  const openNotif   = useCallback(() => setNotifOpen(true),        []);
  const closeNotif  = useCallback(() => setNotifOpen(false),       []);
  const toggleNotif = useCallback(() => setNotifOpen(o => !o),     []);

  const navItems = [
    { label: "Home",           href: "/"           },
    { label: "Messages",       href: "/chat"        },
    { label: "Breeding Match", href: "/breeding"    },
    { label: "Adoption",       href: "/adoption"    },
    { label: "Host a Pet",     href: "/hosting"     },
    // { label: "Marketplace",    href: "/marketplace" },
    { label: "Vets",           href: "/vets"        },
    { label: "Insurance",      href: "/insurance"   },
    { label: "Store",          href: "/store"       },
    { label: "Community",      href: "/community"       },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100" id="app-header">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-dogs to-orange-400 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-dogs to-orange-400 bg-clip-text text-transparent hidden sm:inline">
              PetMatch
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-dogs bg-orange-50 font-semibold border-b-2 border-dogs"
                      : "text-gray-700 hover:text-dogs hover:bg-orange-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right section */}
          <div className="hidden sm:flex items-center gap-3">
            <SignedOut>
              <Link
                to="/signin"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-dogs rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
              >
                Sign Up
              </Link>
            </SignedOut>

            <SignedIn>
              {/* Bell wrapper: stop mousedown from bubbling to the document
                  listener in NotificationWidget, so clicking the bell only
                  runs toggleNotif and never accidentally calls onClose(). */}
              <div
                onMouseDown={e => e.stopPropagation()}
                className="inline-flex"
              >
                <NotificationBell
                  unreadCount={notif.unreadCount}
                  justReceived={notif.justReceived}
                  isOpen={notifOpen}
                  onClick={toggleNotif}
                />
              </div>

              <Link
                to="/dashboard"
                className="text-sm text-gray-700 font-medium hover:text-orange-500 transition-colors"
              >
                Hi, {user?.firstName ?? "there"} 👋
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </SignedIn>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-gray-50">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map(item => {
                const isActive = item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-dogs bg-orange-100 font-semibold"
                        : "text-gray-700 hover:text-dogs hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <SignedOut>
                  <Link
                    to="/signin"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-dogs rounded-lg hover:bg-orange-600 text-center"
                  >
                    Sign Up
                  </Link>
                </SignedOut>

                <SignedIn>
                  <div className="flex-1 flex flex-col gap-2">
                    <button
                      onClick={() => { setMenuOpen(false); openNotif(); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      🔔 Notifications
                      {notif.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                          {notif.unreadCount > 99 ? "99+" : notif.unreadCount}
                        </span>
                      )}
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700 font-medium text-center">
                      Hi, {user?.firstName ?? "there"} 👋
                    </span>
                    <button
                      onClick={() => { signOut(); setMenuOpen(false); }}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                </SignedIn>
              </div>
            </div>
          </div>
        )}
      </header>

      {/*
        BUG FIX: NotificationWidget is rendered OUTSIDE <header> and OUTSIDE
        the <SignedIn> wrapper so:
        1. Its fixed positioning is never clipped by the header's stacking context.
        2. It is not unmounted when SignedIn changes (Clerk loading races).
        3. The isOpen prop controls visibility — the socket in useNotifications
           is always alive regardless of whether the panel is open or closed.
      */}
      <NotificationWidget
        notifications={notif.notifications}
        unreadCount={notif.unreadCount}
        loading={notif.loading}
        hasMore={notif.hasMore}
        isConnected={notif.isConnected}
        isOpen={notifOpen}
        onClose={closeNotif}
        onMarkRead={notif.markRead}
        onMarkUnread={notif.markUnread}
        onMarkAllRead={notif.markAllRead}
        onDelete={notif.deleteNotification}
        onClearAllRead={notif.clearAllRead}
        onLoadMore={notif.loadMore}
        onRefresh={notif.refresh}
      />
    </>
  );
}
