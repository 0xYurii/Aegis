import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

type AuthJwtPayload = JwtPayload & { userId: string };

function hasUserId(payload: string | JwtPayload): payload is AuthJwtPayload {
    return (
        typeof payload === "object" && payload !== null && "userId" in payload
    );
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res
            .status(401)
            .json({ message: "Access Denied: No Token Provided!" });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        return res
            .status(500)
            .json({ message: "Server misconfigured: JWT_SECRET missing" });
    }

    try {
        const verified = jwt.verify(token, secretKey);
        if (!hasUserId(verified)) {
            return res.status(401).json({ message: "Invalid Token payload" });
        }

        res.locals["userId"] = verified.userId;
        return next();
    } catch {
        return res.status(401).json({ message: "Invalid Token" });
    }
};
