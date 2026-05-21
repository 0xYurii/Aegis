export const routes = [
    {
        path: "/users",
        target: "http://localhost:3001",
        plugins: {
            auth: true,
            rateLimit: { max: 10, window: 60 },
        },
    },
    {
        path: "/product",
        target: "http://localhost:3002",
        plugins: {
            auth: true,
            rateLimit: { max: 10, window: 60 },
        },
    },
];
