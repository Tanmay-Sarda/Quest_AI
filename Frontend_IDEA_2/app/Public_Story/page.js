"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";

const page = () => {
  const router = useRouter();
  const [username, setusername] = useState("")
  const [publicstories, setPublicstories] = useState([]);

  useEffect(() => {
    getpublicstories();
    setusername(localStorage.getItem('username'));
  }, []);

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

   const getpublicstories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/publicstories`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) showToast("Failed to fetch public stories");

      const data = await res.json();
      setPublicstories(data.data);
    } catch (err) {
      showToast(`Error fetching public stories: ${err}`);
    }
  };

  const StoryCard = ({ story, type }) => (
    <div
      className="terminal-border min-h-[300px] h-auto grid grid-cols-1 gap-3 items-center bg-[#3c3b3b]
            max-sm:min-h-[240px] max-sm:p-1"
      style={{ transition: "all 0.3s ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div
        className="terminal-content relative h-fit min-h-[280px] flex bg-[#262626]
                max-sm:flex-col max-sm:p-3 max-sm:min-h-[200px]"
      >
        <div className="flex flex-col w-full max-sm:gap-1">
          <div className="flex icon justify-center">
            <p className="text-2xl max-sm:text-xl font-mediium text-green-500">
              {story.title}
            </p>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:gap-0">
            <h2 className="text-gray-500 max-sm:text-sm">Owner:</h2>
            <p className="max-sm:text-sm">{story.email}</p>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:gap-0">
            <h2 className="text-gray-500 max-sm:text-sm">Character:</h2>
            <p className="max-sm:text-sm">{story.character}</p>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:gap-0">
            <h2 className="text-gray-500 max-sm:text-sm">Description:</h2>
            <p className="max-h-[100px] overflow-auto max-sm:text-sm">
              {story.description}
            </p>
          </div>
        </div>

        <div className="absolute right-5 top-4 flex gap-2 max-sm:right-3 max-sm:top-3">
          {type === "ongoing" && (
            <button
              title="Continue Story"
              className="text-green-500 hover:text-green-600 text-lg transition-all duration-200 hover:scale-125
                            max-sm:text-base"
              onClick={() => {
                showToast("Loading ChatBox...");
                router.push(`/ChatBox/${username}/${story._id} True`);
              }}
            >
              <FontAwesomeIcon
                className="text-xl max-sm:text-lg"
                icon={faPlay}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div
        className="min-h-screen w-full flex flex-col items-center 
                bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white 
                p-5 max-sm:p-3"
      >
        <h1 className="text-4xl font-bold mb-8 mt-10 max-sm:text-2xl max-sm:mb-4">
          Public Stories
        </h1>

        <div
          className="grid grid-cols-1 gap-6 w-full max-w-7xl 
                    lg:grid-cols-2 "
        >
          {publicstories.length === 0 ? (
            <p className="text-center col-span-full">
              No public stories available.
            </p>
          ) : (
            publicstories.map((story) => (
              <StoryCard key={story._id} story={story} type="ongoing" />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
