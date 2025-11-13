"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Send, Copy } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { set } from "mongoose";

export default function StoryPage() {
  const [prompt, setPrompt] = useState("");
  const [stories, setStories] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { username, storyid } = useParams();
  //In stroy Id at the end space and then true or false for public or private
  const trimmedStoryId = storyid.split("%20")[0]; 
  const isPublic = storyid.split("%20")[1] === "True";

  console.log("Trimmed Story ID:", trimmedStoryId);

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

    if (!sessionStorage.getItem("accessToken") && !isPublic) {
      showToast("User not authenticated");
      setTimeout(() => { router.push('/Sign_in') }, 2000);
      return;
    }
    
    inputRef.current?.focus();
    const fetchStoryContent = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_HOST}/story/content/${trimmedStoryId}`,
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

    if (!prompt.trim() || !storyid || loading) return;
    setLoading(true);

    try {
      const token = sessionStorage.getItem('accessToken') // get token from storage

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/addcontent/${trimmedStoryId}`,
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
    if(isPublic){
      router.push(`/Public_Story`);
      return;
    }
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

  const handleComplete = async () => {
    let a=confirm("Are you sure you want to mark this story as complete?") ;

    if(!a){
      return;
    }

    let b=confirm("Once marked complete, you will be not again change in the story.") ;
    if(!b){
      return;
    }

    try {
      const token = sessionStorage.getItem('accessToken'); // get token from storage
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/toggle-complete/${trimmedStoryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, //send JWT in header
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        showToast(`Error: ${data.message || 'Failed to toggle complete status'}`);
        return;
      }
      showToast(data.message || 'Story status updated successfully!');
      setTimeout(() => { router.push(`/Home/${username}`); }, 1500);
    } catch (err) {
      console.error("Error toggling complete status:", err);
      toast.error(`Error: ${err.message}`);
    } 
  };

  return (
    <div className="flex flex-col absolute top-0 items-center h-full w-full pb-1 box-border z-500">
      {/* Header */}
      <div className="flex w-full flex-row-reverse mr-15">
      <button onClick={handleExit} className="form-button-exit">
          <span>[ EXIT ]</span>
        </button>
        
        {!isPublic &&( <button onClick={handleComplete} className="form-button-com">
          <span>[ COMPLETE ]</span>
        </button>
        )
   }
   </div>
      {/* Chat Box */}
      <div className="mt-2 w-[95%] flex flex-col flex-grow border-[6px] border-white/70 p-4 overflow-hidden h-[100vh] box-border">
  
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
                  <div className="message user-message relative group mb-2 rounded-2xl">{s.prompt}
                    <button
                      onClick={() => handleCopy(s.prompt)}
                      className="absolute bottom-[-18px] right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy story"
                    >
                      <Copy className="w-4 h-4 text-white/70 hover:text-white" />
                    </button>
                  </div>
                  <div className="message ai-message relative group rounded-2xl mb-2">{s.response}
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
            )
            }

          </div>

          {/* Input */}
         {!isPublic &&( <div className=" flex flex-row w-full text-center border-t-1 border-dashed
           border-t-white/50 pt-2 mt-2" >

            <textarea
              ref={inputRef}
              // enter send the message, shift + enter for new line
              onKeyDown={handleKeyPress}
              placeholder="> Enter your action..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-[91%] max-h-40 p-2 resize-none overflow-y-auto rounded bg-transparent text-green-500 border border-gray-500 focus:outline-none"
              rows={1}
              disabled={loading}
            />

            <button 
              type="submit" 
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              className="form-button"
            >
              <span>{loading ? "[ O ]" : "[ SEND ]"}</span>
            </button>
          </div>)
         }
        </div>
      </div>
    </div>
  );
}