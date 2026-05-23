import { CircuitState } from "../types";

export const circuits = new Map<string, CircuitState>();

export function getCircuit(target: string): CircuitState {
    return circuits.get(target) ?? { failures: 0, state: "CLOSED", nextTry: 0 };
}

export function recordFailure(target: string) {
    const current = getCircuit(target);

    if (current.state === "HALF_OPEN" || current.failures + 1 >= 3) {
        circuits.set(target, {
            failures: current.failures + 1,
            state: "OPEN",
            nextTry: Date.now() + 60000,
        });
    } else {
        circuits.set(target, {
            failures: current.failures + 1,
            state: "CLOSED",
            nextTry: 0,
        });
    }
}

export function recordSuccess(target: string) {
    circuits.set(target, {
        failures: 0,
        state: "CLOSED",
        nextTry: 0,
    });
}
