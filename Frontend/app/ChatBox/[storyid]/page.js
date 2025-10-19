"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Send, Copy } from "lucide-react";

export default function StoryPage() {
  const [prompt, setPrompt] = useState("");
  const [stories, setStories] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null); 
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

  const handleExit = () => {
    router.push("/Home/Meet");
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stories]);

  const renderSendIcon = () => {
    return <Send className="w-5 h-5 ml-2 inline-block" />;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

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
              No stories yet. Start by entering a prompt ✍
            </p>
          ) : (
            stories.map((s) => (
              <div key={s.id} className="flex flex-col space-y-2">
                <div className="relative self-end bg-indigo-500/30 text-white p-2 rounded-xl max-w-[70%] group">
                  {s.prompt}
                  <button
                    onClick={() => handleCopy(s.prompt)}
                    className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy story"
                  >
                    <Copy className="w-4 h-4 text-white/70 hover:text-white" />
                  </button>
                </div>

                <div className="relative self-start bg-indigo-800/30 text-white p-2 rounded-xl max-w-[70%] group">
                  {s.response}
                  <button
                    onClick={() => handleCopy(s.response)}
                    className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy story"
                  >
                    <Copy className="w-4 h-4 text-white/70 hover:text-white" />
                  </button>
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
            ref={inputRef} 
            type="text"
            placeholder="Enter your story prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-600 transition"
          >
            Send {renderSendIcon()}
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
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.4);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .custom-scrollbar:hover {
          scrollbar-color: rgba(255, 255, 255, 0.4) transparent;
        }
      `}</style>
    </div>
  );
}
