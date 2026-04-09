import { describe, expect, it } from "bun:test";
import { ForegroundFallbackManager } from "../src/fallback";

describe("ForegroundFallbackManager", () => {
	it("does nothing when disabled", async () => {
		const manager = new ForegroundFallbackManager({}, false);
		const result = await manager.handleEvent({
			type: "error",
			properties: { error: { code: "rate_limit_exceeded" }, agentName: "notion-thinker" },
		});
		expect(result).toBeUndefined();
	});

	it("does nothing for non-rate-limit errors", async () => {
		const chains = { "notion-thinker": ["model-a", "model-b"] };
		const manager = new ForegroundFallbackManager(chains, true);
		const result = await manager.handleEvent({
			type: "error",
			properties: { error: { code: "invalid_request" }, agentName: "notion-thinker" },
		});
		expect(result).toBeUndefined();
	});

	it("returns next model in chain on rate limit", async () => {
		const chains = { "notion-thinker": ["model-a", "model-b", "model-c"] };
		const manager = new ForegroundFallbackManager(chains, true);
		const event = {
			type: "error",
			properties: { error: { code: "rate_limit_exceeded" }, agentName: "notion-thinker" },
		};

		const result1 = await manager.handleEvent(event);
		expect(result1?.nextModel).toBe("model-b");

		const result2 = await manager.handleEvent(event);
		expect(result2?.nextModel).toBe("model-c");

		const result3 = await manager.handleEvent(event);
		expect(result3).toBeUndefined();
	});

	it("reset clears state for specific agent", async () => {
		const chains = { "notion-thinker": ["model-a", "model-b"] };
		const manager = new ForegroundFallbackManager(chains, true);
		const event = {
			type: "error",
			properties: { error: { code: "rate_limit_exceeded" }, agentName: "notion-thinker" },
		};
		await manager.handleEvent(event);
		manager.reset("notion-thinker");
		const result = await manager.handleEvent(event);
		expect(result?.nextModel).toBe("model-b");
	});
});
