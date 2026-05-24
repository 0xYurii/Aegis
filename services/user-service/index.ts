import express, { Request, Response } from "express";

const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/users", (req: Request, res: Response) => {
    res.status(200).json({
        message: `✅ Hello from User Service on port ${PORT}`,
        receivedUserId: req.headers["x-user-id"],
        reqId: req.headers["x-request-id"],
    });
});

app.get("/users/fail", (req: Request, res: Response) => {
    console.log(`❌ Intentional failure triggered on port ${PORT}`);
    res.status(500).json({ error: `Internal Server Error on port ${PORT}` });
});

app.listen(PORT, () => {
    console.log(`👤 User Service listening on http://localhost:${PORT}`);
});
