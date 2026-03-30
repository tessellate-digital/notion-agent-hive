// tests/agents.test.ts
import { describe, expect, it } from "bun:test"
import type { AgentDefinition } from "../src/agents/types"
import { createCoordinatorAgent } from "../src/agents/coordinator"
import { createThinkerAgent } from "../src/agents/thinker"
import { createExecutorAgent } from "../src/agents/executor"
import { createReviewerAgent } from "../src/agents/reviewer"

describe("AgentDefinition", () => {
  it("should accept a valid agent definition", () => {
    const def: AgentDefinition = {
      name: "test-agent",
      description: "A test agent",
      config: {
        system: "You are a test agent.",
      },
    }
    expect(def.name).toBe("test-agent")
  })

  it("should accept _modelArray for fallback chains", () => {
    const def: AgentDefinition = {
      name: "test-agent",
      config: { system: "Test" },
      _modelArray: [
        { id: "openai/gpt-4o" },
        { id: "anthropic/claude-3-opus", variant: "max" },
      ],
    }
    expect(def._modelArray).toHaveLength(2)
    expect(def._modelArray?.[1].variant).toBe("max")
  })
})

describe("createCoordinatorAgent", () => {
  it("creates agent with default config", () => {
    const agent = createCoordinatorAgent()
    expect(agent.name).toBe("notion-coordinator")
    expect(agent.config.system).toContain("coordinator")
  })

  it("applies string model override", () => {
    const agent = createCoordinatorAgent("anthropic/claude-3-opus", "max")
    expect(agent.config.model).toBe("anthropic/claude-3-opus")
    expect(agent.config.variant).toBe("max")
  })

  it("creates _modelArray from array input", () => {
    const agent = createCoordinatorAgent(["openai/gpt-4o", "anthropic/claude-3-opus"])
    expect(agent._modelArray).toHaveLength(2)
    expect(agent._modelArray?.[0].id).toBe("openai/gpt-4o")
  })

  it("restricts subagent dispatch to notion agents only", () => {
    const agent = createCoordinatorAgent()
    expect(agent.config.agents?.["notion-thinker"]).toBe("allow")
    expect(agent.config.agents?.["notion-executor"]).toBe("allow")
    expect(agent.config.agents?.["notion-reviewer"]).toBe("allow")
  })
})

describe("createThinkerAgent", () => {
  it("creates agent with correct name", () => {
    const agent = createThinkerAgent()
    expect(agent.name).toBe("notion-thinker")
  })

  it("denies code modification tools", () => {
    const agent = createThinkerAgent()
    expect(agent.config.tools?.Edit).toBe("deny")
    expect(agent.config.tools?.Write).toBe("deny")
  })

  it("applies model array correctly", () => {
    const agent = createThinkerAgent(["openai/gpt-4o", "anthropic/claude-3-opus"])
    expect(agent._modelArray).toHaveLength(2)
  })
})

describe("createExecutorAgent", () => {
  it("creates agent with correct name", () => {
    const agent = createExecutorAgent()
    expect(agent.name).toBe("notion-executor")
  })

  it("allows code modification tools (no tool restrictions)", () => {
    const agent = createExecutorAgent()
    expect(agent.config.tools?.Edit).toBeUndefined()
    expect(agent.config.tools?.Write).toBeUndefined()
  })

  it("applies string model correctly", () => {
    const agent = createExecutorAgent("openai/gpt-4o", "max")
    expect(agent.config.model).toBe("openai/gpt-4o")
    expect(agent.config.variant).toBe("max")
  })

  it("applies model array correctly", () => {
    const agent = createExecutorAgent(["openai/gpt-4o", "anthropic/claude-3-opus"])
    expect(agent._modelArray).toHaveLength(2)
  })
})

describe("createReviewerAgent", () => {
  it("creates agent with correct name", () => {
    const agent = createReviewerAgent()
    expect(agent.name).toBe("notion-reviewer")
  })

  it("denies code modification tools", () => {
    const agent = createReviewerAgent()
    expect(agent.config.tools?.Edit).toBe("deny")
    expect(agent.config.tools?.Write).toBe("deny")
  })

  it("applies model array correctly", () => {
    const agent = createReviewerAgent(["openai/gpt-4o", "anthropic/claude-3-opus"])
    expect(agent._modelArray).toHaveLength(2)
  })
})
