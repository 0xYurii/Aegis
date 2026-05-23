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
  │ Client │ ────────►  │  │   Auth   │──►│  Limiter │─► │  Balancer  │  │
  │        │            │  │  Plugin  │   │  (Redis)  │   │            │  │
  └────────┘            │  └──────────┘   └───────────┘   └─────┬──────┘  │
                        │       │                               │         │
                        │    401 if                    round-robin pick   │
                        │   no token                            │         │
                        └───────────────────────────────────────┼─────────┘
                                                                │
                                          ┌─────────────────────┼──────────────────────┐
                                          │                     │                      │
                                          ▼                     ▼                      ▼
                                  ┌──────────────┐    ┌──────────────┐      ┌──────────────┐
                                  │ user-service │    │ user-service │      │ user-service │
                                  │  :3001 🟢    │    │  :3002 🟢    │      │  :3003 🔴    │
                                  │   CLOSED     │    │   CLOSED     │      │    OPEN      │
                                  └──────────────┘    └──────────────┘      └──────────────┘
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
| **Auth** | Validates JWT on protected routes, injects `x-user-id` header |
| **Rate Limiter** | Redis-backed per-IP counter, configurable max + window |
| **Load Balancer** | Round-robin across service instances, skips unhealthy targets |
| **Circuit Breaker** | CLOSED → OPEN → HALF_OPEN state machine per instance |
| **Logger** | Logs method, target, status, duration, and correlation ID |
| **Stats Endpoint** | `GET /gateway/stats` returns live health snapshot of all instances |

---

## Plugin Config (per route)

```typescript
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
}
```

---

## Getting Started

```bash
# clone & install
git clone https://github.com/0xYurii/Aegis
cd Aegis
npm install


# start Redis
docker run -d -p 6379:6379 redis:alpine

# run the gateway
npm run dev
```

---

## Testing

```bash
# test routing
curl http://localhost:8000/users

# test auth rejection
curl http://localhost:8000/users
# → 401 Access Denied: No Token Provided!

# test with JWT
curl -H "Authorization: Bearer <token>" http://localhost:8000/users

# test rate limiting (fire 15 requests fast)
for i in {1..15}; do curl -H "Authorization: Bearer <token>" http://localhost:8000/users; done
# → 429 after 10 requests

# check live gateway health
curl http://localhost:8000/gateway/stats
```

**Example stats response:**
```json
[
  { "path": "/users", "targetUrl": "http://localhost:3001", "failures": 0, "state": "CLOSED" },
  { "path": "/users", "targetUrl": "http://localhost:3002", "failures": 3, "state": "OPEN" },
  { "path": "/users", "targetUrl": "http://localhost:3003", "failures": 0, "state": "CLOSED" }
]
```

---

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **HTTP Client:** Axios
- **Cache/State:** Redis (ioredis)
- **Auth:** JWT (jsonwebtoken)
- **Tracing:** UUID correlation IDs

---
