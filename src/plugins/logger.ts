import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export const loggerPlug = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    const reqId = uuidv4();
    req.headers["X-Request-ID"] = reqId;
    res.on("finish", () => {
        const duration = Date.now() - start;
        const targetUrl = res.locals["targetUrl"] ?? req.originalUrl;
        console.log(
            `[${req.method}] ${targetUrl} → ${res.statusCode} (${duration}ms) [${reqId}]`,
        );
    });

    next();
};
