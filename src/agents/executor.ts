// src/agents/executor.ts
import type { AgentDefinition } from "./types";
import EXECUTOR_PROMPT from "../prompts/executor";

export function createExecutorAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-executor",
		config: {
			description: "Execution-only agent for code implementation",
			mode: "subagent",
			prompt: EXECUTOR_PROMPT,
			temperature: 0.1,
		},
	};

	if (Array.isArray(model)) {
		definition._modelArray = model.map((m) => (typeof m === "string" ? { id: m } : m));
	} else if (typeof model === "string" && model) {
		definition.config.model = model;
		if (variant) definition.config.variant = variant;
	}

	return definition;
}
