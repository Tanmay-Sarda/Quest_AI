"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Send, Copy } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StoryPage() {
  const [prompt, setPrompt] = useState("");
  const [stories, setStories] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { username, storyid } = useParams();
  const [user, setuser] = useState("")
  const storyidParts = storyid.split("%20");
  const trimmedStoryId = storyidParts[0];
  const [isPublic, setIsPublic] = useState(storyidParts[1] === 'public');
  const isComplete = storyidParts[2] === 'true';

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const showToast = (message, duration = 1500) => {
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  };

  useEffect(() => {
    if (!localStorage.getItem("accessToken") && !isPublic) {
      showToast("User not authenticated");
      setTimeout(() => {
        router.push("/Sign_in");
      }, 2000);
      return;
    }
    setuser(localStorage.getItem("username"));
    inputRef.current?.focus();
    const fetchStoryContent = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_HOST}/story/content/${trimmedStoryId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        const data = await res.json();
        if(!res.ok){
          showToast(`${data.message}`)
          return 
        }
        const existingContent = data.data?.content || [];

        setStories(
          existingContent.map((item, index) => ({
            id: index,
            prompt: item.prompt,
            response: item.response,
          }))
        );
      } catch (error) {
        toast.error("Error:" + error.message);
      }
    };

    fetchStoryContent();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !storyid || loading) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/addcontent/${trimmedStoryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(`Error: ${data.message}`);
        return 
      }

      if (data.data.public === false) {
        setIsPublic(false);
      }

      setStories(
        data.data.content.map((item, index) => ({
          id: index,
          prompt: item.prompt,
          response: item.response,
        }))
      );
      setPrompt("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    if (isPublic==='1' ) {
      router.push(`/Public_Story`);
      return;
    }else{
    router.push(`/Home/${user}`);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stories]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleToggleComplete = () => {
    const action = isComplete ? "ongoing" : "complete";
    setConfirmMessage(`Are you sure you want to mark this story as ${action}?`);

    const confirmAction = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_HOST}/story/toggle-complete/${trimmedStoryId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          showToast(`Error: ${data.message}`);
          return;
        }

        showToast(data.message);
        setTimeout(() => router.push(`/Home/${username}`), 1500);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsConfirming(false);
      }
    };
    
    setOnConfirmAction(() => confirmAction);
    setIsConfirming(true);
  };

  const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="terminal-border bg-[var(--bg-color)] w-[90%] max-w-md p-4">
        <div className="terminal-content relative">
          <h2 className="terminal-title text-center">{message}</h2>
          <div className="mt-4 flex justify-center gap-4">
            <button onClick={onConfirm} className="form-button rounded-sm p-1 transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14]">[ YES ]</button>
            <button onClick={onCancel} className="form-button rounded-sm p-1 transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14]">[ NO ]</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="absolute top-15 flex flex-col items-center max-h-screen w-full px-2 sm:px-4 bg-[var(--bg-color)]">
      {isConfirming && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={onConfirmAction}
          onCancel={() => setIsConfirming(false)}
        />
      )}
      {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-[var(--header-bg)] flex max-sm:flex-col max-sm:h-auto max-sm:gap-2 justify-end items-center px-4 sm:px-10 py-2 z-10">
        <button
          onClick={handleExit}
          className="form-button text-sm sm:text-base"
        >
          <span>[ EXIT ]</span>
        </button>

        {!isPublic && (
          <button
            onClick={handleToggleComplete}
            className="form-button text-sm sm:text-base ml-2"
          >
            <span>{isComplete ? "[ CONTINUE ]" : "[ COMPLETE ]"}</span>
          </button>
        )}
      </div>

      {/* CHAT BOX */}
      <div className="mt-2 w-full sm:w-[95%] flex flex-col flex-grow border-[4px] sm:border-[6px] border-[var(--border-color)] p-2 sm:p-4 overflow-hidden h-[88vh]">
      
      
        <div className="flex flex-col flex-grow border-[2px] sm:border-[3px] border-[var(--border-color)] p-2 overflow-hidden">
          {/* MESSAGES */}
          <div
            ref={scrollRef}
            className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pb-4"
          >
            {stories.length === 0 ? (
              <div className="message ai-message">
                Welcome, adventurer! Your story begins. What is your first
                action?
              </div>
            ) : (
              stories.map((s) => (
                <div key={s.id} className="flex flex-col gap-2 w-full">
                  <div className="message user-message break-words rounded-xl relative group">
                    {s.prompt}
                    <button
                      onClick={() => handleCopy(s.prompt)}
                      className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4 text-[var(--text-color)]/70 hover:text-[var(--text-color)]" />
                    </button>
                  </div>

                  <div className="ai-message message break-words rounded-xl relative group">
                    {s.response}
                    <button
                      onClick={() => handleCopy(s.response)}
                      className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4 text-[var(--text-color)]/70 hover:text-[var(--text-color)]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* INPUT */}
          {!isPublic && !isComplete && (
            <div className="flex w-full border-t border-dashed border-[var(--border-color)] pt-2 mt-2 max-sm:flex-col">
              <textarea
                ref={inputRef}
                onKeyDown={handleKeyPress}
                placeholder="> Enter your action..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full sm:w-[90%] max-h-40 p-2 resize-none overflow-y-auto rounded bg-transparent text-[var(--text-color)] border border-[var(--border-color)] focus:outline-none"
                rows={1}
                disabled={loading}
              />

              <button
                type="submit"
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className="form-button mt-2 sm:mt-0 sm:ml-2 text-sm sm:text-base"
              >
                <span>{loading ? "[ O ]" : "[ SEND ]"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
