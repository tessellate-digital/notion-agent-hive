// tests/agents.test.ts
import { describe, expect, it } from "bun:test";
import { createCoordinatorAgent } from "../src/agents/coordinator";
import { createExecutorAgent } from "../src/agents/executor";
import { createReviewerAgent } from "../src/agents/reviewer";
import { createThinkerPlannerAgent } from "../src/agents/thinker-planner";
import { createThinkerInvestigatorAgent } from "../src/agents/thinker-investigator";
import { createThinkerRefinerAgent } from "../src/agents/thinker-refiner";
import type { AgentDefinition } from "../src/agents/types";

describe("AgentDefinition", () => {
	it("should accept a valid agent definition", () => {
		const def: AgentDefinition = {
			name: "test-agent",
			config: {
				description: "A test agent",
				prompt: "You are a test agent.",
			},
		};
		expect(def.name).toBe("test-agent");
	});

	it("should accept _modelArray for fallback chains", () => {
		const def: AgentDefinition = {
			name: "test-agent",
			config: { system: "Test" },
			_modelArray: [{ id: "openai/gpt-4o" }, { id: "anthropic/claude-3-opus", variant: "max" }],
		};
		expect(def._modelArray).toHaveLength(2);
		expect(def._modelArray?.[1].variant).toBe("max");
	});
});

describe("createCoordinatorAgent", () => {
	it("creates agent with default config", () => {
		const agent = createCoordinatorAgent();
		expect(agent.name).toBe("notion agent hive");
		expect(agent.config.prompt).toBeDefined();
	});

	it("applies string model override", () => {
		const agent = createCoordinatorAgent("anthropic/claude-3-opus", "max");
		expect(agent.config.model).toBe("anthropic/claude-3-opus");
		expect(agent.config.variant).toBe("max");
	});

	it("creates _modelArray from array input", () => {
		const agent = createCoordinatorAgent(["openai/gpt-4o", "anthropic/claude-3-opus"]);
		expect(agent._modelArray).toHaveLength(2);
		expect(agent._modelArray?.[0].id).toBe("openai/gpt-4o");
	});

	it("restricts subagent dispatch to notion agents only", () => {
		const agent = createCoordinatorAgent();
		expect(agent.config.agents?.["notion-thinker"]).toBe("allow");
		expect(agent.config.agents?.["notion-executor"]).toBe("allow");
		expect(agent.config.agents?.["notion-reviewer"]).toBe("allow");
	});
});

describe("createThinkerPlannerAgent", () => {
	it("creates agent with correct name", () => {
		const agent = createThinkerPlannerAgent();
		expect(agent.name).toBe("notion-thinker-planner");
	});

	it("denies code modification tools", () => {
		const agent = createThinkerPlannerAgent();
		expect(agent.config.tools?.Edit).toBe(false);
		expect(agent.config.tools?.Write).toBe(false);
	});

	it("applies model array correctly", () => {
		const agent = createThinkerPlannerAgent(["openai/gpt-4o", "anthropic/claude-3-opus"]);
		expect(agent._modelArray).toHaveLength(2);
	});
});

describe("createThinkerInvestigatorAgent", () => {
	it("creates agent with correct name", () => {
		const agent = createThinkerInvestigatorAgent();
		expect(agent.name).toBe("notion-thinker-investigator");
	});

	it("denies code modification tools", () => {
		const agent = createThinkerInvestigatorAgent();
		expect(agent.config.tools?.Edit).toBe(false);
		expect(agent.config.tools?.Write).toBe(false);
	});

	it("applies model array correctly", () => {
		const agent = createThinkerInvestigatorAgent(["openai/gpt-4o", "anthropic/claude-3-opus"]);
		expect(agent._modelArray).toHaveLength(2);
	});
});

describe("createThinkerRefinerAgent", () => {
	it("creates agent with correct name", () => {
		const agent = createThinkerRefinerAgent();
		expect(agent.name).toBe("notion-thinker-refiner");
	});

	it("denies code modification tools", () => {
		const agent = createThinkerRefinerAgent();
		expect(agent.config.tools?.Edit).toBe(false);
		expect(agent.config.tools?.Write).toBe(false);
	});

	it("applies model array correctly", () => {
		const agent = createThinkerRefinerAgent(["openai/gpt-4o", "anthropic/claude-3-opus"]);
		expect(agent._modelArray).toHaveLength(2);
	});
});

describe("createExecutorAgent", () => {
	it("creates agent with correct name", () => {
		const agent = createExecutorAgent();
		expect(agent.name).toBe("notion-executor");
	});

	it("allows code modification tools (no tool restrictions)", () => {
		const agent = createExecutorAgent();
		expect(agent.config.tools?.Edit).toBeUndefined();
		expect(agent.config.tools?.Write).toBeUndefined();
	});

	it("applies string model correctly", () => {
		const agent = createExecutorAgent("openai/gpt-4o", "max");
		expect(agent.config.model).toBe("openai/gpt-4o");
		expect(agent.config.variant).toBe("max");
	});

	it("applies model array correctly", () => {
		const agent = createExecutorAgent(["openai/gpt-4o", "anthropic/claude-3-opus"]);
		expect(agent._modelArray).toHaveLength(2);
	});
});

describe("createReviewerAgent", () => {
	it("creates agent with correct name", () => {
		const agent = createReviewerAgent();
		expect(agent.name).toBe("notion-reviewer");
	});

	it("denies code modification tools", () => {
		const agent = createReviewerAgent();
		expect(agent.config.tools?.Edit).toBe(false);
		expect(agent.config.tools?.Write).toBe(false);
	});

	it("applies model array correctly", () => {
		const agent = createReviewerAgent(["openai/gpt-4o", "anthropic/claude-3-opus"]);
		expect(agent._modelArray).toHaveLength(2);
	});
});
