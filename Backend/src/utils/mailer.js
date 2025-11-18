import Brevo from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

// ============================
// INIT BREVO CLIENT
// ============================
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

console.log("Brevo Mailer Loaded");

/* ************************
// SEND OTP EMAIL FUNCTION
// ************************/
export async function sendOTPEmail(to, otp) {
  if (!to || !otp) throw new Error("Email and OTP are required");

  const emailData = new Brevo.SendSmtpEmail();

  emailData.sender = {
    name: process.env.BREVO_SENDER_NAME || "My App",
    email: process.env.BREVO_SENDER_EMAIL
  };

  emailData.to = [{ email: to }];
  emailData.subject = process.env.OTP_SUBJECT || "Your verification code";

  emailData.htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4;">
      <h2>Email Verification</h2>
      <p>Your one-time password (OTP) is:</p>

      <h1 style="letter-spacing: 3px; font-size: 32px;">
        ${otp}
      </h1>

      <p>This OTP will expire in ${
        process.env.OTP_TTL_MINUTES || 10
      } minutes.</p>

      <p>If you didn’t request this, please ignore this email.</p>
    </div>
  `;

  try {
    const response = await apiInstance.sendTransacEmail(emailData);
    console.log("OTP email sent via Brevo:", response.messageId || response);
    return response;
  } catch (error) {
    console.error(
      "Failed to send OTP email via Brevo:",
      error.response?.body || error.message
    );
    throw error;
  }
}
