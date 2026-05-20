import express, { Application, Request, Response, NextFunction } from "express";
import router from "./core/gateway";
import cors from "cors";
import morgan from "morgan";

const app: Application = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
