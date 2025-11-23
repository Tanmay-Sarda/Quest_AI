"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setusername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);
  const [characterName, setCharacterName] = useState("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = localStorage.getItem("profileImage");
      if (img) setProfileImage(img);
    }
  },);

  useEffect(() => {
    setusername(localStorage.getItem("username"));
    const token = localStorage.getItem("accessToken");
    setProfileImage(localStorage.getItem("profileImage"))
    setIsLoggedIn(!!token);
  }, [pathname]);

  useEffect(() => {
    if (isLoggedIn && showNotificationsPanel) {
      fetchNotifications();
    }
  }, [isLoggedIn, showNotificationsPanel]);

  const showToast = (message, duration = 2500) => {
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  };

  const handleLogout = () => {
    showToast("🔓 Logging out...");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    router.push("/Login");
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/notification/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      if (data && data.success) {
        setNotifications(data.data || []);
        setNotificationsCount((data.data && data.data.length) || 0);
      }else{
        showToast(data.message)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (notificationId, accept, character = "") => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/notification/delete/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ accept, character }),
        }
      );

      if (response.ok) {
        fetchNotifications();
        router.push(`/Home/${username}`);
      } else {
        showToast("⚠️ Failed to process notification");
      }
    } catch (error) {
      console.error("Failed to handle notification:", error);
      showToast("⚠️ An error occurred while processing the notification.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 0:
        return <span className="bg-yellow-500 text-xs px-2 py-1 rounded">Pending</span>;
      case 1:
        return <span className="bg-green-500 text-xs px-2 py-1 rounded">Accepted</span>;
      case 2:
        return <span className="bg-red-500 text-xs px-2 py-1 rounded">Rejected</span>;
      default:
        return null;
    }
  };

  const renderNotificationContent = (notification) => (
    <div key={notification._id} className="p-4 border-b border-gray-700 bg-gray-800">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{notification.fromUser?.email || "Unknown User"}</p>
          <p className="text-sm text-gray-400">Story: {notification.story_id?.title || "Unknown Story"}</p>
        </div>
        {getStatusBadge(notification.status)}
      </div>

      {notification.status === 0 ? (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="Enter character name"
            className="flex-1 px-2 py-1 bg-gray-800 rounded"
            onChange={(e) => setCharacterName(e.target.value)}
          />
          <button
            onClick={() => {
              showToast("✔ Accepted");
              handleNotificationAction(notification._id, true, characterName);
            }}
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={() => {
              showToast("❌ Rejected");
              handleNotificationAction(notification._id, false);
            }}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            showToast("🗑 Deleted");
            handleNotificationAction(notification._id, null);
          }}
          className="mt-3 px-3 py-1 bg-gray-600 rounded hover:bg-gray-700"
        >
          Delete
        </button>
      )}
    </div>
  );

  // ------------------------- CLEAN RETRO HOVER BUTTON -------------------------
  const NavButton = ({ onClick, children, title }) => (
    <button
      title={title}
      onClick={onClick}
      className="form-button rounded-sm p-1 transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14]"
      style={{ whiteSpace: "nowrap" }}
    >
      {children}
    </button>
  );

  // auto-close mobile menu when resizing
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* HEADER */}
      <header
        ref={navRef}
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 1000,
          backgroundColor: theme === 'light' ? '#f3f4f6' : '#000000',
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderBottom: "1px dashed var(--border-color)",
        }}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Hamburger for Mobile */}
          <button
            aria-label="Open menu"
            onClick={() => {
              showToast("☰ Menu toggled");
              setMobileMenuOpen((s) => !s);
              setShowProfilePanel(false);
              setShowNotificationsPanel(false);
            }}
            className="md:hidden text-xl p-2 rounded hover:scale-105 hover:text-[#39FF14] transition-all duration-200"
            style={{
              color: "var(--text-color)",
              background: "transparent",
              border: "1px dashed var(--border-color)",
            }}
          >
            ≡
          </button>

          {/* Logo */}
          <img
            src="/QuestLogo.jpeg"
            alt="Quest AI Logo"
            className={`h-[70px] cursor-pointer hover:scale-105 transition-all duration-200 ${theme === 'light' ? 'logo-light' : ''}`}
            onClick={() => {
              const targetUrl = isLoggedIn ? `/Home/${username}` : "/Login";
              if (pathname !== targetUrl) {
                showToast("🏠 Going Home");
                router.push(targetUrl);
              }
            }}
          />
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-4 flex-1 justify-end">
          {/* ABOUT visible always */}
          <NavButton
            onClick={() => {
              const targetUrl = "/About";
              if (pathname !== targetUrl) {
                showToast("ℹ Redirecting to the About Page");
                router.push(targetUrl);
              }
            }}
            title="About"
          >
            [ ABOUT ]
          </NavButton>

          {!isLoggedIn && (
            <>
              <NavButton
                onClick={() => {
                  const targetUrl = "/";
                  if (pathname !== targetUrl) {
                    showToast("📝 Sign up");
                    router.push(targetUrl);
                  }
                }}
                title="Sign up"
              >
                [ SIGN-UP ]
              </NavButton>

              <NavButton
                onClick={() => {
                  const targetUrl = "/Login";
                  if (pathname !== targetUrl) {
                    showToast("🔐 Login");
                    router.push(targetUrl);
                  }
                }}
                title="Login"
              >
                [ LOGIN ]
              </NavButton>
            </>
          )}

          <NavButton
            onClick={() => {
              const targetUrl = "/Public_Story";
              if (pathname !== targetUrl) {
                showToast("📖 Redirecting to the Public Stories");
                router.push(targetUrl);
              }
            }}
            title="Public"
          >
            [ PUBLIC STORIES ]
          </NavButton>

          {/* Theme Toggle Button */}
          <NavButton
            onClick={() => {
              showToast(`Theme toggled to ${theme === "light" ? "dark" : "light"}`);
              toggleTheme();
            }}
            title="Toggle Theme"
          >
            {theme === 'light' ? '☀' : '⏾'}
          </NavButton>

          {/* IF LOGGED IN */}
          {isLoggedIn && (
            <>
              <NavButton
                onClick={() => {
                  const targetUrl = `/Home/${username}`;
                  if (pathname !== targetUrl) {
                    showToast("🏠 Redirecting to the Home page");
                    router.push(targetUrl);
                  }
                }}
                title="Home"
              >
                [ HOME ]
              </NavButton>

              <NavButton
                onClick={() => {
                  const targetUrl = `/Story_Form/${username}`;
                  if (pathname !== targetUrl) {
                    showToast("✍ Redirecting to the Create Story");
                    router.push(targetUrl);
                  }
                }}
                title="Create"
              >
                [ CREATE STORY ]
              </NavButton>

              {/* avatar */}
              <button
                onClick={() => {
                  showToast("👤 Profile");
                  setShowProfilePanel((s) => !s);
                  setShowNotificationsPanel(false);
                }}
                className="rounded-full w-10 h-10 flex items-center justify-center border border-white/10 bg-gray-900 overflow-hidden hover:scale-105 transition-all duration-200"
                title="Profile"
              >
                {profileImage ? (
                  <img src={profileImage} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {(username || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </>
          )}
        </nav>

        {/* MOBILE: Right */}
        <div className="flex items-center gap-2 md:hidden">
          {/* mobile bell and profile icons removed */}
        </div>
      </header>

      {/* ---------------- MOBILE SLIDE MENU ---------------- */}
      <div
        className={`fixed top-0 left-0 h-full w-[78%] max-w-xs bg-[var(--mobile-menu-bg)] z-[1100] transform transition-transform duration-250 ease-in-out border-r border-dashed border-[var(--mobile-menu-border)] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div style={{ padding: 14 }}>
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setMobileMenuOpen(false);
                if (isLoggedIn) {
                  const targetUrl = `/Edit/${username}`;
                  if (pathname !== targetUrl) {
                    router.push(targetUrl);
                  }
                } else {
                  const targetUrl = "/Login";
                  if (pathname !== targetUrl) {
                    router.push(targetUrl);
                  }
                }
              }}
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">{(username || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{username || "Guest"}</p>
                <p className="text-xs text-gray-400">Edit profile</p>
              </div>
            </div>
            <button
              onClick={() => {
                showToast("✖ Closing Menu");
                setMobileMenuOpen(false);
              }}
              aria-label="Close menu"
              className="text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-0">
            <NavButton
              onClick={() => {
                const targetUrl = "/About";
                setMobileMenuOpen(false);
                if (pathname !== targetUrl) {
                  showToast("ℹ Redirecting to the About page");
                  router.push(targetUrl);
                }
              }}
            >
              [ ABOUT ]
            </NavButton>

            {!isLoggedIn && (
              <>
                <NavButton
                  onClick={() => {
                    const targetUrl = "/";
                    setMobileMenuOpen(false);
                    if (pathname !== targetUrl) {
                      showToast("📝 Signup");
                      router.push(targetUrl);
                    }
                  }}
                >
                  [ SIGNUP ]
                </NavButton>

                <NavButton
                  onClick={() => {
                    const targetUrl = "/Login";
                    setMobileMenuOpen(false);
                    if (pathname !== targetUrl) {
                      showToast("🔐 Login");
                      router.push(targetUrl);
                    }
                  }}
                >
                  [ LOGIN ]
                </NavButton>
              </>
            )}

            <NavButton
              onClick={() => {
                const targetUrl = "/Public_Story";
                setMobileMenuOpen(false);
                if (pathname !== targetUrl) {
                  showToast("📖 Redirecting to the Public Stories");
                  router.push(targetUrl);
                }
              }}
            >
              [ PUBLIC STORIES ]
            </NavButton>

            {/* Theme Toggle Button for Mobile */}
            <NavButton
              onClick={() => {
                showToast(`Theme toggled to ${theme === "light" ? "dark" : "light"}`);
                toggleTheme();
                setMobileMenuOpen(false); // Close mobile menu after toggling theme
              }}
            >
              {theme === 'light' ? '☀️' : '🌙'}
            </NavButton>

            {isLoggedIn && (
              <>
                <NavButton
                  onClick={() => {
                    const targetUrl = `/Home/${username}`;
                    setMobileMenuOpen(false);
                    if (pathname !== targetUrl) {
                      showToast("🏠 Redirecting to the Home page");
                      router.push(targetUrl);
                    }
                  }}
                >
                  [ HOME ]
                </NavButton>

                <NavButton
                  onClick={() => {
                    const targetUrl = `/Story_Form/${username}`;
                    setMobileMenuOpen(false);
                    if (pathname !== targetUrl) {
                      showToast("✍ Redirecting to the Create Story");
                      router.push(targetUrl);
                    }
                  }}
                >
                  [ CREATE STORY ]
                </NavButton>

                <NavButton
                  onClick={() => {
                    showToast("🔔 Notifications");
                    setMobileMenuOpen(false);
                    setShowNotificationsPanel(true);
                  }}
                >
                  [ NOTIFICATIONS ]
                </NavButton>
                
                <NavButton
                  onClick={() => {
                    showToast("🔓 Logging out...");
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  [ LOGOUT ]
                </NavButton>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1050,
          }}
        />
      )}

      {/* Notifications panel */}
      {showNotificationsPanel && (
        <>
          <div
            onClick={() => setShowNotificationsPanel(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 1001,
            }}
          />

          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: 400,
              maxWidth: "100%",
              background: "var(--notification-panel-bg)",
              color: "var(--text-color)",
              zIndex: 1002,
              boxShadow: "-6px 0 18px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--notification-panel-border)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 className="text-lg">Notifications</h2>
                <p className="text-gray-400 text-xs">{notificationsCount} unread</p>
              </div>
              <button
                onClick={() => setShowNotificationsPanel(false)}
                className="text-xl text-gray-300"
              >
                ×
              </button>
            </div>

            <div style={{ padding: 16, overflowY: "auto", flexGrow: 1 }}>
              {loading ? (
                <div className="text-center py-6">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-6">No notifications</div>
              ) : (
                notifications.map(renderNotificationContent)
              )}
            </div>
          </aside>
        </>
      )}

      {/* Profile Panel */}
      {showProfilePanel && (
        <>
          <div
            onClick={() => setShowProfilePanel(false)}
            className="fixed inset-0 bg-black/40 z-[1000]"
          />

          <aside className="fixed top-20 right-5 w-80 bg-[var(--profile-panel-bg)] text-[var(--text-color)] z-[1002] p-5 border border-[var(--profile-panel-border)] rounded-lg">
            <div className="flex justify-between items-center border-b border-[var(--profile-panel-border)] pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-900 rounded-full overflow-hidden flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} className="w-full h-full" />
                  ) : (
                    <span className="text-2xl font-bold">
                      {(username || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold">{username || "User"}</p>
                  <p className="text-xs text-gray-400">{localStorage.getItem("email") || ""}</p>
                </div>
              </div>
              <button
                className="text-xl"
                onClick={() => setShowProfilePanel(false)}
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const targetUrl = `/Edit/${username}`;
                  setShowProfilePanel(false);
                  if (pathname !== targetUrl) {
                    showToast("👤 Edit Profile");
                    router.push(targetUrl);
                  }
                }}
                className="text-left hover:text-[#39FF14] transition-all duration-200"
              >
                Edit Profile
              </button>

              <button
                onClick={() => {
                  showToast("🔔 Notifications");
                  setShowProfilePanel(false);
                  setShowNotificationsPanel(true);
                }}
                className="text-left hover:text-[#39FF14] transition-all duration-200"
              >
                Notifications
              </button>

              <button
                onClick={() => {
                  showToast("🔓 Logging out...");
                  setShowProfilePanel(false);
                  handleLogout();
                }}
                className="text-left hover:text-[#39FF14] transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
