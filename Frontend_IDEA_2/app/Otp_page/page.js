"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OTPPage() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    const first = document.getElementById("otp-0");
    if (first) first.focus();
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

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(text)) {
      setOtp(text.split(""));
    }
  };

  const handleBackspace = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      showToast("⚠ Please enter all 6 digits");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/user/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpCode }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("🎉 OTP verified! Please log in.");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        showToast("⚠ " + (data.message || "OTP verification failed"));
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showToast("⚠ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_HOST}/user/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showToast("📩 OTP resent to your email");
        setOtp(Array(6).fill(""));
      } else {
        showToast("⚠ " + (data.message || "Failed to resend OTP"));
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      showToast("⚠ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        width: "100%",
      }}
    >
      <div className="terminal-border" style={{ maxWidth: "700px" }}>
        <div className="terminal-content">
          <h2 className="terminal-title">VERIFY OTP</h2>

          <p
            style={{
              textAlign: "center",
              marginBottom: "20px",
              color: "#aaa",
              fontSize: "0.9rem",
            }}
          >
            Enter the 6-digit code sent to {email}
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "30px",
              }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleBackspace(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  style={{
                    width: "50px",
                    height: "50px",
                    textAlign: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    backgroundColor: "transparent",
                    border: "1px solid #666",
                    color: "#fff",
                    borderRadius: "4px",
                    outline: "none",
                    transition: "border-color 0.3s",
                  }}
                  disabled={loading}
                  onFocus={(e) => (e.target.style.borderColor = "#0f0")}
                  onBlur={(e) => (e.target.style.borderColor = "#666")}
                />
              ))}
            </div>

            <div className="flex flex-col">
              <button
                type="submit"
                className="form-button"
                disabled={loading}
                style={{
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "0.2s",
                  transform: loading ? "scale(0.95)" : "scale(1)",
                }}
              >
                {loading ? "[ VERIFYING... ⏳ ]" : "[ VERIFY ]"}
              </button>

              <p
                className="option"
                style={{ marginTop: "15px", marginBottom: "10px" }}
              >
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "1px dashed #666",
                  color: "#0f0",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "0.3s",
                }}
              >
                [ RESEND OTP ]
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
