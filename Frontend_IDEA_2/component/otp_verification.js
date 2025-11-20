"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react"; 
import { useRouter, useSearchParams } from "next/navigation";


export default function OTPPage() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const mode = searchParams.get("mode") || "signup"; // signup or login
  const [pending, setpending] = useState("")
  useEffect(() => {
    setpending( localStorage.getItem("pendingSignup") )
  }, )
  
  const pendingSignup = JSON.parse(
    pending || "{}"
  );  

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

    // SELECT CORRECT VERIFY ENDPOINT 
    let verifyUrl = "";

if (mode === "login") {
  verifyUrl = `${process.env.NEXT_PUBLIC_HOST}/auth/verify-login-otp`;
} 
else if (mode === "reset") {
  verifyUrl = `${process.env.NEXT_PUBLIC_HOST}/auth/forget-password/verify-otp`;
} 
else {
  // default = signup
  verifyUrl = `${process.env.NEXT_PUBLIC_HOST}/auth/verify-signup-otp`;
}
    try {
      const res = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpCode,
          username: mode === "signup" ? pendingSignup.username : undefined,
          password: mode === "signup" ? pendingSignup.password : undefined   
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // changed behavior depending on mode
        if(mode==="reset"){
          showToast(" OTP verified! You can now reset your password.");
          setTimeout(() => router.push(`/Reset_password?email=${encodeURIComponent(email)}`), 1500);
          return;
        }

        if (mode === "signup") {
          localStorage.removeItem("pendingSignup");

          // SIGNUP FLOW → redirect to login
          showToast(" Signup successful! Please log in.");
          setTimeout(() => router.push("/Sign_in"), 1500); 
        } else {
          // LOGIN FLOW → store tokens and redirect to user's Home 
          try {
            localStorage.setItem("accessToken", data.data.user.accessToken);
            localStorage.setItem("username", data.data.user.username);
          } catch (err) {
            console.warn("localStorage unavailable:", err);
          }

          showToast(" Login successful!");
          setTimeout(() => router.push(`/Home/${data.data.user.username}`), 1500);
        }
      } else {
        showToast("⚠ " + (data.message || "OTP verification failed"));
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showToast("⚠ Error: " + (error.message || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
  setLoading(true);

  let resendUrl = "";

  if (mode === "login") {
    resendUrl = `${process.env.NEXT_PUBLIC_HOST}/auth/send-login-otp`;
  } 
  else if (mode === "reset") {
    resendUrl = `${process.env.NEXT_PUBLIC_HOST}/auth/forget-password/send-otp`;
  } 
  else {
    // signup
    resendUrl = `${process.env.NEXT_PUBLIC_HOST}/auth/send-signup-otp`;
  }

  try {
    const res = await fetch(resendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast(" OTP resent to your email");
      setOtp(Array(6).fill("")); 
    } else {
      showToast("⚠ " + (data.message || "Failed to resend OTP"));
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    showToast("⚠ Error: " + (error.message || "Something went wrong"));
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
              color: "var(--text-color)",
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
                    backgroundColor: "var(--terminal-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-color)",
                    borderRadius: "4px",
                    outline: "none",
                    transition: "border-color 0.3s",
                  }}
                  disabled={loading}
                  onFocus={(e) => (e.target.style.borderColor = "var(--button-hover-color)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
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
                  background: "var(--terminal-bg)",
                  border: "1px dashed var(--border-color)",
                  color: "var(--button-hover-color)",
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
