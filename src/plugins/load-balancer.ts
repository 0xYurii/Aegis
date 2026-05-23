import type { Request, Response, NextFunction } from "express";
import { circuits, getCircuit } from "./circuit-breaker";

export const loadBalancer = (targets: string[]) => {
    let counterIndex = 0;

    return async (req: Request, res: Response, next: NextFunction) => {
        const total = targets.length;
        let checked = 0;

        while (checked < total) {
            const target = targets[counterIndex];
            const circuit = getCircuit(target);
            counterIndex = (counterIndex + 1) % total;
            checked++;

            if (circuit.state === "CLOSED") {
                res.locals["target"] = target;
                return next();
            }

            if (circuit.state === "OPEN") {
                if (Date.now() >= circuit.nextTry) {
                    circuits.set(target, {
                        ...circuit,
                        state: "HALF_OPEN",
                    });
                    res.locals["target"] = target;
                    res.locals["halfOpen"] = true;
                    return next();
                }
                continue;
            }

            if (circuit.state === "HALF_OPEN") {
                continue;
            }
        }

        return res.status(503).json({ message: "Service Unavailable" });
    };
};
