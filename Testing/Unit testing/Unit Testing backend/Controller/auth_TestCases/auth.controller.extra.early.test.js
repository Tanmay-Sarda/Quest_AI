/**
 * FULL MUTATION-KILLER TEST SUITE
 * Covers:
 *  - OTP generation arithmetic
 *  - Email normalization
 *  - ExpiresAt boundary (< vs <=)
 *  - ObjectLiteral mutants
 *  - StringLiteral mutants
 *  - BooleanLiteral mutants
 *  - Request-body forwarding
 *  - All branches in verifyOtp & verifyForgotPasswordOTP
 */

jest.mock("../../models/User.models.js", () => ({
  User: { findOne: jest.fn() },
}));

jest.mock("../../models/Otp.model.js", () => ({
  Otp: {
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn()
  }
}));

jest.mock("../../utils/mailer.js", () => ({ sendOTPEmail: jest.fn() }));

jest.mock("../user.controller.js", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

jest.mock("../../validations/auth.validation.js", () => ({
  emailSchema: { safeParse: jest.fn() },
  signupVerifySchema: { safeParse: jest.fn() },
  loginVerifySchema: { safeParse: jest.fn() },
  forgotVerifySchema: { safeParse: jest.fn() },
}));

const AuthController = require("../auth.controller.js").default;
const bcrypt = require("bcrypt");
const { User } = require("../../models/User.models.js");
const { Otp } = require("../../models/Otp.model.js");
const { sendOTPEmail } = require("../../utils/mailer.js");
const {
  emailSchema,
  signupVerifySchema,
  loginVerifySchema,
  forgotVerifySchema,
} = require("../../validations/auth.validation.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

/* ----------------------------------------------------------
   1. generateAndSendOtp() — deterministic OTP + object checks
---------------------------------------------------------- */
describe("generateAndSendOtp()", () => {
  test("creates deterministic OTP, lowercases email, hashes OTP, saves and sends email", async () => {
    const { generateAndSendOtp } = AuthController;

    // Force Math.random to a predictable value
    const realRandom = Math.random;
    Math.random = () => 0.25; // fixed deterministic

    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedXYZ");

    Otp.findOneAndDelete.mockResolvedValue();
    const createMock = jest.fn();
    Otp.create = createMock;

    sendOTPEmail.mockResolvedValue();

    await generateAndSendOtp("TeStEMAIL@GmAiL.cOm");

    // Compute expected OTP
    const expectedOtp = Math.floor(100000 + 0.25 * 900000).toString();
    const expectedEmail = "testemail@gmail.com";

    expect(Otp.findOneAndDelete).toHaveBeenCalledWith({ email: expectedEmail });

    // verify hash
    expect(bcrypt.hash).toHaveBeenCalledWith(expectedOtp, 10);

    // verify create object shape
    const createdArg = createMock.mock.calls[0][0];
    expect(createdArg.email).toBe(expectedEmail);
    expect(createdArg.otpHash).toBe("hashedXYZ");
    expect(createdArg.attempts).toBe(0);

    // expiresAt ~ 10 min
    expect(createdArg.expiresAt).toBeGreaterThan(Date.now());
    expect(createdArg.expiresAt).toBeLessThan(Date.now() + 11 * 60 * 1000);

    // verify email send
    expect(sendOTPEmail).toHaveBeenCalledWith(expectedEmail, expectedOtp);

    Math.random = realRandom;
  });
});

/* ----------------------------------------------------------
   2. sendSignupOTP()
---------------------------------------------------------- */
describe("sendSignupOTP()", () => {
  test("400 on validation fail", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: "Invalid email" }] },
    });

    const res = makeRes();
    await AuthController.sendSignupOTP({ body: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid email" })
    );
  });

  test("409 when user exists", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "y@x.com" },
    });

    User.findOne.mockResolvedValue({ _id: "123" });

    const res = makeRes();
    await AuthController.sendSignupOTP({ body: { email: "y@x.com" } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User already exists with this email" })
    );
  });

  test("success path normalizes email & sends OTP", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "UPPER@CASE.COM" },
    });

    User.findOne.mockResolvedValue(null);
    Otp.findOneAndDelete.mockResolvedValue();
    Otp.create.mockResolvedValue();
    sendOTPEmail.mockResolvedValue();

    const res = makeRes();
    await AuthController.sendSignupOTP({ body: { email: "UPPER@CASE.COM" } }, res);

    expect(sendOTPEmail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Signup OTP sent successfully" })
    );
  });
});

/* ----------------------------------------------------------
   3. verifySignupOTP()
---------------------------------------------------------- */
describe("verifySignupOTP()", () => {
  test("400 on validation fail", async () => {
    signupVerifySchema.safeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: "bad" }] },
    });

    const res = makeRes();
    await AuthController.verifySignupOTP({ body: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "bad" }));
  });

  test("calls next() on DB error", async () => {
    signupVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { username: "u", email: "a@b.com", password: "p", profilePicture: "", otp: "111111" },
    });

    Otp.findOne.mockRejectedValue(new Error("DB error"));
    const next = jest.fn();

    await AuthController.verifySignupOTP({ body: {} }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test("valid OTP forwards correct req.body to registerUser", async () => {
    signupVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { username: "u", email: "A@B.COM", password: "p", profilePicture: "", otp: "999999" },
    });

    Otp.findOne.mockResolvedValue({
      otpHash: "h",
      attempts: 0,
      expiresAt: Date.now() + 10000,
      save: jest.fn(),
    });

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    const { registerUser } = require("../user.controller.js");
    registerUser.mockClear();

    const req = { body: {} };
    await AuthController.verifySignupOTP(req, makeRes(), jest.fn());

    expect(registerUser).toHaveBeenCalled();
    expect(req.body).toEqual({
      username: "u",
      email: "a@b.com",
      password: "p",
      profilePicture: "",
    });
  });
});

/* ----------------------------------------------------------
   4. sendLoginOTP()
---------------------------------------------------------- */
describe("sendLoginOTP()", () => {
  test("400 on validation fail", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: "invalid" }] },
    });

    const res = makeRes();
    await AuthController.sendLoginOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("success sends OTP & lowercases email", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "CASE@UP.COM" },
    });

    Otp.findOneAndDelete.mockResolvedValue();
    Otp.create.mockResolvedValue();
    sendOTPEmail.mockResolvedValue();

    const res = makeRes();
    await AuthController.sendLoginOTP({ body: { email: "CASE@UP.COM" } }, res);

    expect(sendOTPEmail.mock.calls[0][0]).toBe("case@up.com");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Login OTP sent successfully"
      })
    );
  });
});

/* ----------------------------------------------------------
   5. verifyLoginOTP()
---------------------------------------------------------- */
describe("verifyLoginOTP()", () => {
  test("400 on validation fail", async () => {
    loginVerifySchema.safeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: "bad" }] },
    });

    const res = makeRes();
    await AuthController.verifyLoginOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("calls next() on DB error", async () => {
    loginVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "a@b.com", password: "pw", otp: "123" },
    });

    Otp.findOne.mockRejectedValue(new Error("Fail"));
    const next = jest.fn();

    await AuthController.verifyLoginOTP({ body: {} }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test("valid login OTP forwards correct req.body", async () => {
    loginVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "TeSt@EMAIL.COM", password: "pw", otp: "777777" },
    });

    Otp.findOne.mockResolvedValue({
      otpHash: "h",
      attempts: 0,
      expiresAt: Date.now() + 5000,
      save: jest.fn(),
    });

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const { loginUser } = require("../user.controller.js");

    const req = { body: {} };
    await AuthController.verifyLoginOTP(req, makeRes(), jest.fn());

    expect(loginUser).toHaveBeenCalled();
    expect(req.body).toEqual({
      email: "test@email.com",
      password: "pw",
    });
  });
});

/* ----------------------------------------------------------
   6. sendForgotPasswordOTP()
---------------------------------------------------------- */
describe("sendForgotPasswordOTP()", () => {
  test("200 even if user does not exist", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "test@x.com" },
    });

    User.findOne.mockResolvedValue(null);

    const res = makeRes();
    await AuthController.sendForgotPasswordOTP({ body: { email: "test@x.com" } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("user exists → OTP sent", async () => {
    emailSchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "t@x.com" },
    });

    User.findOne.mockResolvedValue({ _id: "u1" });
    Otp.findOneAndDelete.mockResolvedValue();
    Otp.create.mockResolvedValue();
    sendOTPEmail.mockResolvedValue();

    const res = makeRes();
    await AuthController.sendForgotPasswordOTP({ body: { email: "t@x.com" } }, res);

    expect(sendOTPEmail).toHaveBeenCalled();
  });
});

/* ----------------------------------------------------------
   7. verifyForgotPasswordOTP()
---------------------------------------------------------- */
describe("verifyForgotPasswordOTP()", () => {
  test("400 on validation fail", async () => {
    forgotVerifySchema.safeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: "bad" }] },
    });

    const res = makeRes();
    await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("no otpEntry → 400", async () => {
    forgotVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "x@y.com", otp: "111111" },
    });

    Otp.findOne.mockResolvedValue(null);

    const res = makeRes();
    await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "OTP not found or expired"
    }));
  });

  test("attempts >=5 → 400", async () => {
    forgotVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "x@y.com", otp: "111111" },
    });

    Otp.findOne.mockResolvedValue({ attempts: 5 });
    Otp.deleteOne.mockResolvedValue();

    const res = makeRes();
    await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Otp.deleteOne).toHaveBeenCalledWith({ email: "x@y.com" });
  });

  test("expired → 400", async () => {
    forgotVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "x@y.com", otp: "111111" },
    });

    Otp.findOne.mockResolvedValue({
      attempts: 0,
      expiresAt: Date.now() - 1000,
    });

    Otp.deleteOne.mockResolvedValue();

    const res = makeRes();
    await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Otp.deleteOne).toHaveBeenCalledWith({ email: "x@y.com" });
  });

  test("invalid OTP increments attempts", async () => {
    const saveMock = jest.fn();
    const entry = {
      attempts: 0,
      expiresAt: Date.now() + 5000,
      otpHash: "hash",
      save: saveMock,
    };

    forgotVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "x@y.com", otp: "111111" },
    });

    Otp.findOne.mockResolvedValue(entry);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const res = makeRes();
    await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(entry.attempts).toBe(1);
    expect(saveMock).toHaveBeenCalled();
  });

  test("valid OTP marks entry verified", async () => {
    const saveMock = jest.fn();
    const entry = {
      attempts: 0,
      expiresAt: Date.now() + 5000,
      otpHash: "h",
      save: saveMock,
    };

    forgotVerifySchema.safeParse.mockReturnValue({
      success: true,
      data: { email: "z@y.com", otp: "222222" },
    });
    Otp.findOne.mockResolvedValue(entry);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const res = makeRes();
    await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(entry.isVerified).toBe(true);
    expect(typeof entry.verifiedAt).toBe("number");
  });

  test("expiresAt === Date.now() boundary (not expired)", async () => {
  jest.useFakeTimers("modern");

  const now = Date.now();
  jest.setSystemTime(now); // freeze time

  const saveMock = jest.fn();

  const entry = {
    attempts: 0,
    expiresAt: now, // boundary
    otpHash: "h",
    save: saveMock,
  };

  forgotVerifySchema.safeParse.mockReturnValue({
    success: true,
    data: { email: "z@y.com", otp: "333333" },
  });

  Otp.findOne.mockResolvedValue(entry);
  jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
  Otp.deleteOne.mockResolvedValue();

  const res = makeRes();
  await AuthController.verifyForgotPasswordOTP({ body: {} }, res);

  expect(res.status).toHaveBeenCalledWith(200);

  jest.useRealTimers(); // restore normal timers
});

});

/* ----------------------------------------------------------
   8. verifyOtp() (helper) — full branch coverage
---------------------------------------------------------- */
describe("verifyOtp()", () => {
  const { verifyOtp } = AuthController;

  test("not found", async () => {
    Otp.findOne.mockResolvedValue(null);
    const result = await verifyOtp("a@b.com", "111");
    expect(result.ok).toBe(false);
  });

  test("too many attempts", async () => {
    Otp.findOne.mockResolvedValue({ attempts: 5 });
    Otp.deleteOne.mockResolvedValue();

    const result = await verifyOtp("a@b.com", "111");
    expect(result.ok).toBe(false);
    expect(Otp.deleteOne).toHaveBeenCalledWith({ email: "a@b.com" });
  });

  test("expired (<)", async () => {
    Otp.findOne.mockResolvedValue({
      attempts: 0,
      expiresAt: Date.now() - 10,
    });
    Otp.deleteOne.mockResolvedValue();

    const result = await verifyOtp("x@y.com", "111111");
    expect(result.ok).toBe(false);
  });

  test("invalid OTP increments attempts", async () => {
    const saveMock = jest.fn();

    const entry = {
      attempts: 0,
      expiresAt: Date.now() + 10000,
      otpHash: "hhh",
      save: saveMock,
    };

    Otp.findOne.mockResolvedValue(entry);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const result = await verifyOtp("a@b.com", "111111");

    expect(result.ok).toBe(false);
    expect(entry.attempts).toBe(1);
    expect(saveMock).toHaveBeenCalled();
  });

  test("valid OTP", async () => {
    const saveMock = jest.fn();

    const entry = {
      attempts: 0,
      expiresAt: Date.now() + 10000,
      otpHash: "h",
      save: saveMock,
    };

    Otp.findOne.mockResolvedValue(entry);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    Otp.deleteOne.mockResolvedValue();

    const result = await verifyOtp("a@b.com", "111111");

    expect(result.ok).toBe(true);
    expect(Otp.deleteOne).toHaveBeenCalledWith({ email: "a@b.com" });
  });
});
