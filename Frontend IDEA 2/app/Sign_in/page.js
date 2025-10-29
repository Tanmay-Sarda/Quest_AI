"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/api/v1/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token in memory instead of localStorage
        sessionStorage.setItem("accessToken", data.data.user.accessToken);
        showToast("✅ Sign in successful! Redirecting...");
        setTimeout(() => router.push(`/Home/${data.data.user.username}`), 2000);
        setForm({ email: "", password: "" });
      } else {
        showToast("⚠️ " + (data.message || "Sign in failed"));
      }
    } catch (error) {
      console.error("Sign in error:", error);
      showToast("⚠️ Error: " + error.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
          <h2 className="terminal-title">WELCOME BACK</h2>

          <form onSubmit={handleSubmit}>
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

            <button type="submit" className="form-button">[ SIGNIN ]</button>
          </form>
        </div>
      </div>
    </div>
  );
}
