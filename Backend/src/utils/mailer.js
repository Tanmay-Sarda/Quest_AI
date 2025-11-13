import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => console.log("✅ Mailer connected to:", process.env.SMTP_HOST))
  .catch((err) => console.error("❌ Mailer connection failed:", err.message));

export async function sendOTPEmail(to, otp) {
  if (!to || !otp) throw new Error("Email and OTP are required");

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: process.env.OTP_SUBJECT || "Your verification code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.4;">
        <h2>Email Verification</h2>
        <p>Your one-time password (OTP) is:</p>
        <h1 style="letter-spacing: 3px;">${otp}</h1>
        <p>This OTP will expire in ${process.env.OTP_TTL_MINUTES || 10} minutes.</p>
        <p>If you didn’t request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err.message);
    throw err;
  }
}
