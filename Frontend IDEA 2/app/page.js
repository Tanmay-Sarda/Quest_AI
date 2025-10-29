"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

export default function SignUpPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [typedText, setTypedText] = useState("");

  // Typewriter animation for the heading
  useEffect(() => {
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
      const res = await axios.post("http://localhost:3000/api/v1/user/google-login", {
        token: credentialResponse.credential,
      });
      console.log("User logged in:", res.data);
      sessionStorage.setItem("accessToken", res.data.data.user.accessToken);
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
      const res = await fetch("http://localhost:3000/api/v1/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("✅ Registration successful! Redirecting...");
        setTimeout(() => router.push("/Sign_in"), 2000);
      } else {
        showToast(`⚠️ Error: ${data.message}`);
      }
    } catch (error) {
      showToast("⚠️ Network error. Please try again.");
      console.error(error);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      boxSizing: "border-box",
      width: "100%"
    }}>
      <div className="terminal-border" style={{ maxWidth: "700px" }}>
        <div className="terminal-content">
          <h2 className="terminal-title">{typedText || "BEGIN YOUR JOURNEY"}</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name">NAME :</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="email">EMAIL :</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="password">PASS :</label>
              <div style={{ flexGrow: 1, position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ width: "100%" }}
                />
                {form.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                )}
              </div>
            </div>

            <button type="submit" className="form-button">[ SIGNUP ]</button>
             
             <p className="option">Or sign in using</p>
            <GoogleLogin
              onSuccess={handleLogin}
              onError={() => toast.error("⚠️ Google Sign-in failed!")}
            />
          </form>
        </div>
      </div>


    </div>
  );
}