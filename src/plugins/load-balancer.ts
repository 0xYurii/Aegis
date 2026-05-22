import type { Request, Response, NextFunction } from "express";

export const loadBalancer = (targets: string[]) => {
    let counterIndex = 0;
    return async (req: Request, res: Response, next: NextFunction) => {
        res.locals["target"] = targets[counterIndex];
        counterIndex = (counterIndex + 1) % targets.length;
        next();
    };
};
