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
  const [storyOwner, setStoryOwner] = useState(null);

  const formatPromptText = (text = "") => {
    // 1) Convert any literal "\n" sequences to real newlines
    const normalized = text.replace(/\\n/g, "\n");

    // 2) Allow at most two newline characters in total
    let newlineCount = 0;
    let result = "";
    for (let i = 0; i < normalized.length; i += 1) {
      const char = normalized[i];
      if (char === "\n") {
        newlineCount += 1;
        if (newlineCount > 2) {
          continue;
        }
      }
      result += char;
    }

    // 3) Ensure no remaining literal "\n" text
    return result.replaceAll(/\\n/g, " ");
  };

  const mapContentToStories = (content, currentUser, owner) =>
    content.map((item, index) => {
      const ownerName =
        (owner && (owner.character || owner.username)) || "Unknown";
      let promptData = {};
      if (typeof item.prompt === "string") {
        // Old data format
        const text = item.prompt || "";
        promptData = {
          text: formatPromptText(text),
          character: ownerName,
        };
      } else {
        // New data format
        const basePrompt = {
          ...item.prompt,
        };
        const character = basePrompt.character || ownerName;
        const rawText = basePrompt.text || "";
        promptData = {
          ...basePrompt,
          character,
          text: formatPromptText(rawText),
        };
      }

      return {
        id: index,
        prompt: promptData,
        response: formatPromptText(item.response || ""),
      };
    });



  useEffect(() => {
    if (!localStorage.getItem("accessToken") && !isPublic) {
      toast.error("User not authenticated");
      setTimeout(() => {
        router.push("/Login");
      }, 2000);
      return;
    }
    const currentUser = localStorage.getItem("username");
    setuser(currentUser);
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
        if (!res.ok) {
          toast.error(`${data.message}`);
          return;
        }
        const existingContent = data.data?.content || [];
        const owner = data.data?.owner;
        setStoryOwner(owner);
        setStories(mapContentToStories(existingContent, currentUser, owner));
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

    const currentUser = localStorage.getItem("username");
    const currentPrompt = prompt; // Store current prompt before clearing

    // Immediately display the user's message
    setStories((prevStories) => [
      ...prevStories,
      {
        id: Date.now(), // Unique ID for the temporary message
        prompt: {
          text: formatPromptText(currentPrompt),
          character: currentUser,
        },
        response: "", // LLM response will be filled later or replaced
      },
    ]);
    setPrompt(""); // Clear the input field

    setLoading(true); // Start loading after displaying user's message

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
          body: JSON.stringify({ prompt: currentPrompt }), // Use currentPrompt here
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Error: ${data.message}`);
        // Optionally, remove the temporarily added user message if there was an error
        setStories((prevStories) => prevStories.slice(0, prevStories.length - 1));
        return
      }

      const owner = data.data?.owner;
      setStoryOwner(owner);

      if (data.data.public === false) {
        setIsPublic(false);
      }

      setStories(mapContentToStories(data.data.content, currentUser, owner));
      setPrompt("");
    } catch (err) {
      toast.error(err.message);
      // Remove the temporarily added user message if there was an error
      setStories((prevStories) => prevStories.slice(0, prevStories.length - 1));
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
          toast.error(`Error: ${data.message}`);
          return;
        }

        toast.success(data.message);
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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
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
            {stories.length === 0 ? ( null
            ) : (
              stories.slice(1).flatMap(s => [
                { ...s.prompt, type: 'prompt', id: s.id + '-prompt' },
                { text: s.response, type: 'response', id: s.id + '-response', character: 'Story-Master' }
              ]).map(msg => (
                <div key={msg.id} className={`w-full flex ${msg.type === 'response' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex items-end max-w-[90%] sm:max-w-[80%] ${msg.type === 'prompt' ? 'flex-row-reverse' : ''}`}>
                        <div className={`message rounded-xl relative group p-2 min-w-[100px] border-dotted border-2 ${
                            msg.type === 'response' ? 'bg-black/20 text-white border-gray-500' :
                            (msg.character === user
                                ? "bg-white/5 text-white border-gray-400"
                                : "bg-white/5 text-white border-gray-500")
                        }`}>
                            {(msg.character !== user || msg.type === 'response') && (
                                <p className="text-xs text-gray-400 mb-1 font-bold">
                                    {msg.character}
                                </p>
                            )}
                            <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                            <button
                                onClick={() => handleCopy(msg.text)}
                                className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Copy className="w-4 h-4 text-[var(--text-color)]/70 hover:text-[var(--text-color)]" />
                            </button>
                        </div>
                    </div>
                </div>
              ))
            )}
            {loading && (
              <div className="w-full flex justify-start">
                <div className="flex items-end max-w-[90%] sm:max-w-[70%]">
                  <div className="message ai-message rounded-xl relative group p-2 bg-black/20 text-white rounded-bl-none min-w-[80px]">
                    <p className="text-xs text-gray-400 mb-1 font-bold">
                      Story-Master
                    </p>
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <p className="break-words ml-2"> The Story master is thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
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
                <span>{loading ? "[ ... ]" : "[ SEND ]"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
