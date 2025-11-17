"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from URL
  const email = searchParams.get("email");

  // If email missing → redirect back
  useEffect(() => {
    if (!email) {
      showToast("⚠ Invalid session. Please try again.");
      router.push("/Forget_password");
    }
  }, [email]);

  const showToast = (message, duration = 2500) => {
    if (typeof window === "undefined") return;

    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (form.password !== form.confirmPassword) {
      showToast("⚠ Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      showToast("⚠ Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Call reset password API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/auth/forget-password/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            newPassword: form.password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Password has been reset!");
        router.push("/sign-in");
      } else {
        showToast("⚠ " + (data.message || "Failed to reset password"));
      }
    } catch (err) {
      showToast("⚠ " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
      <div className="terminal-border w-full max-w-[700px]">
        <div className="terminal-content p-6 sm:p-10">
          <h2 className="terminal-title text-center">SET NEW PASSWORD</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* NEW PASSWORD */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="password" className="w-full sm:w-1/3">
                NEW PASS :
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
                  disabled={isLoading}
                />
                {(form.password || form.confirmPassword) && (
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

            {/* CONFIRM PASSWORD */}
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="confirmPassword" className="w-full sm:w-1/3">
                CONFIRM :
              </label>
              <div className="w-full sm:flex-1 relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="form-button self-center hover:scale-110 transition-all duration-200 mt-4"
              disabled={isLoading}
            >
              {isLoading ? "SAVING..." : "[ SET PASSWORD ]"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
