import type { Request, Response, NextFunction } from "express";

export const loggerPlug = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const targetUrl = res.locals["targetUrl"] ?? req.originalUrl;
        console.log(
            `[${req.method}] ${targetUrl} → ${res.statusCode} (${duration}ms)`,
        );
    });

    next();
};
