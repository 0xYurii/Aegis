import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import gateWayRouter from "./core/gateway";
import { routes } from "./config/routes.config";
import { auth } from "./plugins/auth";

const app: Application = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
for (const route of routes) {
    const middleware = [];
    if (route.plugins.auth) middleware.push(auth);

    app.use(route.target, ...middleware, gateWayRouter);
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
