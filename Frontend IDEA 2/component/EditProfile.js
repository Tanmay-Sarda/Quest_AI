"use client";
import { useState } from "react";

export default function EditProfile({ closeModal }) {
  const [oldUsername, setOldUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!oldUsername || !oldPassword) {
      alert("Please confirm your previous username and password.");
      return;
    }

    // Retrieve users list from localStorage
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // Find the matching user
    const userIndex = users.findIndex(
      (u) => u.username === oldUsername && u.password === oldPassword
    );

    if (userIndex === -1) {
      alert("❌ Incorrect old username or password.");
      return;
    }

    // Update user details
    const updatedUser = {
      ...users[userIndex],
      username: newUsername || users[userIndex].username,
      password: newPassword || users[userIndex].password,
    };

    users[userIndex] = updatedUser;

    // Save updated users list back to localStorage
    localStorage.setItem("users", JSON.stringify(users));

    // Optional: update sessionStorage if the logged-in user changed
    sessionStorage.setItem("activeUser", JSON.stringify(updatedUser));

    alert("✅ Profile updated successfully!");
    closeModal();
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-[2000]">
      <div className="bg-black border-4 border-white rounded-2xl p-10 w-[90%] max-w-md text-white relative shadow-lg animate-fade-in">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-5 text-white text-2xl hover:text-red-400"
        >
          ✖
        </button>

        <h2 className="text-3xl mb-6 font-bold text-center tracking-wide">
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Old Username"
            value={oldUsername}
            onChange={(e) => setOldUsername(e.target.value)}
            className="p-2 bg-transparent border-b-2 border-white focus:border-blue-400 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="p-2 bg-transparent border-b-2 border-white focus:border-blue-400 outline-none"
            required
          />

          <input
            type="text"
            placeholder="New Username (optional)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="p-2 bg-transparent border-b-2 border-white focus:border-green-400 outline-none"
          />

          <input
            type="password"
            placeholder="New Password (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-2 bg-transparent border-b-2 border-white focus:border-green-400 outline-none"
          />

          <button
            type="submit"
            className="mt-6 form-button w-full text-lg tracking-widest"
          >
            [ SAVE CHANGES ]
          </button>
        </form>
      </div>
    </div>
  );
}
