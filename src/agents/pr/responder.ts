import PR_RESPONDER_PROMPT from "../../prompts/pr/responder";
import type { AgentDefinition } from "../types";

export function createPrResponderAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-pr-responder",
		config: {
			description: "PR responder: drafts and posts replies to GitHub PR review comments",
			mode: "subagent",
			prompt: PR_RESPONDER_PROMPT,
			temperature: 0.3,
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
