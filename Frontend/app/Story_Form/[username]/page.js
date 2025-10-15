"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function StoryForm() {
  const [form, setForm] = useState({
    title: "",
    setting: "",
    character: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Story submitted!");

    setForm({ title: "", setting: "", character: "" });
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
                placeholder={`Enter ${field === "character" ? "main character" : `story ${field}`}`}
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
    </div>
  );
}
