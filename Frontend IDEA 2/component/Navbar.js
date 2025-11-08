"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EditProfile from "../component/EditProfile";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { username } = useParams();
  const [characterName, setCharacterName] = useState("");

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
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => 
                  {showToast("⏳ Redirecting to About page...");
                  setTimeout(() => {router.push("/About")}, 1000)}
                }
              >
                [ ABOUT ]
              </button>

              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => 
                  {showToast("⏳ Redirecting to Signup page...");
                  setTimeout(() => {router.push("/")}, 1000)}
                }
              >
                [ SIGNUP ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() =>
                  {showToast("⏳ Redirecting to Signin page...");
                  setTimeout(() => {router.push("/Sign_in")}, 1000)
                  }
                }
              >
                [ SIGNIN ]
              </button>
            </>
          )}

          {/* When logged in */}
          {isLoggedIn && (
            <>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() =>
                {
                  showToast("⏳ Redirecting to Home page...");
                  setTimeout(() => {router.push(`/Home/${username}`)}, 1000)
                }
                }
              >
                [ HOME ]
              </button>

              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => 
                {
                  showToast("⏳ Redirecting to Create Story page...");
                  setTimeout(() => {router.push(`/Story_Form/${username}`)}, 1000)
                }
                }
              >
                [ CREATE STORY ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => 
                  {showToast("⏳ Redirecting to Edit Profile page...");
                  setTimeout(() => {router.push(`/Edit/${username}`)}, 1000)}
                }
              >
                [ EDIT PROFILE ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={()=>{
                  showToast("⏳ Logging out...");
                  setTimeout(() => {handleLogout()}, 1000)
                }}
              >
                [ LOGOUT ]
              </button>

               {/* Notifications button */}
              <button
                onClick={handleNotificationsClick}
                style={{
                  position: "relative",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Notifications"
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
              >
                {/* bell emoji as icon (replace with SVG/icon if desired) */}
                <FontAwesomeIcon icon={faBell} />
                {notificationsCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      background: "#ff3b30",
                      color: "#fff",
                      borderRadius: 9,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                    aria-label={`${notificationsCount} unread notifications`}
                  >
                    {notificationsCount}
                  </span>
                )}
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

      {/* ✅ Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile closeModal={() => setShowEditProfile(false)} />
      )}
    </>
  );
}