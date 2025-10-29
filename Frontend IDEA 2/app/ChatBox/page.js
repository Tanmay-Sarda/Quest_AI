"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function StoryPage() {
  const [prompt, setPrompt] = useState("");
  const [stories, setStories] = useState([]);
  const scrollRef = useRef(null);
  const lastHeightRef = useRef(0);
  const router = useRouter();

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userPrompt = prompt;
    const storyId = Date.now();

    setStories((prev) => [...prev, { id: storyId, prompt: userPrompt, response: "" }]);
    setPrompt("");

    const fullResponse = `Generated story for: "${userPrompt}". The adventurer steps into a mysterious forest, where the trees whisper secrets of an ancient kingdom.`;
    let charIndex = 0;

    const interval = setInterval(() => {
      charIndex++;
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId ? { ...s, response: fullResponse.slice(0, charIndex) } : s
        )
      );
      if (charIndex >= fullResponse.length) clearInterval(interval);
    }, 1);
  };

  const handleExit = () => router.push("/Home/Meet");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId;

    const loop = () => {
      const currentHeight = el.scrollHeight;
      if (currentHeight !== lastHeightRef.current) {
        el.scrollTop = currentHeight;
        lastHeightRef.current = currentHeight;
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen w-full p-0 box-border">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black flex justify-end items-center px-10 z-10">
        <button onClick={handleExit} className="form-button-exit">
          <span>[ EXIT ]</span>
        </button>
      </div>

      {/* Chat Box */}
      <div className="mt-20 w-[95%] flex flex-col flex-grow border-[6px] border-white/70 p-4 overflow-hidden h-[80vh] box-border">
        <div className="flex flex-col flex-grow border-[3px] border-white/50 p-2 overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            id="chat-messages"
            className="flex flex-col gap-2 overflow-y-auto custom-scrollbar"
          >
            {stories.length === 0 ? (
              <div className="message ai-message">
                Welcome, adventurer! Your story begins. What is your first action?
              </div>
            ) : (
              stories.map((s) => (
                <div key={s.id} className="flex flex-col gap-1">
                  <div className="message user-message">{s.prompt}</div>
                  <div className="message ai-message">{s.response}</div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form id="chat-form" onSubmit={handleSend} className="flex mt-2 w-full">
            <input
              id="chat-input"
              type="text"
              placeholder="> Enter your action..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-[90%] p-2 rounded-l bg-transparent border-b-2 border-white/30 text-white outline-none text-xl"
            />
            <button type="submit" className="form-button rounded-r">
              <span>[ SEND ]</span>
            </button>
          </form>




        </div>
      </div>
    </div>
  );
}
