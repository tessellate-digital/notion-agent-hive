// src/agents/executor.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentDefinition } from "./types";

const EXECUTOR_PROMPT = readFileSync(
  join(import.meta.dir, "../../prompts/dist/executor.md"),
  "utf-8"
);

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
