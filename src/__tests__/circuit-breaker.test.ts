import {
    getCircuit,
    recordFailure,
    recordSuccess,
    circuits,
} from "../plugins/circuit-breaker";

beforeEach(() => {
    circuits.clear();
});

describe("Circuit Breaker", () => {
    it("returns CLOSED by default for unknown target", () => {
        const state = getCircuit("http://unknown:3001");
        expect(state.state).toBe("CLOSED");
        expect(state.failures).toBe(0);
        expect(state.nextTry).toBe(0);
    });

    it("increment failure counte", () => {
        recordFailure("http://service:3001");
        expect(getCircuit("http://service:3001").failures).toBe(1);
    });

    it("opens circuit after 3 failures and sets valid nextTry", () => {
        const before = Date.now();
        recordFailure("http://service:3001");
        recordFailure("http://service:3001");
        recordFailure("http://service:3001");
        expect(getCircuit("http://service:3001").state).toBe("OPEN");
        expect(
            getCircuit("http://service:3001").nextTry,
        ).toBeGreaterThanOrEqual(before + 59000);
    });

    it("slams back to OPEN on HALF_OPEN", () => {
        const circuit = getCircuit("http://service:3001");
        circuits.set("http://service:3001", {
            ...circuit,
            state: "HALF_OPEN",
        });
        recordFailure("http://service:3001");
        expect(getCircuit("http://service:3001").state).toBe("OPEN");
    });

    it("resets failures to 0 and state to CLOSED", () => {
        recordSuccess("http://service:3001");
        const state = getCircuit("http://service:3001");
        expect(state.state).toBe("CLOSED");
        expect(state.failures).toBe(0);
        expect(state.nextTry).toBe(0);
    });

    it("checks state on each recordFailure", () => {
        recordFailure("http://service:3001");
        expect(getCircuit("http://service:3001").state).toBe("CLOSED");
        recordFailure("http://service:3001");
        expect(getCircuit("http://service:3001").state).toBe("CLOSED");
        recordFailure("http://service:3001");
        expect(getCircuit("http://service:3001").state).toBe("OPEN");
    });
});
