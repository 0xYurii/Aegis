import type { Request, Response } from "express";

export function loggerPlug(
    req: Request,
    res: Response,
    targetUrl: string,
    status: number,
): any {
    const start = Date.now();
    let duration = 0;
    res.on("finish", () => {
        duration = Date.now() - start;
        console.log(
            `Method: ${req.method}, Path: ${targetUrl}, Status: ${status}, duration: ${duration}`,
        );
    });
}
