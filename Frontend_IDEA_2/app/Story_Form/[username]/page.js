"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function StoryForm() {
  const [form, setForm] = useState({
    title: "",
    setting: "",
    character: "",
    genre: "",
  });
  const router = useRouter();
  const { username } = useParams();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.info("Story is being created...");

    try {
      const token = sessionStorage.getItem("accessToken"); // get token from storage

      const payload = {
        title: form.title,
        description: form.setting, // map setting → description
        character: form.character,
        genre: form.genre, // include genre
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/story/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // send JWT in header
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();

      }

      const data = await res.json();

      const newStoryId = data.data?._id; // because backend sends story in data field

      toast.success("Story created successfully!");
      setForm({ title: "", setting: "", character: "", genre: "" });
      console.log("Navigating to story page with ID:", `/ChatBox/${username}/${newStoryId}`);
      router.push(`/ChatBox/${username}/${newStoryId}`);
    } catch (error) {
      console.error("Error saving story:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-start justify-center text-white overflow-hidden"
      style={{
        backgroundColor: "#060606",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), repeating-linear-gradient(transparent, transparent 2px, rgba(255,255,255,0.01) 3px)",
        backgroundSize: "100% 3px, 100% 6px",
        paddingTop: 100,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: -10 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl bg-transparent p-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-center mb-6 tracking-wide uppercase"
          style={{ color: "#e6e6e6" }}
        >
          User Dashboard
        </motion.h2>

        <div className="space-y-6">
          <div className="border border-dashed border-white/10 rounded-lg p-6">
            <h3 className="text-center uppercase tracking-widest text-2xl mb-4 text-white/80 font-bold">Create Your Story</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "title", placeholder: "Enter story title" },
            { name: "setting", placeholder: "Enter story setting" },
            { name: "character", placeholder: "Enter main character" },
            { name: "genre", placeholder: "Enter story genre (e.g., Fantasy, Sci-Fi, Mystery)" },
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
                className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
              />
            </motion.div>
          ))}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="mt-6 form-button w-full text-lg tracking-widest"
              >
                [ SAVE CHANGES ]
              </motion.button>
        </form>
          </div>
        </div>
      </motion.div>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
    </div>
  );
}
