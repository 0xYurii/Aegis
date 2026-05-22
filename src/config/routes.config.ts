export const routes = [
    {
        path: "/users",
        target: [
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
        ],
        plugins: {
            auth: true,
            rateLimit: { max: 10, window: 60 },
        },
    },
    {
        path: "/product",
        target: [
            "http://localhost:3004",
            "http://localhost:3005",
            "http://localhost:3006",
        ],
        plugins: {
            auth: true,
            rateLimit: { max: 10, window: 60 },
        },
    },
];
