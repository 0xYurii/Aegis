import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import gateWayRouter from "./core/gateway";
import { routes } from "./config/routes.config";
import { auth } from "./plugins/auth";
import { loggerPlug } from "./plugins/logger";
import { rateLimiter } from "./plugins/rate-limiter";
import { loadBalancer } from "./plugins/load-balancer";

const app: Application = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(loggerPlug);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
for (const route of routes) {
    const middleware = [];

    middleware.push(loadBalancer(route.target));

    if (route.plugins.auth) middleware.push(auth);
    if (route.plugins.rateLimit)
        middleware.push(rateLimiter(route.plugins.rateLimit));

    app.use(route.path, ...middleware, gateWayRouter);
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
