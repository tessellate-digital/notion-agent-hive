import PR_REVIEWER_PROMPT from "../../prompts/pr/reviewer";
import type { AgentDefinition } from "../types";

export function createPrReviewerAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-pr-reviewer",
		config: {
			description: "PR comment reviewer: fetches and classifies review comments from GitHub",
			mode: "subagent",
			prompt: PR_REVIEWER_PROMPT,
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
