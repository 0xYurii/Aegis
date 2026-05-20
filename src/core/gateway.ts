import { Router, type Request, type Response } from "express";
import axios from "axios";
import { routes } from "../config/routes.config";
import { loggerPlug } from "../plugins/logger";
import { auth } from "../plugins/auth";

const router = Router();

router.all("*", async (req: Request, res: Response) => {
    let targetUrl = process.env.targetUrl || "http://localhost:3001/";
    const method = req.method;
    const body = req.body;
    let found = false;
    let count = 0;

    for (let i = 0; i < routes.length; i++) {
        if (routes[i].path.startsWith(req.originalUrl)) {
            found = true;
            targetUrl = targetUrl + routes[i].target;
            count = i;
        }
    }
    if (!found) {
        return res.status(404).send("Route not found");
    }

    if (routes[count].plugins.auth) auth(req, res, () => {});
    if (res.headersSent) return;

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") forwardHeaders[key] = value;
    }
    forwardHeaders["x-user-id"] = String(res.locals["userId"]);

    const start = loggerPlug(req, res);

    try {
        const targetResponse = await axios({
            method: method as any,
            url: targetUrl,
            headers: forwardHeaders,
            data: body,
        });

        const duration = Date.now() - start;
        console.log(
            `Method: ${method}, Path: ${targetUrl}, Status: ${targetResponse.status}, duration: ${duration}`,
        );

        return res.status(targetResponse.status).send(targetResponse.data);
    } catch (error: unknown) {
        console.error(error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;
            return res.status(status).send(error.response?.data);
        }

        return res.status(500).send("Upstream request failed");
    }
});

export default router;
