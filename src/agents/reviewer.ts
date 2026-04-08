// src/agents/reviewer.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentDefinition } from "./types";

const REVIEWER_PROMPT = readFileSync(
  join(import.meta.dir, "../../prompts/dist/reviewer.md"),
  "utf-8"
);

export function createReviewerAgent(
	model?: string | Array<string | { id: string; variant?: string }>,
	variant?: string,
): AgentDefinition {
	const definition: AgentDefinition = {
		name: "notion-reviewer",
		config: {
			description: "QA reviewer agent for implementation verification",
			mode: "subagent",
			prompt: REVIEWER_PROMPT,
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
