import { Router, Request, Response } from "express";
import axios from "axios";
import { routes } from "../config/routes.config";

const router = Router();
let targetUrl = process.env.targetUrl || "http://localhost:3001/";

router.all("*", async (req: Request, res: Response) => {
    const method = req.method;
    const headers = req.headers;
    const body = req.body;
    let found = false;

    for (let i = 0; i < routes.length; i++) {
        if (routes[i].path === req.originalUrl) {
            found = true;
            targetUrl = targetUrl + routes[i].target;
        }
    }
    if (!found) {
        res.status(404).send("Route not found");
    }

    try {
        const targetResponse = await axios({
            method: method,
            url: targetUrl,
            headers: headers,
            data: body,
        });
        res.status(targetResponse.status).send(targetResponse.data);
    } catch (error: any) {
        console.error(error);
        res.status(error.respose?.status).send(error.respose?.data);
    }
});

export default router;
