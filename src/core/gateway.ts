import { Router, Application, Request, Response, NextFunction } from "express";
import axios from "axios";

const router = Router();
const targetUrl = "http://localhost:3001/";

router.all("*", async (req: Request, res: Response) => {
    const method = req.method;
    const path = targetUrl + req.originalUrl;
    const headers = req.headers;
    const body = req.body;

    try {
        const targetResponse = await axios({
            method: method,
            url: path,
            headers: headers,
            data: body,
        });
        res.status(targetResponse.status).send(targetResponse.data);
    } catch (error) {
        console.error(error);
        res.status(401).send(body);
    }
});

export default router;
