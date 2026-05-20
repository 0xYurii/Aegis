import type { Request, Response } from "express";

export function loggerPlug(req: Request, res: Response): number {
    return Date.now();
}
