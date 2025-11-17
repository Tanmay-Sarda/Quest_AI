"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditProfile({ username }) {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const [profileImage, setProfileImage] = useState(null); // Old stored image
  const [newP, setnewP] = useState(null); // Preview (dataURL)
  const [newPFile, setNewPFile] = useState(null); // Actual File object

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = localStorage.getItem("profileImage");
      if (img) setProfileImage(img);
    }
  }, []);

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

    if (!newUsername && !newPassword && !newPFile) {
      alert("Please update username, password, or profile picture.");
      return;
    }

    try {
      const form = new FormData();

      if (newUsername) form.append("newUsername", newUsername);
      if (newPassword) form.append("newPassword", newPassword);

      if (newPFile) {
        form.append("profileImage", newPFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/user/update-profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: form,
      });

      let data = await res.json();

      if (!res.ok) {
        showToast(`❌ ${data?.message || "Update failed"}`);
        return;
      }

      showToast("✅ Profile updated!");

      // Save updated UI data
      localStorage.setItem("username", data.data.username);
      localStorage.setItem("profileImage", data.data.profilePicture);

      router.push(`/Home/${newUsername || username}`);
    } catch (error) {
      showToast(`Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-70 z-[2000]">
      <div className="bg-black border-4 border-white rounded-2xl p-10 w-[90%] max-w-md text-white relative shadow-lg animate-fade-in">

        <button
          onClick={() => router.push(`/Home/${username}`)}
          className="absolute top-4 right-5 text-white text-2xl hover:text-red-400"
        >
          ✖
        </button>

        <h2 className="text-3xl mb-6 font-bold text-center tracking-wide">
          Edit Profile
        </h2>

        {/* Profile picture */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">

            {newP ? (
              <img src={newP} alt="Preview" className="w-full h-full object-cover" />
            ) : profileImage ? (
              <img src={profileImage} alt="Old" className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 700 }}>
                {username.charAt(0).toUpperCase()}
              </span>
            )}

          </div>

          <div className="flex flex-col gap-2">

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setNewPFile(file);

                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result;
                  setnewP(dataUrl);
                  localStorage.setItem("profileImage_temp", dataUrl);
                };
                reader.readAsDataURL(file);

                showToast("📸 New profile picture added (preview)");
              }}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xl transition-all duration-300 hover:text-[#39FF14] hover:scale-110 px-3 py-1"
              >
                Update profile picture
              </button>

              {newP && (
                <button
                  type="button"
                  onClick={() => {
                    setnewP(null);
                    setNewPFile(null);
                    localStorage.removeItem("profileImage_temp");
                    showToast("🗑️ Removed new picture");
                  }}
                  className="px-3 py-1 rounded bg-gray-700 transition-all duration-300 hover:bg-red-600 hover:scale-105 active:scale-95"
                >
                  Remove
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="New Username (optional)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="p-2 bg-transparent border-b-2 border-white focus:border-green-400 outline-none"
          />

          <div className="w-full relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="New Password (optional)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="p-2 bg-transparent border-b-2 w-full border-white focus:border-blue-400 outline-none"
            />

            {newPassword && (
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPass ? "HIDE" : "SHOW"}
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
