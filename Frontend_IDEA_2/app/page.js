"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

export default function SignUpPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [typedText, setTypedText] = useState("");

  // Typewriter animation removed, static text used instead
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      router.push(`/Home/${localStorage.getItem("username")}`);
      return;
    }

    // ❌ Commented out original typewriter animation
    /*
    const text = "BAEGIN YOUR JOURNEY";
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
    */

    // ✔ Static text
    setTypedText("BEGIN YOUR JOURNEY");
  }, []);

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

  const handleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_HOST}/user/google-login`,
        {
          token: credentialResponse.credential,
        }
      );

      localStorage.setItem("accessToken", res.data.data.user.accessToken);
      localStorage.setItem("username", res.data.data.user.username);
      localStorage.setItem("profileImage",res.data.user.profilePicture)

      showToast("✅ Logged in successfully via Google!");
      router.push(`/Home/${res.data.data.user.username}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      showToast("⚠️ All fields are required!");
      return;
    }

    if (form.password.length < 6) {
      showToast("⚠️ Password must be at least 6 characters long!");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/auth/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if(!res.ok){
        showToast(`⚠️ ${data.message}`);
        return;
      }

      showToast("OTP sent to your email! Redirecting ");
        localStorage.setItem(
          "pendingSignup",
          JSON.stringify({
            username: form.name,
            email: form.email,
            password: form.password,
          })
        );

        // REDIRECT TO OTP PAGE WITH PARAMETERS
        router.push(`/Otp_page?mode=signup&email=${encodeURIComponent(form.email)}`);
        // ------------------------------------------------------------
    } catch (error) {
      showToast("⚠️ Network error. Please try again.");
      console.error(error);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 sm:px-6 md:px-10">
      <div className="terminal-border w-full max-w-[700px]">
        <div className="terminal-content">
          <h2 className="terminal-title text-center text-3xl sm:text-4xl">
            {typedText || "BEGIN YOUR JOURNEY"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            {/* NAME */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="name" className="sm:w-[120px]">
                NAME :
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="email" className="sm:w-[120px]">
                EMAIL :
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="password" className="sm:w-[120px]">
                PASS :
              </label>
              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
                {form.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                )}
              </div>
            </div>

            {/* BUTTON + GOOGLE LOGIN */}
            <div className="flex flex-col items-center gap-4 mt-4">
              <button type="submit" className="form-button hover:scale-105">
                [ SIGNUP ]
              </button>

              <p className="option text-center">Or sign in using</p>

              {/* Centered Google button */}
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleLogin}
                  onError={() => showToast("⚠️ Google Sign-in failed!")}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
