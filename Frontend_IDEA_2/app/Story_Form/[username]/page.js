"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../../context/ThemeContext";

export default function StoryForm() {
  const [form, setForm] = useState({
    title: "",
    setting: "",
    character: "",
    genre: "",
  });

  const router = useRouter();
  const { username } = useParams();

  const { theme } = useTheme();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.info("Story is being created...");

    try {
      const token = localStorage.getItem("accessToken");

      const payload = {
        title: form.title,
        description: form.setting,
        character: form.character,
        genre: form.genre,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/story/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if(!res.ok){
        showToast(`Error: ${data.message}`);
        return 
      }
      const newStoryId = data.data?._id;

      toast.success("Story created successfully!");
      setForm({ title: "", setting: "", character: "", genre: "" });
      router.push(`/ChatBox/${username}/${newStoryId}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-start justify-center overflow-hidden
      max-sm:px-4 max-sm:pt-28 text-[var(--text-color)] bg-scanline-pattern"
      style={{
        paddingTop: 100,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: -10 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl bg-transparent p-8 
        max-sm:p-4"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-center mb-6 tracking-wide uppercase
          max-sm:text-2xl"
        >
          User Dashboard
        </motion.h2>

        <div className="space-y-6">
          <div className="border border-dashed border-[var(--border-color)] rounded-lg p-6 max-sm:p-4">
            <h3 className="text-center uppercase tracking-widest text-2xl mb-4 text-[var(--text-color)] font-bold max-sm:text-xl">
              Create Your Story
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: "title", placeholder: "Enter story title" },
                { name: "setting", placeholder: "Enter story setting" },
                { name: "character", placeholder: "Enter main character" },
                {
                  name: "genre",
                  placeholder:
                    "Enter story genre (e.g., Fantasy, Sci-Fi, Mystery)",
                },
              ].map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <input
                    type="text"
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl bg-[var(--notification-panel-bg)] px-4 py-3 text-[var(--text-color)] placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 
                    transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30
                    max-sm:px-3 max-sm:py-2 max-sm:text-sm"
                  />
                </motion.div>
              ))}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="mt-6 form-button w-full text-lg tracking-widest max-sm:text-base"
              >
                [ SAVE CHANGES ]
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>

      <ToastContainer position="top-right" autoClose={1500} theme={theme} />
    </div>
  );
}
