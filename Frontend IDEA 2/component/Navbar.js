"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import EditProfile from "../component/EditProfile"; 

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

 
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    alert("🔓 You have been logged out.");
    router.push("/Sign_in");
  };

  return (
    <>
      <header
        style={{
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
          onClick={() => router.push(isLoggedIn ? "/Home/user" : "/Sign_in")}
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
          <button
            className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
            onClick={() => router.push("/About")}
          >
            [ ABOUT ]
          </button>

          {/* When NOT logged in */}
          {!isLoggedIn && (
            <>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => router.push("/")}
              >
                [ SIGNUP ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => router.push("/Sign_in")}
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
                onClick={() => router.push("/Home/user")}
              >
                [ HOME ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => router.push("/StoryForm")}
              >
                [ CREATE STORY ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={() => setShowEditProfile(true)}
              >
                [ EDIT PROFILE ]
              </button>
              <button
                className="transition-all duration-200 text-[#ccc] hover:text-[#39FF14] text-xl tracking-wide hover:scale-110"
                onClick={handleLogout}
              >
                [ LOGOUT ]
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ✅ Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile closeModal={() => setShowEditProfile(false)} />
      )}
    </>
  );
}
