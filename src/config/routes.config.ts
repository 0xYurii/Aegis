import { RouteConfig } from "../types";

export const routes: RouteConfig[] = [
    {
        path: "/users",
        target: [
            "http://user-service-1:3001",
            "http://user-service-2:3001",
            "http://user-service-3:3001",
        ],
        plugins: {
            auth: true,
            rateLimit: { max: 10, window: 60 },
        },
    },
    {
        path: "/product",
        target: [
            "http://product-service-1:3004",
            "http://product-service-2:3004",
            "http://product-service-3:3004",
        ],
        plugins: {
            auth: true,
            rateLimit: { max: 10, window: 60 },
        },
    },
];
