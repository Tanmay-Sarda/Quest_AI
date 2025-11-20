"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditProfile({ username }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showPass, setShowPass] = useState(false); // For new password
  const [showOldPass, setShowOldPass] = useState(false); // For old password
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

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();

    if (!apiKey) {
      showToast("Please provide an API key.");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/user/api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          apiKey,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        showToast("❌ Server did not return JSON. Check your backend.");
        return;
      }

      if (!res.ok) {
        showToast(`❌ ${data?.message || "Failed to update API key"}`);
        return;
      }

      showToast("✅ API key updated successfully!");
      setApiKey("");
    } catch (error) {
      console.error("Network error updating API key:", error);
      showToast("❌ Network error. Could not connect to the server.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
  console.log("ERROR")
    if (!newUsername && !newPassword && !newPFile) {
      showToast("Please provide a new username, password, or profile picture to update.");
      return;
    }
     showToast("Profile Updating....")
    const formData = new FormData();
    formData.append("oldPassword", oldPassword);
    if (newUsername) formData.append("newUsername", newUsername);
    if (newPassword) formData.append("newPassword", newPassword);
    if (newPFile) formData.append("profileImage", newPFile); // Append the actual file

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/user/update-profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
          // Do NOT set Content-Type for FormData, browser sets it automatically
        },
        body: formData,
      });

      let data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data?.message || "Failed to update profile"}`);
        return;
      }

      showToast("✅ Profile updated successfully!");
      // persist username and profileImage in localStorage for immediate UI updates
      console.log(data.data.username,data.data.profilePicture)
      localStorage.setItem("username",data.data.username)
      localStorage.setItem("profileImage",data.data.profilePicture);
      router.push(`/Home/${newUsername || username}`); // Redirect to home with updated username
    } catch (error) {
      console.error("Network error updating profile:", error);
      showToast("❌ Network error. Could not connect to the server.");
    }
  };



  return (
    <div className="fixed inset-0 flex justify-center items-center" style={{ backgroundColor: 'var(--overlay-bg)' }}>
      <div className="border-4 rounded-2xl p-10 w-[90%] max-w-md relative shadow-lg animate-fade-in" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}>

        <button
          onClick={() => router.push(`/Home/${username}`)}
          className="absolute top-4 right-5 text-2xl"
          style={{ color: 'var(--danger-color)' }}
        >
          ✖
        </button>

        <h2 className="text-3xl mb-6 font-bold text-center tracking-wide">
          Edit Profile
        </h2>

        {/* Profile picture */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--terminal-bg)' }}>

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
                className="text-xl transition-all duration-300 hover:scale-110 px-3 py-1 form-button transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14] hover:shadow-[0_0_15px_5px_rgba(57,255,20,0.5)]"
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
                  className="px-3 py-1 rounded transition-all duration-300 hover:scale-105 active:scale-95 transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14] hover:shadow-[0_0_15px_5px_rgba(57,255,20,0.5)]"
                  style={{ backgroundColor: 'var(--terminal-bg)', color: 'var(--text-color)' }}
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
            className="p-2 bg-transparent border-b-2 outline-none"
            style={{ borderColor: 'var(--border-color)' }}
          />

          <div className="w-full relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="New Password (optional)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="p-2 bg-transparent border-b-2 w-full outline-none"
              style={{ borderColor: 'var(--border-color)' }}
            />

            {newPassword && (
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showPass ? "HIDE" : "SHOW"}
              </button>
            )}
          </div>

          <button
            type="submit"
            className="mt-6 form-button w-full text-lg tracking-widest transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14] hover:shadow-[0_0_15px_5px_rgba(57,255,20,0.5)]"
          >
            [ SAVE CHANGES ]
          </button>
        </form>

        <form onSubmit={handleApiKeySubmit} className="flex flex-col gap-4 mt-8">
          <h3 className="text-2xl mb-4 font-bold text-center tracking-wide">
            Update API Key
          </h3>
          <div className="w-full relative">
            <input
              type="password"
              placeholder="Your API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="p-2 bg-transparent border-b-2 w-full outline-none"
              style={{ borderColor: 'var(--border-color)' }}
              required
            />
          </div>
          <button
            type="submit"
            className="mt-6 form-button w-full text-lg tracking-widest transform transition-all duration-200 hover:scale-105 hover:text-[#39FF14] hover:shadow-[0_0_15px_5px_rgba(57,255,20,0.5)]"
          >
            [ SAVE API KEY ]
          </button>
        </form>
      </div>
    </div>
  );
}
