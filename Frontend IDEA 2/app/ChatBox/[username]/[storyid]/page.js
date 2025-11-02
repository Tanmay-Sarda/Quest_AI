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
  const trimmedStoryId = storyid?.trim();

  // Toast notification function
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

  useEffect(() => {

    if (!sessionStorage.getItem("accessToken")) {
      showToast("User not authenticated");
      setTimeout(() => { router.push('/Sign_in') }, 2000);
      return;
    }
    
    inputRef.current?.focus();
    const fetchStoryContent = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("You must be logged in to access this story.");
          router.push("/Sign_in");
        }

        const res = await fetch(
          `http://localhost:3000/api/v1/story/content/${trimmedStoryId}`,
          {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
          }
        );

        if (res.status >= 400 && res.status < 500) {
          showToast("⚠️ " + `Client Error: ${res.statusText}`);
        }

        const data = await res.json();
        const existingContent = data.data?.content || [];

        setStories(
          existingContent.map((item, index) => ({
            id: index,
            prompt: item.prompt,
            response: item.response,
          }))
        );


      } catch (error) {
        console.error("Error fetching story content:", error);
        toast.error("Error:" + error.message);
      }
    };

    fetchStoryContent();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!prompt.trim() || !storyid) return;
    setLoading(true);

    try {
      const token = sessionStorage.getItem('accessToken') // get token from storage

      const response = await fetch(
        `http://localhost:3000/api/v1/story/addcontent/${trimmedStoryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, //send JWT in header
          },
          credentials: "include", // ✅ allows sending JWT cookie
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(`Error: ${data.message || 'Failed to send prompt'}`);
      }



      setStories(data.data.content.map((item, index) => ({
        id: index,
        prompt: item.prompt,
        response: item.response,
      })));
      setPrompt("");
    } catch (err) {
      console.error("Error sending prompt:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleExit = () => {
    router.push(`/Home/${username}`);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stories]);

  // const renderSendIcon = () => {
  //   return <Send className="w-5 h-5  ml-2 inline-block" />;
  // };

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
    <div className="flex flex-col items-center min-h-screen w-full p-0 box-border z-500">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black flex justify-end items-center px-10 z-10">
        <button onClick={handleExit} className="form-button-exit">
          <span>[ EXIT ]</span>
        </button>
      </div>

      {/* Chat Box */}
      <div className="mt-20 w-[95%] flex flex-col flex-grow border-[6px] border-white/70 p-4 overflow-hidden h-[90vh] box-border">
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
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="message user-message relative group">{s.prompt}
                    <button
                      onClick={() => handleCopy(s.prompt)}
                      className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy story"
                    >
                      <Copy className="w-4 h-4 text-white/70 hover:text-white" />
                    </button>
                  </div>
                  <div className="message ai-message relative group">{s.response}
                    <button
                      onClick={() => handleCopy(s.response)}
                      className="absolute bottom-[-18px] right-2 opacity-0
                     group-hover:opacity-100 transition-opacity"
                      title="Copy story"
                    >
                      <Copy className="w-4 h-4 text-white hover:text-white" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div onClick={() => handleSend} className=" flex flex-row w-full text-center border-t-1 border-dashed
           border-t-white/50 pt-2 mt-2" >

            <textarea
              ref={inputRef}
              // enter send the message, shift + enter for new line
              onKeyDown={handleKeyPress}
              placeholder="> Enter your action..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-[93%] max-h-40 p-2 resize-none overflow-y-auto rounded bg-transparent text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              rows={1}
            />

            <button type="submit" className="">
              <span>[ SEND ]</span>
            </button>
          </div>




        </div>
      </div>
    </div>
  );
}
