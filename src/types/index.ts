export interface RouteConfig {
    path: string;
    target: string[];
    plugins: {
        auth?: boolean;
        rateLimit?: { max: number; window: number };
    };
}

export interface GatewayRequest {
    id: string;
    method: string;
    path: string;
    ip: string;
    headers: Record<string, string>;
    startTime: number;
}

export interface ServiceInstance {
    url: string;
    healthy: boolean;
    requestCount: number;
}

export interface CircuitState {
    failures: number;
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    nextTry: number;
}

export interface RateLimitOptions {
    max: number;
    window: number;
}
