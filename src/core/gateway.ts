import { Router, type Request, type Response } from "express";
import axios from "axios";
import { routes } from "../config/routes.config";
import { loggerPlug } from "../plugins/logger";

const router = Router();

router.all("*", async (req: Request, res: Response) => {
    const matched = routes.find((r) => req.originalUrl.startsWith(r.path));

    if (!matched) return res.status(404).json({ message: "Route not found" });

    const targetUrl = `${process.env.TARGET_URL}${matched.target}`;

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") forwardHeaders[key] = value;
    }
    forwardHeaders["x-user-id"] = String(res.locals["userId"] ?? "anonymous");

    try {
        const targetResponse = await axios({
            method: req.method as any,
            url: targetUrl,
            headers: forwardHeaders,
            data: req.body,
        });

        loggerPlug(req, res, targetUrl, targetResponse.status);
        return res.status(targetResponse.status).send(targetResponse.data);
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;
            loggerPlug(req, res, targetUrl, status);
            return res.status(status).send(error.response?.data);
        }
        loggerPlug(req, res, targetUrl, 500);
        return res.status(500).send("Upstream request failed");
    }
});

export default router;
