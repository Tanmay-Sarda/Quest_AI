"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function StoryPage() {
  const [prompt, setPrompt] = useState("");
  const [stories, setStories] = useState([]);
  const scrollRef = useRef(null);
  const router = useRouter();

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const newStory = {
      id: Date.now(),
      prompt,
      response: `Generated story for: "${prompt}"`,
    };
    setStories([...stories, newStory]);
    setPrompt("");
  };

  // --- UPDATED EXIT HANDLER ---
  const handleExit = () => {
    const username = localStorage.getItem("username"); // Get username from storage
    if (username) {
      router.push(`/Home/${username}`); // Redirect to user's home page
    } else {
      // Fallback if username is not found for some reason
      router.push("/");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stories]);

  // This effect will run once to check if we are continuing a story
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("storyId");

    if (storyId) {
      // You would fetch the existing story/chat history from your backend here
      console.log("Continuing story with ID:", storyId);
      // Example: setStories(fetchedStoryHistory);
      toast.info(`Loading existing story...`);
    }
  }, []);

  return (
    <div className="flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-[90vw] h-[calc(100vh-20px)] flex flex-col rounded-2xl bg-white/10 shadow-xl backdrop-blur-xl relative"
      >
        {/* Exit Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 text-white w-20 h-10 text-lg font-medium px-3 py-1 rounded-lg"
          >
            Exit
          </button>
        </div>

        {/* Scrollable Story Box */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 mt-16 space-y-4 custom-scrollbar"
        >
          {stories.length === 0 ? (
            <p className="text-center text-gray-400 mt-4">
              No stories yet. Start by entering a prompt ✍️
            </p>
          ) : (
            stories.map((s) => (
              <div key={s.id} className="flex flex-col space-y-2">
                {/* User Prompt */}
                <div className="self-end bg-indigo-500/30 text-white p-3 rounded-xl max-w-[70%] text-right">
                  {s.prompt}
                </div>

                {/* AI Response */}
                <div className="self-start bg-indigo-800/30 text-white p-3 rounded-xl max-w-[70%]">
                  {s.response}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 p-4 border-t border-white/10"
        >
          <input
            type="text"
            placeholder="Enter your story prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-600 transition"
          >
            Send
          </button>
        </form>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
