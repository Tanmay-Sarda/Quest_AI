"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function SignInPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // ---- FIX: only check sessionStorage after window exists ----
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        router.push(`/Home/${sessionStorage.getItem("username")}`);
      }
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

  const handleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_HOST}/user/google-login`,
        {
          token: credentialResponse.credential,
        }
      );

      sessionStorage.setItem("accessToken", res.data.data.user.accessToken);
      sessionStorage.setItem("username", res.data.data.user.username);

      showToast("✅ Logged in successfully!");
      router.push(`/Home/${res.data.data.user.username}`);
    } catch (err) {
      console.error(err);
      showToast("⚠️ Google login failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem("accessToken", data.data.user.accessToken);
        sessionStorage.setItem("username", data.data.user.username);

        showToast("✅ Sign in successful!");
        router.push(`/Home/${data.data.user.username}`);
      } else {
        showToast("⚠️ " + (data.message || "Sign in failed"));
      }
    } catch (error) {
      showToast("⚠️ " + error.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
      <div className="terminal-border w-full max-w-[700px]">
        <div className="terminal-content p-6 sm:p-10">
          <h2 className="terminal-title text-center">WELCOME BACK</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* EMAIL */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="email" className=" sm:w-1/3">
                EMAIL :
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full sm:flex-1"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="password" className="w-full sm:w-1/3">
                PASS :
              </label>
              <div className="w-full sm:flex-1 relative">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                )}
              </div>
            </div>

            {/* SIGN IN BUTTON (BIGGER ON HOVER) */}
            <button
              type="submit"
              className="form-button self-center hover:scale-110 transition-all duration-200 mt-4"
            >
              [ SIGNIN ]
            </button>

            <p className="option text-center mt-4">Or sign in using</p>

            {/* GOOGLE LOGIN (NO effect applied) */}
            <div className="flex justify-center mt-2">
              <GoogleLogin
                onSuccess={handleLogin}
                onError={() => showToast("Google Sign-in failed")}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}