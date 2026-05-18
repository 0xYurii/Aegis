import express, { Application, Request, Response, NextFunction } from "express";

const app: Application = express();
const PORT = 8000;

//Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
