// src/agents/git-commit-architect.ts
import type { AgentDefinition } from "./types";
import GIT_COMMIT_ARCHITECT_PROMPT from "../prompts/git-commit-architect";

export function createGitCommitArchitectAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-git-commit-architect",
		config: {
			description: "Commit crafting agent: groups changes into atomic conventional commits",
			mode: "subagent",
			prompt: GIT_COMMIT_ARCHITECT_PROMPT,
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
