"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faTrash,
  faPlay,
  faLockOpen,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

export default function HomePage() {
  const [completedStories, setCompletedStories] = useState([]);
  const [ongoingStories, setOngoingStories] = useState([]);
  const router = useRouter();
  const { username } = useParams();
  const [email, setemail] = useState("");
  const [display, setdisplay] = useState(false);
  const [story_id, setstory_id] = useState(null);

  // Toast
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

  const addEmail = (id) => {
    setstory_id(id);
    setdisplay(true);
  };

  const addUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/Sign_in");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/notification/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, story_id }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        showToast(data.message);
        return;
      }

      showToast("Notification sent!");
      setemail("");
      setdisplay(false);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handledelete = async (story, type) => {
    if (!confirm("Delete story?")) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/Sign_in");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/${story._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
     
      let data=await res.json();
      if (!res.ok) {
        showToast(`Error: ${data.message}`);
        return;
      }

      showToast("Deleted!");
      if (type === "completed")
        setCompletedStories((prev) => prev.filter((s) => s._id !== story._id));
      else setOngoingStories((prev) => prev.filter((s) => s._id !== story._id));
    } catch (err) {
      showToast(err.message);
    }
  };

  const changeAccess = async (story_id) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/Sign_in");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/changeaccess/${story_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );


        let data=await res.json()
        console.log(data)
      if (!res.ok) {
        showToast(`Error: ${data.message}`);
        return;
      }

      showToast("Access changed!");
      complete();
    } catch (err) {
      showToast(err.message);
    }
  };

  // ⭐ Story Card (responsive)
  const StoryCard = ({ story, type }) => (
    <div className="terminal-border relative rounded-xl bg-[var(--terminal-bg)] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_#ffffff30]">
      <div className="terminal-content bg-[var(--notification-panel-bg)] p-4 flex flex-col gap-2">
        <div className=" flex gap-2 icon  justify-center ">
          <p className="text-2xl font-mediium text-[var(--text-color)]">{story.title}</p>
        </div>
       
       <div className="flex flex-col sm:flex-row gap-2">
          <h2 className="text-[var(--ai-color)]">Description: </h2>
          <p className='max-h-[100px] overflow-auto'>{story.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <h2 className="text-gray-500">Character: </h2>
          <p> {story.character} </p>
        </div>

        {/* Buttons */}
        <div className="absolute top-3 right-3 flex gap-3">
          <button
            onClick={() => addEmail(story._id)}
            className="hover:scale-125 text-white"
          >
            <FontAwesomeIcon icon={faUserPlus} />
          </button>

          <button
            onClick={() => handledelete(story, type)}
            className="hover:scale-125 text-red-500"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>


          <button
            onClick={() => {
              if (type == "ongoing") router.push(`/ChatBox/${username}/${story._id} ${story.public} ${story.complete}`)
              else router.push(`/ChatBox/${username}/${story._id} ${story.public} ${story.complete}`)
            }
            }
            className="hover:scale-125 text-green-400"
          >
            <FontAwesomeIcon icon={faPlay} />
          </button>


          {type === "completed" &&
            (story.public ? (
              <button
                onClick={() => changeAccess(story._id)}
                className="hover:scale-125 text-blue-400"
              >
                <FontAwesomeIcon icon={faLockOpen} />
              </button>
            ) : (
              <button
                onClick={() => changeAccess(story._id)}
                className="hover:scale-125 text-blue-400"
              >
                <FontAwesomeIcon icon={faLock} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  // Fetch stories
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      return router.push("/Sign_in");
    }
    complete();
    ongoing();
  }, []);

  const complete = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/complete`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCompletedStories(data.data || []);
      }
    } catch (err) {
      showToast("Failed to load completed");
    }
  };

  const ongoing = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/story/incomplete`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setOngoingStories(data.data || []);
      }
    } catch (err) {
      showToast("Failed to load ongoing");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full px-3 sm:px-6 py-10 bg-[var(--bg-color)]">
      {/* EMAIL MODAL (responsive) */}
      {display && (
        <div className="fixed bottom-10 max-sm:bottom-4 left-1/2 -translate-x-1/2 terminal-border bg-[var(--bg-color)] z-50 w-[90%] max-w-md p-4">
          <div className="terminal-content relative">
            <h2 className="terminal-title text-center">Enter User Email</h2>

            <button
              onClick={() => setdisplay(false)}
              className="absolute top-3 right-4 text-3xl text-gray-400 hover:text-white"
            >
              ×
            </button>

            <form onSubmit={addUser} className="mt-4 flex flex-col gap-3">
              <div className="form-row flex flex-col">
                <label>Email :</label>
                <input
                  type="email"
                  value={email}
                  placeholder="Enter email"
                  onChange={(e) => setemail(e.target.value)}
                  required
                />
              </div>

              <button className="form-button">[ ADD USER ]</button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      <div className="terminal-border w-full max-w-[1100px]">
        <div className="terminal-content">
          <h2 className="terminal-title text-center">USER DASHBOARD</h2>

          <div className="flex flex-col gap-10 w-full">
            {/* COMPLETED */}
            <div className="terminal-border w-full">
              <div className="terminal-content">
                <h3 className="terminal-title text-xl">COMPLETED STORIES</h3>

                {completedStories.length === 0 ? (
                  <p className="mt-2">&gt; No completed stories.</p>
                ) : (
                  <div className="grid grid-cols-1  gap-4 mt-4">
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

            {/* ONGOING */}
            <div className="terminal-border w-full">
              <div className="terminal-content">
                <h3 className="terminal-title text-xl">ONGOING STORIES</h3>

                {ongoingStories.length === 0 ? (
                  <p className="mt-2">&gt; No ongoing stories.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 mt-4">
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
