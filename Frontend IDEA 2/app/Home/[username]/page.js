"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DeleteStory from "./DeleteStory";
import { ToastContainer,toast } from "react-toastify";
import { useParams } from "next/navigation";
export default function HomePage() {
  const [completedStories, setCompletedStories] = useState([]);
  const [ongoingStories, setOngoingStories] = useState([]);
  const router = useRouter();
  const {username}=useParams()


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


  const cancelDelete = () => setStoryToDelete(null);
 
  const handledelete = (story, type) => {

    let bool=confirm("Are you sure you want to delete this story?");
    if(!bool) return;
     
    try{
      const token=sessionStorage.getItem("accessToken");

      if(!token){
        showToast("User not authenticated");
        router.push('/Sign_in');
        return;
      }

      const res=fetch(`http://localhost:3000/api/v1/story/${story._id}`,{
        method:"DELETE",
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      
      console.log(res);
      if(res.status<200 || res.status>=300){
        showToast("Failed to delete story");
        return;
      }
      showToast("Story deleted successfully");

      // Refresh stories after deletion
      if(type==="completed"){
        setCompletedStories(completedStories.filter(s=>s._id!==story._id));
      }else{
        setOngoingStories(ongoingStories.filter(s=>s._id!==story._id));
      }
    }catch(err){
      console.log(err);
      showToast("Error: ",err.message);
      return;
    }
  }

  
  const StoryCard = ({ story, type }) => (
    <div
      className="terminal-border relative"
      style={{ transition: "all 0.3s ease", paddingRight: "50px" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div className="terminal-content">
        <h3
          style={{ color: "#e5e5e5", fontSize: "1.3rem", marginBottom: "10px" }}
        >
          {story.title}
        </h3>
        <p style={{ color: "#999", fontSize: "1rem", marginBottom: "10px" }}>
          {story.description}
        </p>
        <span
          style={{ color: "#777", fontSize: "0.95rem", fontStyle: "italic" }}
        >
          You play as: <span style={{ color: "#ccc" }}>{story.character}</span>
        </span>

        {/* Buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            className="text-red-500 hover:text-red-600 text-lg transition-all duration-200 hover:scale-125"
            onClick={() => {
              handledelete(story, type);
            }}
          >
            🗑
          </button>
          {type === "ongoing" && (
            <button
              className="text-green-500 hover:text-green-600 text-lg transition-all duration-200 hover:scale-125"
              onClick={() => router.push(`/ChatBox/${username}/${story._id}`)}
            >
              ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );

   useEffect(() => {
     complete();
      ongoing();
    
   },[] )

   const complete=async () =>{
     const token=sessionStorage.getItem("accessToken");

     if(!token){
      showToast("User not authenticated");
      router.push('/Sign_in');
      return;
     }
    try{
       const completedRes = await fetch(
          "http://localhost:3000/api/v1/story/complete",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (completedRes.ok) {
          const completedData = await completedRes.json();
          setCompletedStories(completedData.data || []);
        }
    }catch(err){
      console.log(err);
      showToast("Error fetching Complete stories");
    }
   }

   const ongoing=async () =>{
     const token=sessionStorage.getItem("accessToken");
      if(!token){
      showToast("User not authenticated");
      router.push('/Sign_in');
      return;
     }
    try{
       const ongoingRes = await fetch(
          "http://localhost:3000/api/v1/story/incomplete",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (ongoingRes.ok) {
          const ongoingData = await ongoingRes.json();
          console.log(ongoingData);
          setOngoingStories(ongoingData.data || []);
        }
    }catch(err){
      console.log(err);
      showToast("Error fetching Ongoing stories");
    }
    }

   

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        paddingTop: "120px", // space for navbar
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div className="terminal-border" style={{ maxWidth: "95%" }}>
        <div className="terminal-content">
          <h2 className="terminal-title">USER DASHBOARD</h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Completed Stories */}
            <div className="terminal-border">
              <div className="terminal-content">
                <h3 className="terminal-title" style={{ fontSize: "1.5rem" }}>
                  COMPLETED STORIES
                </h3>
                {completedStories.length === 0 ? (
                  <p>&gt; No completed stories yet.</p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                      marginTop: "15px",
                    }}
                  >
                    {completedStories.map((story) => (
                      <StoryCard
                        key={story._id}
                        story={story}
                        type="completed"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ongoing Stories */}
            <div className="terminal-border">
              <div className="terminal-content">
                <h3 className="terminal-title" style={{ fontSize: "1.5rem" }}>
                  ONGOING STORIES
                </h3>
                {ongoingStories.length === 0 ? (
                  <p>&gt; No ongoing stories yet.</p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "20px",
                      marginTop: "15px",
                    }}
                  >
                    {ongoingStories.map((story) => (
                      <StoryCard key={story._id} story={story} type="ongoing" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
}
