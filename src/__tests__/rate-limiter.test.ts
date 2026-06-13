const mockIncr = jest.fn();
const mockExpire = jest.fn();

jest.mock("../lib/redis", () => ({
    __esModule: true,
    default: {
        incr: mockIncr,
        expire: mockExpire,
    },
}));

import { rateLimiter } from "../plugins/rate-limiter";

const mockReqRes = () => {
    const req: any = { ip: "127.0.0.1" };
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Rate Limiter", () => {
    it("allows request when under the limit", async () => {
        mockIncr.mockResolvedValue(1);

        const middleware = rateLimiter({ max: 10, window: 60 });
        const { req, res, next } = mockReqRes();
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("blocks with 429 when over the limit", async () => {
        mockIncr.mockResolvedValue(11);

        const middleware = rateLimiter({ max: 10, window: 60 });
        const { req, res, next } = mockReqRes();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(next).not.toHaveBeenCalled();
    });

    it("sets rate limit headers correctly", async () => {
        mockIncr.mockResolvedValue(5);

        const middleware = rateLimiter({ max: 10, window: 60 });
        const { req, res, next } = mockReqRes();
        await middleware(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
        expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 5);
    });

    it("calls expire only on first request", async () => {
        mockIncr.mockResolvedValue(1);

        const middleware = rateLimiter({ max: 10, window: 60 });
        const { req, res, next } = mockReqRes();
        await middleware(req, res, next);

        expect(mockExpire).toHaveBeenCalledWith("ratelimit:127.0.0.1", 60);
    });
});
