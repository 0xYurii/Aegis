import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get("/product", (req: Request, res: Response) => {
    res.status(200).json({
        message: `📦 Hello from Product Service on port ${PORT}`,
        receivedUserId: req.headers["x-user-id"],
        reqId: req.headers["x-request-id"],
    });
});

app.get("/product/fail", (req: Request, res: Response) => {
    console.log(`❌ Intentional failure triggered on port ${PORT}`);
    res.status(500).json({ error: `Internal Server Error on port ${PORT}` });
});

app.listen(PORT, () => {
    console.log(
        `🛒 Product Service listening on http://product-service:${PORT}`,
    );
});
