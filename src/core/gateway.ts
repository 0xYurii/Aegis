import { Router, type Request, type Response } from "express";
import axios from "axios";
import { routes } from "../config/routes.config";

const router = Router();

router.all("*", async (req: Request, res: Response) => {
    let targetUrl = process.env.TARGET_URL || "http://localhost:3001/";
    let found = false;
    for (const route of routes) {
        if (req.originalUrl.startsWith(route.path))
            targetUrl = targetUrl + req.originalUrl;
        found = true;
    }

    if (!found) return res.status(404).json({ message: "Route not found" });

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") forwardHeaders[key] = value;
    }
    forwardHeaders["x-user-id"] = String(res.locals["userId"] ?? "anonymous");

    try {
        res.locals["targetUrl"] = targetUrl;
        const targetResponse = await axios({
            method: req.method as any,
            url: targetUrl,
            headers: forwardHeaders,
            data: req.body,
        });

        return res.status(targetResponse.status).send(targetResponse.data);
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            return res.status(status).send(error.response?.data);
        }
        return res.status(500).send("Upstream request failed");
    }
});

export default router;
