"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function EditProfile({ username }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [oldp, setoldp] = useState(false);
  const [newp, setnewp] = useState(false);
  const router = useRouter();

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

    if (!oldPassword) {
      alert("Please confirm your previous password.");
      return;
    }

    if(!newUsername && !newPassword){
      alert("Please provide a new username or password to update.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/user/update-profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`
      },
      body: JSON.stringify({
        oldPassword,
        newUsername,
        newPassword,
      }),
    });

    let data;
    console.log(res)
    try {
      data = await res.json();
    } catch {
      const text = await res.text(); // capture the HTML or error response
      console.error("Non-JSON response:", text);
      showToast("❌ Server did not return JSON. Check your backend.");
      return;
    }

    if (!res.ok) {
      showToast(`❌ ${data?.message || "Failed to update profile"}`);
      return;
    }

    showToast("✅ Profile updated successfully!");
    router.push(`/Home/${newUsername || username}`); // Redirect to home with updated username

  };



  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-[2000]">
      <div className="bg-black border-4 border-white rounded-2xl p-10 w-[90%] max-w-md text-white relative shadow-lg animate-fade-in">
        {/* Close Button */}
        <button
          onClick={() => router.push(`/Home/${username}`)}
          className="absolute top-4 right-5 text-white text-2xl hover:text-red-400"
        >
          ✖
        </button>

        <h2 className="text-3xl mb-6 font-bold text-center tracking-wide">
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="w-full relative">
            <input
              type={oldp ? "text" : "password"}
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="p-2 bg-transparent border-b-2 w-full border-white focus:border-blue-400 outline-none"
              required
            />
            {oldPassword && (
              <button
                type="button"
                onClick={() => setoldp(!oldp)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.9rem",
                  color: "#888",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.color = "#ccc"}
                onMouseOut={(e) => e.target.style.color = "#888"}
              >
                {oldp ? "HIDE" : "SHOW"}
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="New Username (optional)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="p-2 bg-transparent border-b-2 border-white focus:border-green-400 outline-none"
          />

          <div className="w-full relative">
            <input
              type={newp ? "text" : "password"}
              placeholder="New Password (optional)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="p-2 bg-transparent border-b-2 w-full border-white focus:border-blue-400 outline-none"
            />
            {newPassword && (
              <button
                type="button"
                onClick={() => setnewp(!newp)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.9rem",
                  color: "#888",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.3s"
                }}
                onMouseOver={(e) => e.target.style.color = "#ccc"}
                onMouseOut={(e) => e.target.style.color = "#888"}
              >
                {newp ? "HIDE" : "SHOW"}
              </button>
            )}
          </div>

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
