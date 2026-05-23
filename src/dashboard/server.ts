import { type Request, type Response } from "express";
import { getCircuit } from "../plugins/circuit-breaker";
import { RouteConfig } from "../types";

export const getStats = (routes: RouteConfig[]) => {
    return (req: Request, res: Response) => {
        let results: any[] = [];
        for (const route of routes) {
            for (const target of route.target) {
                const current = getCircuit(target);
                results.push({
                    path: route.path,
                    targetUrl: target,
                    failures: current.failures,
                    state: current.state,
                });
            }
        }
        return res.status(200).json(results);
    };
};
