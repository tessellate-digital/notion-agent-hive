// src/agents/reviewer-final.ts
import type { AgentDefinition } from "./types";
import FINAL_REVIEWER_PROMPT from "../prompts/reviewer-final";

export function createFinalReviewerAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-final-reviewer",
		config: {
			description: "Feature-level coherence review agent: big-picture across all tasks",
			mode: "subagent",
			prompt: FINAL_REVIEWER_PROMPT,
			temperature: 0.1,
			permission: {
				edit: "deny",
			},
			tools: {
				Edit: false,
				Write: false,
			},
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
