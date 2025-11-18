"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/auth/forget-password/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("✅ OTP sent to your email!");
        router.push(
          `/Otp_page?email=${encodeURIComponent(email)}&mode=reset`
        );
      } else {
        showToast("⚠️ " + (data.message || "Failed to send OTP"));
      }
    } catch (error) {
      showToast("⚠️ " + (error.message || "An unexpected error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
      <div className="terminal-border w-full max-w-[700px]">
        <div className="terminal-content p-6 sm:p-10">
          <h2 className="terminal-title text-center">RESET YOUR PASSWORD</h2>
          <p className="text-center text-gray-300 mb-6">
            Enter your email to receive a One-Time Password (OTP).
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="form-row flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="email" className=" sm:w-1/3">
                EMAIL :
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:flex-1"
                placeholder="Enter your registered email"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="form-button self-center hover:scale-110 transition-all duration-200 mt-4"
              disabled={isLoading}
            >
              {isLoading ? "SENDING..." : "[ SEND OTP ]"}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="text-white hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}