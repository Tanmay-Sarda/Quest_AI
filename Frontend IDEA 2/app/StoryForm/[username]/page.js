"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
export default function StoryForm() {
  const [form, setForm] = useState({
    title: "",
    setting: "",
    character: "",
  });

  const router = useRouter();
  const params = useParams();
  const { username } = params;
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    showToast("Creating your story...", 3000);

    try {
      const payload = {
        title: form.title,
        description: form.setting, // map setting → description
        character: form.character,
      };

      const res = await fetch("http://localhost:3000/api/v1/story/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` // include token in Authorization header
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(`Error: ${errorData.message || 'Failed to create story'}`);
      }

      const data = await res.json();

      const newStoryId = data.data?._id; // because backend sends story in data field


      showToast("✅ Story created successfully!");
      setForm({ title: "", setting: "", character: "" });
      console.log("Navigating to story page with ID:", `/ChatBox/${username}/${newStoryId}`);
      router.push(`/ChatBox/${username}/${newStoryId}`);

    } catch (error) {
      console.error("Error saving story:", error);
      showToast("Error: ", error.message || 'Failed to create story');
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div className="terminal-border" style={{ maxWidth: "700px" }}>
        <div className="terminal-content">
          <h2 className="terminal-title">CREATE YOUR STORY</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="title">TITLE :</label>
              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Provide the title of the story"
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="setting">SETTING :</label>
              <input
                id="setting"
                type="text"
                name="setting"
                value={form.setting}
                onChange={handleChange}
                placeholder="Describe the scenario"
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="character">CHARACTER :</label>
              <input
                id="character"
                type="text"
                name="character"
                value={form.character}
                onChange={handleChange}
                placeholder="Name the character and give its description"
                required
              />
            </div>

            <button type="submit" className="form-button">
              [ BEGIN QUEST ]
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
