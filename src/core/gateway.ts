import { Router, type Request, type Response } from "express";
import axios from "axios";
import { recordFailure, recordSuccess } from "../plugins/circuit-breaker";

const router = Router();

router.all(/.*/, async (req: Request, res: Response) => {
    const target = res.locals["target"];

    if (!target) return res.status(404).json({ message: "Route not found" });

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") forwardHeaders[key] = value;
    }
    forwardHeaders["x-user-id"] = String(res.locals["userId"] ?? "anonymous");

    const targetUrl = target + req.originalUrl;

    try {
        res.locals["targetUrl"] = targetUrl;
        const targetResponse = await axios({
            method: req.method as any,
            url: targetUrl,
            headers: forwardHeaders,
            data: req.body,
        });

        if (res.locals["halfOpen"]) {
            recordSuccess(target);
        }

        return res.status(targetResponse.status).send(targetResponse.data);
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            recordFailure(target);
            const status = error.response?.status ?? 502;
            return res.status(status).send(error.response?.data);
        }
        recordFailure(target);
        return res.status(500).send("Upstream request failed");
    }
});

export default router;
