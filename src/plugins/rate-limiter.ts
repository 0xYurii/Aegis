import redis from "../lib/redis";
import type { Request, Response, NextFunction } from "express";
import { RateLimitOptions } from "../types";

export const rateLimiter = (options: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip;
        const key = `ratelimit:${ip}`;

        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, options.window);
        }
        if (current > options.max) {
            return res.status(429).json({
                message: `Too many requests. Max ${options.max} per ${options.window}s`,
            });
        }

        res.setHeader("X-RateLimit-Limit", options.max);
        res.setHeader("X-RateLimit-Remaining", options.max - current);

        next();
    };
};
