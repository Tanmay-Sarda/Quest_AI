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
    const token = localStorage.getItem("accessToken"); // get token from storage

    const payload = {
      title: form.title,
      description: form.setting, // map setting → description
      character: form.character,
    };

    const res = await fetch("http://localhost:3000/api/v1/story/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, //send JWT in header
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to save story");
    }

    const data = await res.json();

    const newStoryId = data.data?._id; // because backend sends story in data field


    toast.success("Story created successfully!");
    setForm({ title: "", setting: "", character: "" });
     console .log("Navigating to story page with ID:",`/ChatBox/${username}/${newStoryId}` );
     router.push(`/ChatBox/${username}/${newStoryId}`);

  } catch (error) {
    console.error("Error saving story:", error);
    toast.error(`Error: ${error.message}`);
  }
};

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: -10 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg p-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center mb-6"
        >
          Create Your Story
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {["title", "setting", "character"].map((field, index) => (
            <motion.div
              key={field}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <input
                type="text"
                name={field}
                value={form[field]}
                onChange={handleChange}
                placeholder={`Enter ${
                  field === "character" ? "main character" : `story ${field}`
                }`}
                className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:shadow-indigo-500/30"
              />
            </motion.div>
          ))}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-700 transition"
          >
            Save Story
          </motion.button>
        </form>
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
