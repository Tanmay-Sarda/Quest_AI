"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "next/navigation";

// Reusable icon component for buttons
const Icon = ({ path }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

export default function HomePage() {
  const [completedStories, setCompletedStories] = useState([]);
  const [ongoingStories, setOngoingStories] = useState([]);
  const router = useRouter();
  const { username } = useParams();

  // --- Fetch stories when the component mounts ---
  useEffect(() => {
    const fetchStories = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setTimeout(() => toast.error("You must be logged in to see your stories."), 0);
      }else{

      try {
        // Fetch ongoing stories
        const ongoingRes = await fetch(
          "http://localhost:3000/api/v1/stories?status=ongoing",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (ongoingRes.ok) {
          const ongoingData = await ongoingRes.json();
          setOngoingStories(ongoingData.data || []);
        }

        // Fetch completed stories
        const completedRes = await fetch(
          "http://localhost:3000/api/v1/stories?status=completed",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (completedRes.ok) {
          const completedData = await completedRes.json();
          setCompletedStories(completedData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch stories:", error);
        toast.error("Could not fetch your stories.");
      }
    }
    };

    fetchStories();
  }, []);

  // --- Handler for continuing a story ---
  const handleContinueStory = (storyId) => {
    toast.info("Continuing your adventure...");
    // Pass story ID to the chatbox, for example via query params
    router.push(`/ChatBox?storyId=${storyId}`);
  };

  // --- Handler for deleting a story ---
  const handleDeleteStory = async (storyId, storyType) => {
    const token = localStorage.getItem("accessToken");
    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        const res = await fetch(
          `http://localhost:3000/api/v1/stories/${storyId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          toast.success("Story deleted!");
          if (storyType === "ongoing") {
            setOngoingStories((stories) =>
              stories.filter((s) => s.id !== storyId)
            );
          } else {
            setCompletedStories((stories) =>
              stories.filter((s) => s.id !== storyId)
            );
          }
        } else {
          toast.error("Failed to delete the story.");
        }
      } catch (error) {
        console.error("Delete story error:", error);
        toast.error("An error occurred while deleting the story.");
      }
    }
  };

  const EmptyState = ({ message, gradientFrom, gradientTo, textColor }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-b ${gradientFrom} ${gradientTo} border border-[#2a2a40] shadow-lg max-w-md w-full`}
    >
      <p className={`text-xl font-semibold ${textColor} text-center`}>
        {message}
      </p>
      <span className="text-gray-400 text-sm mt-2 text-center">
        Start creating your first story to see it here!
      </span>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-20 mt-10">
      {/* Completed Stories */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6 text-blue-400 text-center">
          Completed User Stories
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 w-full">
          {completedStories.length === 0 ? (
            <div className="col-span-full flex justify-center">
              <EmptyState
                message="No completed stories yet"
                gradientFrom="from-[#1a1a2e]"
                gradientTo="to-[#0f0f1a]"
                textColor="text-blue-400"
              />
            </div>
          ) : (
            completedStories.map((story) => (
              <motion.div
                key={story.id}
                className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-300">
                    {story.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {story.description}
                  </p>
                  <span className="text-sm text-gray-500 italic">
                    You play as:{" "}
                    <span className="text-gray-300">{story.character}</span>
                  </span>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleDeleteStory(story.id, "completed")}
                    className="text-red-400 hover:text-red-300 p-2 rounded-full transition-colors bg-red-500/10 hover:bg-red-500/20"
                  >
                    <Icon path="M6 18L18 6M6 6l12 12" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Ongoing Stories */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6 text-purple-400 text-center">
          Ongoing User Stories
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 w-full">
          {ongoingStories.length === 0 ? (
            <div className="col-span-full flex justify-center">
              <EmptyState
                message="No ongoing stories yet"
                gradientFrom="from-[#241432]"
                gradientTo="to-[#0f0f1a]"
                textColor="text-purple-400"
              />
            </div>
          ) : (
            ongoingStories.map((story) => (
              <motion.div
                key={story.id}
                className="p-6 rounded-2xl bg-gradient-to-b from-[#141422] to-[#0f0f1a] border border-[#1e1e2f] flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-300">
                    {story.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {story.description}
                  </p>
                  <span className="text-sm text-gray-500 italic">
                    You play as:{" "}
                    <span className="text-gray-300">{story.character}</span>
                  </span>
                </div>
                <div className="flex justify-end items-center gap-3 mt-4">
                  <button
                    onClick={() => handleContinueStory(story.id)}
                    className="text-green-400 hover:text-green-300 p-2 rounded-full transition-colors bg-green-500/10 hover:bg-green-500/20"
                  >
                    <Icon path="M12 4.5v15m7.5-7.5h-15" />
                  </button>
                  <button
                    onClick={() => handleDeleteStory(story.id, "ongoing")}
                    className="text-red-400 hover:text-red-300 p-2 rounded-full transition-colors bg-red-500/10 hover:bg-red-500/20"
                  >
                    <Icon path="M6 18L18 6M6 6l12 12" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
    </div>
  );
}
