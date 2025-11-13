"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Profile modal removed; using a rounded profile icon button instead
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setusername] = useState("")
  const fileInputRef = useRef(null);
  const [characterName, setCharacterName] = useState("");

  useEffect(() => {

    if (typeof window !== "undefined") {
      setusername(sessionStorage.getItem("username"));
      const img = sessionStorage.getItem("profileImage");
      if (img) setProfileImage(img);
    }
  }, []);

  const handleProfileFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      try {
        sessionStorage.setItem("profileImage", dataUrl);
      } catch (err) {
        console.warn("Failed to store profile image in sessionStorage", err);
      }
      setProfileImage(dataUrl);
      showToast("✅ Profile picture updated");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, [pathname]);

  useEffect(() => {
    fetchNotifications();
  }, [isLoggedIn]);

  // load notifications count (simple example: read from sessionStorage)
  // useEffect(() => {
  //   const stored = sessionStorage.getItem("notificationsCount");
  //   setNotificationsCount(stored ? parseInt(stored, 10) : 0);
  // }, [pathname, isLoggedIn]);

  // load notifications list when panel opens
  // useEffect(() => {
  //   if (!showNotificationsPanel) return;
  //   try {
  //     const raw = sessionStorage.getItem("notifications");
  //     const parsed = raw ? JSON.parse(raw) : [];
  //     setNotifications(Array.isArray(parsed) ? parsed : []);
  //   } catch {
  //     setNotifications([]);
  //   }
  // }, [showNotificationsPanel]);

  // lock body scroll & handle ESC to close panel
  // useEffect(() => {
  //   if (showNotificationsPanel) {
  //     document.body.style.overflow = "hidden";
  //     const onKey = (e) => {
  //       if (e.key === "Escape") setShowNotificationsPanel(false);
  //     };
  //     document.addEventListener("keydown", onKey);
  //     return () => {
  //       document.body.style.overflow = "";
  //       document.removeEventListener("keydown", onKey);
  //     };
  //   }
  // }, [showNotificationsPanel]);

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
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("username");
    setIsLoggedIn(false);
    alert("🔓 You have been logged out.");

    router.push("/Sign_in");
  };

  const handleNotificationsClick = () => {
    // open side panel instead of navigating
    setShowNotificationsPanel((s) => !s);
  };



  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/notification/`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data);
        setNotificationsCount(data.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && showNotificationsPanel) {
      fetchNotifications();
    }
  }, [isLoggedIn, showNotificationsPanel]);

  // Handle notification actions
  const handleNotificationAction = async (notificationId, accept, character = "") => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/notification/delete/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          accept,
          character
        })
      });

      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
        router.push(`/Home/${username}`); // Refresh the page to reflect changes
      }
    } catch (error) {
      console.error("Failed to handle notification:", error);
      showToast("⚠️ An error occurred while processing the notification.");
    }
  };

  // Get status text
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

  // Update the notifications panel content
  const renderNotificationContent = (notification) => {
    return (
      <div
        key={notification._id}
        className="p-4 border-b border-gray-700"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium">
              {notification.fromUser?.email || "Unknown User"}
            </p>
            <p className="text-sm text-gray-400">
              Story: {notification.story_id?.title || "Unknown Story"}
            </p>
          </div>
          {getStatusBadge(notification.status)}
        </div>

        {notification.status === 0 && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Enter character name"
              className="flex-1 px-2 py-1 bg-gray-800 rounded"
              onChange={(e) => setCharacterName(e.target.value)}
            />
            <button
              onClick={() => handleNotificationAction(
                notification._id,
                true,
                characterName
              )}
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => handleNotificationAction(
                notification._id,
                false,
              )}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )}

        {notification.status !== 0 && (
          //delete this notification 
          <button
            onClick={() => handleNotificationAction(
              notification._id,
              null,

            )}
            className="mt-3 px-3 py-1 bg-gray-600 rounded hover:bg-gray-700"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          position: "fixed",
          top: 0,
          zIndex: 1000,
          backgroundColor: "#000",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 25px",
          boxSizing: "border-box",
          borderBottom: "1px dashed rgba(255,255,255,0.3)",
        }}
      >

        {/* Logo */}
        <img
          src="/QuestLogo.jpeg"
          alt="Quest AI Logo"
          className="h-[70px] cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => router.push(isLoggedIn ? `/Home/${username}` : "/Sign_in")}
        />

        {/* Navigation */}
        <nav
          style={{
            display: "flex",
            gap: "18px",
            alignItems: "center",
            justifyContent: "flex-end",
            flexGrow: 1,
          }}
        >

          {/* When NOT logged in */}
          {!isLoggedIn && (
            <>
              <button
                className="form-button rounded-sm p-1"
                onClick={() => {
                  showToast("⏳ Redirecting to About page...");
                  setTimeout(() => { router.push("/About") }, 1000)
                }
                }
              >
                [ ABOUT ]
              </button>

              <button
                className="form-button rounded-sm p-1"
                onClick={() => {
                  showToast("⏳ Redirecting to Signup page...");
                  setTimeout(() => { router.push("/") }, 1000)
                }
                }
              >
                [ SIGNUP ]
              </button>
              <button
                className="form-button rounded-sm p-1"
                onClick={() => {
                  showToast("⏳ Redirecting to Signin page...");
                  setTimeout(() => { router.push("/Sign_in") }, 1000)
                }
                }
              >
                [ SIGNIN ]
              </button>
            </>
          )}

          <button
            className="form-button rounded-sm p-1"
            onClick={() => {
              showToast("⏳ Redirecting to Public Story page...");
              setTimeout(() => { router.push(`/Public_Story`) }, 1000)
            }
            }
          >
            [ Public Stories ]
          </button>

          {/* When logged in */}
          {isLoggedIn && (
            <>
              <button
                className="form-button rounded-sm p-1"
                onClick={() => {
                  showToast("⏳ Redirecting to Home page...");
                  setTimeout(() => { router.push(`/Home/${username}`) }, 1000)
                }
                }
              >
                [ HOME ]
              </button>

              <button
                className="form-button rounded-sm p-1"
                onClick={() => {
                  showToast("⏳ Redirecting to Create Story page...");
                  setTimeout(() => { router.push(`/Story_Form/${username}`) }, 1000)
                }
                }
              >
                [ CREATE STORY ]
              </button>
              {/* Top-level logout and notifications buttons removed; use profile panel instead */}

              {/* Profile avatar button (GitHub/Google-like) - placed at far right */}
              <button
                onClick={() => {
                  // Toggle profile panel; ensure notifications panel is closed
                  setShowProfilePanel(s => !s);
                  setShowNotificationsPanel(false);
                }}
                title="Profile"
                aria-label="Profile"
                className="ml-1 rounded-full w-10 h-10 flex items-center justify-center border border-white/10 shadow-sm hover:scale-105 transition-transform duration-150 overflow-hidden bg-[#504747]"
                style={{ minWidth: 40 }}
              >
                {(() => {
                  if (typeof window !== "undefined") {
                    const img = sessionStorage.getItem("profileImage");
                    if (img) {
                      return <img src={img} alt="Profile" className="w-full h-full object-cover" />;
                    }
                    const storedName = sessionStorage.getItem("username") || username || "U";
                    const initial = storedName.charAt(0).toUpperCase();
                    return (
                      <span className="text-2xl font-extrabold text-white" style={{ userSelect: "none", lineHeight: 1 }}>{initial}</span>
                    );
                  }
                  return <span className="text-sm font-semibold text-white">U</span>;
                })()}
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Notifications side panel + backdrop */}
      {showNotificationsPanel && (
        <>
          {/* backdrop */}
          <div
            onClick={() => setShowNotificationsPanel(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 1001,
            }}
            aria-hidden="true"
          />

          {/* panel */}
          <aside
            role="dialog"
            aria-label="Notifications"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: 400,
              maxWidth: "100%",
              background: "#0b0b0b",
              color: "#fff",
              zIndex: 1002,
              boxShadow: "-6px 0 18px rgba(0,0,0,0.6)",
              transform: "translateX(0)",
              transition: "transform 240ms ease",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 20 }}>Notifications</h2>
                <div style={{ fontSize: 12, color: "#aaa" }}>{notificationsCount} unread</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setShowNotificationsPanel(false)}
                  aria-label="Close notifications"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ccc",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: 16, overflowY: "auto", flexGrow: 1 }}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No notifications</div>
              ) : (
                notifications.map(notification => renderNotificationContent(notification))
              )}
            </div>
          </aside>
        </>
      )}

      {/* Profile side panel + backdrop */}
      {showProfilePanel && (
        <>
          <div
            onClick={() => setShowProfilePanel(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1001 }}
            aria-hidden="true"
          />

          <aside
            role="dialog"
            aria-label="Profile"
            className="fixed top-0 right-0 h-auto w-80 max-w-full bg-[#0b0b0b] text-white z-[1002] shadow-xl transform transition-transform duration-200 flex flex-col"
          >
            <div style={{ padding: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 9999, overflow: "hidden", background: "#504747", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (() => {
                      if (typeof window !== "undefined") {
                        const storedName = sessionStorage.getItem("username") || username || "U";
                        return <span style={{ color: "#fff", fontWeight: 800, fontSize: 26 }}>{storedName.charAt(0).toUpperCase()}</span>;
                      }
                      return <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>U</span>;
                    })()
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{sessionStorage.getItem("username") || username || "User"}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{sessionStorage.getItem("email") || ""}</div>
                </div>
              </div>
              <button onClick={() => setShowProfilePanel(false)} style={{ background: "transparent", border: "none", color: "#ccc", fontSize: 20, cursor: "pointer" }} aria-label="Close profile">×</button>
            </div>

            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { setShowProfilePanel(false); showToast("⏳ Redirecting to Edit Profile..."); setTimeout(() => router.push(`/Edit/${username}`), 300); }} className="px-3 py-2 text-left rounded cursor-pointer transition-colors duration-150 hover:text-green-500 hover:font-semibold focus:outline-none">Edit Profile</button>
              <button onClick={() => { setShowProfilePanel(false); setShowNotificationsPanel(true); }} className="px-3 py-2 text-left rounded cursor-pointer transition-colors duration-150 hover:text-green-500 hover:font-semibold focus:outline-none">Notifications</button>
              <button onClick={() => { setShowProfilePanel(false); showToast("⏳ Logging out..."); setTimeout(() => handleLogout(), 400); }} className="px-3 py-2 text-left rounded cursor-pointer transition-colors duration-150 hover:text-green-500 hover:font-semibold focus:outline-none">Logout</button>
            </div>

          </aside>
        </>
      )}

      {/* EditProfile modal removed; navigation to /Edit handled by profile button */}
    </>
  );
}
