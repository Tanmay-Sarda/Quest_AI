"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";


const page = () => {
  const router = useRouter();
  const [username, setusername] = useState("")
  const [publicstories, setPublicstories] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state

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

  const downloadStory = async (story) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/content/${story._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!res.ok) {
        showToast("Failed to fetch story content");
        return;
      }

      const data = await res.json();
      const storyContent = data.data?.content || [];

      let formattedContent = `Title: ${story.title}\nOwner: ${story.email}\nCharacter: ${story.character}\n\n`;
      storyContent.forEach((item) => {
        formattedContent += `> ${item.prompt}\n`;
        formattedContent += `${item.response}\n\n`;
      });

      const blob = new Blob([formattedContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${story.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(`Error downloading story: ${err}`);
    }
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
    } finally {
      setLoading(false); // Set loading to false after fetch
    }
  };

  const StoryCard = ({ story, type }) => ( // Moved inside and simplified
    <div
      className="terminal-border min-h-[300px] h-auto grid grid-cols-1 gap-3 items-center story-card"
      style={{ backgroundColor: 'var(--terminal-bg)' }}
    >
      <div
        className="terminal-content relative h-fit min-h-[280px] flex 
                max-sm:flex-col max-sm:p-3 max-sm:min-h-[200px]"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        <div className="flex flex-col w-full max-sm:gap-1">
          <div className="flex icon justify-center">
            <p className="text-2xl max-sm:text-xl font-mediium" style={{ color: 'var(--user-color)' }}>
              {story.title}
            </p>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:gap-0">
            <h2 className="max-sm:text-sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Owner:</h2>
            <p className="max-sm:text-sm">{story.email}</p>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:gap-0">
            <h2 className="max-sm:text-sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Character:</h2>
            <p className="max-sm:text-sm">{story.character}</p>
          </div>

          <div className="flex gap-2 max-sm:flex-col max-sm:gap-0">
            <h2 className="max-sm:text-sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Description:</h2>
            <p className="max-h-[100px] overflow-auto max-sm:text-sm">
              {story.description}
            </p>
          </div>
        </div>

        <div className="absolute right-5 top-4 flex gap-2 max-sm:right-3 max-sm:top-3">
          {type === "ongoing" && (
            <button
              title="Continue Story"
              className="text-lg transition-all duration-200 hover:scale-125
                            max-sm:text-base"
              style={{ color: 'var(--user-color)' }}
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
          <button
            title="Download Story"
            className="text-lg transition-all duration-200 hover:scale-125
                          max-sm:text-base"
            style={{ color: 'var(--user-color)' }}
            onClick={() => downloadStory(story)}
          >
            <FontAwesomeIcon
              className="text-xl max-sm:text-lg"
              icon={faDownload}
            />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div
        className="min-h-screen w-full flex flex-col items-center 
                p-5 max-sm:p-3"
      >
        <h1 className="text-4xl font-bold mb-8 mt-10 max-sm:text-2xl max-sm:mb-4">
          Public Stories
        </h1>

        <div
          className="grid grid-cols-1 gap-6 w-full max-w-7xl 
                    lg:grid-cols-2 "
        >
          {loading ? ( // Conditional rendering for loading state
            <p className="text-center col-span-full">
              Loading public stories...
            </p>
          ) : publicstories.length === 0 ? (
            <p className="text-center col-span-full">
              No public stories available.
            </p>
          ) : (
            publicstories.map((story) => (
              <StoryCard key={story._id} story={story} type="ongoing" username={username} showToast={showToast} router={router} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default page;