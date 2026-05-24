# Aegis 🛡️

> A production-grade API Gateway built from scratch
> Sits in front of your microservices and handles routing, auth, rate limiting, load balancing, and fault tolerance.

---

## Architecture

```
                        ┌─────────────────────────────────────────────────┐
                        │                  AEGIS GATEWAY :8000            │
                        │                                                 │
  ┌────────┐            │  ┌──────────┐   ┌───────────┐   ┌────────────┐  │
  │        │  Request   │  │          │   │   Rate    │   │   Load     │  │
  │ Client │ ────────►  │  │   Auth   │──►│  Limiter  │──►│  Balancer  │  │
  │        │            │  │  Plugin  │   │  (Redis)  │   │            │  │
  └────────┘            │  └──────────┘   └───────────┘   └─────┬──────┘  │
                        │       │                               │         │
                        │    401 if                    round-robin pick   │
                        │   no token                            │         │
                        └───────────────────────────────────────┼─────────┘
                                                                │
                                   ┌────────────────────────────┼───────────────────────┐
                                   │                            │                       │
                                   ▼                            ▼                       ▼
                           ┌──────────────┐           ┌──────────────┐        ┌──────────────┐
                           │ user-service │           │ user-service │        │ user-service │
                           │     -1 🟢    │           │     -2 🟢    │        │     -3 🔴    │
                           │   CLOSED     │           │   CLOSED     │        │    OPEN      │
                           └──────────────┘           └──────────────┘        └──────────────┘
                                                                               (skipped by
                                                                              circuit breaker)
```

### Request Flow

```
1. Request arrives at :8000
2. Logger generates X-Request-ID, starts timer
3. Auth Plugin validates JWT → 401 if missing or invalid
4. Rate Limiter checks Redis counter for this IP → 429 if exceeded
5. Load Balancer picks a healthy target (round-robin, skips OPEN circuits)
6. Gateway proxies request to target, forwards all headers + x-user-id
7. On success → recordSuccess() if HALF_OPEN test
8. On failure → recordFailure() → circuit breaker updates state
9. Logger prints: [METHOD] targetUrl → status (Xms) [request-id]
```

---

## Circuit Breaker

Aegis implements a full **three-state circuit breaker** per downstream service instance to prevent cascading failures across the system.


```
CLOSED ──(3 failures)──► OPEN ──(60s pass)──► HALF_OPEN
  ▲                                                │
  └──────(success)─────────────────────────────────┘
                          │
              (failure)───┘ → back to OPEN
```

---

## Features

| Plugin | What it does |
|---|---|
| **Auth** | Validates JWT on protected routes, injects `x-user-id` header downstream |
| **Rate Limiter** | Redis-backed per-IP counter, configurable max requests + window |
| **Load Balancer** | Round-robin across service instances, skips unhealthy targets |
| **Circuit Breaker** | CLOSED → OPEN → HALF_OPEN state machine per instance |
| **Logger** | Logs method, target URL, status, duration, and correlation ID |
| **Stats Endpoint** | `GET /gateway/stats` returns live health snapshot of all instances |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- That's it — no Node.js needed locally

### Installation

```bash
# 1. clone the repo
git clone https://github.com/0xYurii/Aegis
cd Aegis
```

2. Create `.env` and fill in your values:

```env
PORT=8000
REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret_key_here
```

```bash
# 3. build and start everything (gateway + redis + 6 fake services)
docker compose up --build
```

That's it. All 9 containers spin up automatically:

```
✔ aegis-redis-1             Running
✔ aegis-user-service-1-1    Running  → :3001
✔ aegis-user-service-2-1    Running  → :3001
✔ aegis-user-service-3-1    Running  → :3001
✔ aegis-product-service-1-1 Running  → :3004
✔ aegis-product-service-2-1 Running  → :3004
✔ aegis-product-service-3-1 Running  → :3004
✔ aegis-gateway-1           Running  → :8000
```

### Stopping

```bash
docker compose down
```

---

## Plugin Config (per route)

```typescript
// src/config/routes.config.ts
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
}
```

---

## Testing

### Generate a test JWT

You need a token signed with your `JWT_SECRET`. Quick way — run this in Node:

```js
const jwt = require("jsonwebtoken");
const token = jwt.sign({ userId: "test-123" }, "your_secret_key_here");
console.log(token);
```

### Test the gateway

```bash
# no token → 401
curl http://localhost:8000/users

# with valid JWT → 200
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/users

# another route
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/product

# test rate limiting — fire 15 requests fast, 429 kicks in after 10
for i in {1..15}; do curl -H "Authorization: Bearer <your_token>" http://localhost:8000/users; done

# trigger circuit breaker — hit /fail 3 times to open the circuit
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/users/fail
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/users/fail
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/users/fail

# check live health of all instances
curl http://localhost:8000/gateway/stats
```

### Stats response example

```json
[
  { "path": "/users", "targetUrl": "http://user-service-1:3001", "failures": 3, "state": "OPEN" },
  { "path": "/users", "targetUrl": "http://user-service-2:3001", "failures": 0, "state": "CLOSED" },
  { "path": "/users", "targetUrl": "http://user-service-3:3001", "failures": 0, "state": "CLOSED" },
  { "path": "/product", "targetUrl": "http://product-service-1:3004", "failures": 0, "state": "CLOSED" },
  { "path": "/product", "targetUrl": "http://product-service-2:3004", "failures": 0, "state": "CLOSED" },
  { "path": "/product", "targetUrl": "http://product-service-3:3004", "failures": 0, "state": "CLOSED" }
]
```

---

## Stack

| | |
|---|---|
| **Runtime** | Node.js 20 + TypeScript |
| **Framework** | Express 5 |
| **HTTP Client** | Axios |
| **Cache / State** | Redis (ioredis) |
| **Auth** | JWT (jsonwebtoken) |
| **Tracing** | UUID correlation IDs (x-request-id) |
| **Containers** | Docker + Docker Compose |

---

*Built by [Younes Hebaiche](https://0xyuri.vercel.app)*
