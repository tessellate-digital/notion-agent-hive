import STACKED_PR_ARCHITECT_PROMPT from "../../prompts/git/stacked-pr-architect";
import type { AgentDefinition } from "../types";

export function createStackedPrArchitectAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-stacked-pr-architect",
		config: {
			description:
				"Stacked PR agent: groups changes into ordered gh-stack layers",
			mode: "subagent",
			prompt: STACKED_PR_ARCHITECT_PROMPT,
			temperature: 0.1,
		},
	};

	if (Array.isArray(model)) {
		definition._modelArray = model.map((m) =>
			typeof m === "string" ? { id: m } : m,
		);
	} else if (typeof model === "string" && model) {
		definition.config.model = model;
		if (variant) definition.config.variant = variant;
	}

	return definition;
}
