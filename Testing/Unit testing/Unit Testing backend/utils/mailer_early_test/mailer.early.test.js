// mailer.early.test.js
// ---------------------------
// Full coverage tests for sendOTPEmail
// ---------------------------

import { sendOTPEmail } from "../mailer.js"; // adjust path

// Manual mock for Brevo
jest.mock("@getbrevo/brevo", () => {
  const mockSendTransacEmail = jest.fn();

  return {
    TransactionalEmailsApi: jest.fn().mockImplementation(() => ({
      sendTransacEmail: mockSendTransacEmail,
      setApiKey: jest.fn()
    })),
    SendSmtpEmail: jest.fn(),
    TransactionalEmailsApiApiKeys: {
      apiKey: "FAKE_API_KEY"
    },
    __mockSendTransacEmail: mockSendTransacEmail // expose for test access
  };
});

import Brevo from "@getbrevo/brevo";

describe("sendOTPEmail - full coverage", () => {
  let mockSendTransacEmail;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendTransacEmail = Brevo.__mockSendTransacEmail;
  });

  // ---------------------------
  // Branch: missing email or OTP
  // ---------------------------
  test("throws error if email is missing", async () => {
    await expect(sendOTPEmail("", "1234")).rejects.toThrow("Email and OTP are required");
  });

  test("throws error if OTP is missing", async () => {
    await expect(sendOTPEmail("user@test.com", "")).rejects.toThrow("Email and OTP are required");
  });

  // ---------------------------
  // Branch: successful send
  // ---------------------------
  test("sends email with correct data", async () => {
    mockSendTransacEmail.mockResolvedValue({ message: "Email sent" });

    const to = "user@test.com";
    const otp = "567890";

    const response = await sendOTPEmail(to, otp);

    // Check that API was called
    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);

    const emailDataArg = mockSendTransacEmail.mock.calls[0][0];

    // Check recipient
    expect(emailDataArg.to[0].email).toBe(to);

    // Check OTP in html content
    expect(emailDataArg.htmlContent).toContain(otp);

    // Check sender and subject
    expect(emailDataArg.sender.name).toBe(process.env.BREVO_SENDER_NAME || "My App");
    expect(emailDataArg.subject).toBe(process.env.OTP_SUBJECT || "Your verification code");

    // Response check
    expect(response).toEqual({ message: "Email sent" });
  });

  // ---------------------------
  // Branch: API throws error
  // ---------------------------
  test("propagates API errors", async () => {
    const apiError = new Error("API failed");
    mockSendTransacEmail.mockRejectedValue(apiError);

    await expect(sendOTPEmail("user@test.com", "123456")).rejects.toThrow("API failed");
  });

  // ---------------------------
  // Branch: default sender, subject, TTL
  // ---------------------------
  test("uses default sender and subject if env missing", async () => {
    delete process.env.BREVO_SENDER_NAME;
    delete process.env.BREVO_SENDER_EMAIL;
    delete process.env.OTP_SUBJECT;
    delete process.env.OTP_TTL_MINUTES;

    mockSendTransacEmail.mockResolvedValue({ message: "Email sent" });

    const to = "user@test.com";
    const otp = "987654";

    await sendOTPEmail(to, otp);

    const emailDataArg = mockSendTransacEmail.mock.calls[0][0];
    expect(emailDataArg.sender.name).toBe("My App");
    expect(emailDataArg.sender.email).toBeUndefined();
    expect(emailDataArg.subject).toBe("Your verification code");
    expect(emailDataArg.htmlContent).toContain("10 minutes"); // default TTL
  });
});
