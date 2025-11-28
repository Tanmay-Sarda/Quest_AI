"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const [form, setForm] = useState({
    username: "",
    newPassword: "",
    currentPassword: "",
  });
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.currentPassword) {
      toast.error("⚠️ Current password is required to make any changes.");
      return;
    }

    // Prepare the data to send. Only include fields that are filled.
    const payload = { currentPassword: form.currentPassword };
    if (form.username) {
      payload.username = form.username;
    }
    if (form.newPassword) {
      payload.newPassword = form.newPassword;
    }

    // Don't send a request if nothing is being changed
    if (Object.keys(payload).length === 1) {
      toast.info("Please enter a new username or password to update.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      // This is the backend API endpoint you will need to create
      const res = await fetch(
        "http://localhost:3000/api/v1/user/update-profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Send the user's token
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        console.log(`Profile updated successfully! Status code: ${res.status}`);
        toast.success("✅ Profile updated successfully! Please sign in again.");
        localStorage.removeItem("accessToken"); // Log user out for security
        setTimeout(() => {
          router.push("/Login");
        }, 2500);
      } else {
        toast.error(`⚠️ ${data.message || "Update failed"}`);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("⚠️ An error occurred while updating the profile.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: -10 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur-xl"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center mb-6"
        >
          Update Your Profile
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.input
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            type="text"
            name="username"
            placeholder="New Username (optional)"
            value={form.username}
            onChange={handleChange}
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none transition-all duration-300 hover:bg-white/30"
          />

          <motion.input
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            type="password"
            name="newPassword"
            placeholder="New Password (optional)"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none transition-all duration-300 hover:bg-white/30"
          />

          <motion.input
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            type="password"
            name="currentPassword"
            placeholder="Current Password (required)"
            value={form.currentPassword}
            onChange={handleChange}
            required
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-white placeholder-gray-300 focus:outline-none transition-all duration-300 hover:bg-white/30"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            type="submit"
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-600 transition"
          >
            Save Changes
          </motion.button>
        </form>
      </motion.div>
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
