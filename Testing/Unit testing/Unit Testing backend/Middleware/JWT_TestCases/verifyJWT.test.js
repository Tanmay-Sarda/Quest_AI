import { verifyJWT } from "../../middleware/auth.middleware.js";
import jwt from "jsonwebtoken";
import { User } from "../../models/User.models.js";

// -----------------------------
// Mock Req/Res/Next
// -----------------------------
const mockRequest = (data = {}) => ({
    cookies: data.cookies ?? {},
    header: jest.fn().mockReturnValue(data.authorization ?? undefined),
    user: null
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// -----------------------------
// Mock External Modules
// -----------------------------
jest.mock("jsonwebtoken");
jest.mock("../../models/User.models.js");

describe("verifyJWT Middleware (FULL MUTATION SAFE)", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ACCESS_TOKEN_SECRET = "testsecret";
    });

    // ------------------------------
    // 1. Missing token (no cookie + no header)
    // ------------------------------
    test("should return 401 when token is missing", async () => {
        const req = mockRequest(); 
        const res = mockResponse();

        await verifyJWT(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json.mock.calls[0][0].message)
            .toBe("Unauthorized access, token is missing");
    });

    // ------------------------------
    // 2. Authorization header empty
    // ------------------------------
    test("should return 401 when Authorization header is empty", async () => {
        const req = mockRequest({ authorization: "Bearer " });
        const res = mockResponse();

        await verifyJWT(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    // ------------------------------
    // 3. Token from cookies
    // ------------------------------
    test("should accept token from cookies", async () => {
        const req = mockRequest({
            cookies: { accessToken: "cookietoken" }
        });
        const res = mockResponse();

        const fakeUser = { _id: "123", name: "John" };

        jwt.verify.mockReturnValue({ _id: "123" });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(fakeUser)
        });

        await verifyJWT(req, res, mockNext);

        expect(req.user).toEqual(fakeUser);
        expect(mockNext).toHaveBeenCalled();
    });

    // ------------------------------
    // 4. Invalid token (jwt.verify throws)
    // ------------------------------
    test("should return 401 for invalid token", async () => {
        const req = mockRequest({
            authorization: "Bearer invalidtoken"
        });
        const res = mockResponse();

        jwt.verify.mockImplementation(() => {
            throw new Error("Invalid");
        });

        await verifyJWT(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json.mock.calls[0][0].message)
            .toBe("Invalid token");
    });

    // ------------------------------
    // 5. decoded = undefined → user null → 404
    // ------------------------------
    test("should return 404 when decoded token has no _id", async () => {
        const req = mockRequest({ authorization: "Bearer valid" });
        const res = mockResponse();

        jwt.verify.mockReturnValue(undefined);

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        await verifyJWT(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json.mock.calls[0][0].message)
            .toBe("User not found");
    });

    // ------------------------------
    // 6. User not found in DB → 404
    // ------------------------------
    test("should return 404 when user not found", async () => {
        const req = mockRequest({ authorization: "Bearer token" });
        const res = mockResponse();

        jwt.verify.mockReturnValue({ _id: "abc" });

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        await verifyJWT(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json.mock.calls[0][0].message)
            .toBe("User not found");
    });

    // ------------------------------
    // 7. Ensure select() uses correct string literal
    // ------------------------------
    test("should call select with '-password -refreshToken'", async () => {
        const req = mockRequest({ authorization: "Bearer valid" });
        const res = mockResponse();

        const fakeUser = { _id: "123" };

        jwt.verify.mockReturnValue({ _id: "123" });

        const selectMock = jest.fn().mockResolvedValue(fakeUser);
        User.findById.mockReturnValue({ select: selectMock });

        await verifyJWT(req, res, mockNext);

        expect(selectMock).toHaveBeenCalledWith("-password -refreshToken");
    });

    // ------------------------------
    // 8. Valid → attach user & next()
    // ------------------------------
    test("should attach user and call next on success", async () => {
        const req = mockRequest({ authorization: "Bearer valid" });
        const res = mockResponse();

        const fakeUser = { _id: "u1", name: "John" };

        jwt.verify.mockReturnValue({ _id: "u1" });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(fakeUser)
        });

        await verifyJWT(req, res, mockNext);

        expect(req.user).toEqual(fakeUser);
        expect(mockNext).toHaveBeenCalled();
    });

});

// --------------
// cookies = undefind
// --------------
test("should ignore cookies safely when cookies is undefined", async () => {
    const req = {
        cookies: undefined,
        header: jest.fn().mockReturnValue("Bearer abc"),
        user: null
    };
    const res = mockResponse();

    jwt.verify.mockReturnValue({ _id: "1" });
    User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: "1" })
    });

    await verifyJWT(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled(); // proves it didn't crash on cookies.accessToken
});

// --------------
// header() returns undefined
// --------------
test("should return 401 when header key is wrong", async () => {
    const req = mockRequest({
        authorization: undefined  // Authorization never returns
    });

    req.header.mockImplementation((key) => undefined); // simulate req.header("") mutant

    const res = mockResponse();

    await verifyJWT(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
});

// --------------
// barier 
// --------------
test("should correctly extract token from Authorization header", async () => {
    const req = mockRequest({
        authorization: "Bearer testtoken"
    });
    const res = mockResponse();

    let capturedToken = null;

    jwt.verify.mockImplementation((token) => {
        capturedToken = token;
        return { _id: "1" };
    });

    User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: "1" })
    });

    await verifyJWT(req, res, mockNext);

    expect(capturedToken).toBe("testtoken"); // kills replace mutants
});
