export const routes = [
    {
        path: "/users",
        target: "user-service",
        plugins: {
            auth: true,
        },
    },
    {
        path: "product",
        target: "target-service",
        plugins: {
            auth: true,
        },
    },
];
