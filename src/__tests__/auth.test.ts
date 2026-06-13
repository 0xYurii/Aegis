import { auth } from "../plugins/auth";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

const mockReqRes = (authHeader?: string) => {
    const req: any = { headers: { authorization: authHeader } };
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        locals: {},
    };
    const next = jest.fn();
    return { req, res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret";
});

describe("Auth Middleware", () => {
    it("rejects when no Authorization header", () => {
        const { req, res, next } = mockReqRes(undefined);

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Access Denied: No Token Provided!",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects when JWT_SECRET is missing", () => {
        delete process.env.JWT_SECRET;
        const { req, res, next } = mockReqRes("Bearer sometoken");

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Server misconfigured: JWT_SECRET missing",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects invalid token (jwt.verify throws)", () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error("invalid signature");
        });

        const { req, res, next } = mockReqRes("Bearer badtoken");

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid Token" });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects token with no userId in payload", () => {
        (jwt.verify as jest.Mock).mockReturnValue({ foo: "bar" });

        const { req, res, next } = mockReqRes("Bearer validtoken");

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid Token payload",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("allows valid token and sets res.locals.userId", () => {
        (jwt.verify as jest.Mock).mockReturnValue({ userId: "user-123" });

        const { req, res, next } = mockReqRes("Bearer goodtoken");

        auth(req, res, next);

        expect(res.locals["userId"]).toBe("user-123");
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
