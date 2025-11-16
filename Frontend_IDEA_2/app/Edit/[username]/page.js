"use client";
import { useEffect } from "react";
import React from "react";
import EditProfile from "@/component/EditProfile";
import { useParams, useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  // Toast function (same style as other pages)
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

  // Auth check
  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) {
      showToast("User not authenticated");
      setTimeout(() => {
        router.push("/Sign_in");
      }, 2000);
      return;
    }
  }, []);

  const { username } = useParams();

  return (
    <div
      className="w-full min-h-screen flex justify-center px-3 sm:px-6 py-28 box-border"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "black",
      }}
    >
      {/* Center the EditProfile component with max width */}
      <div className="w-full max-w-[800px]">
        <EditProfile username={username} />
      </div>
    </div>
  );
};

export default Page;
