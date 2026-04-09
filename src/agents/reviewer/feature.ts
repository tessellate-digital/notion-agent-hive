import REVIEWER_PROMPT from "../../prompts/reviewer/feature";
// src/agents/reviewer/feature.ts
import type { AgentDefinition } from "../types";

export function createReviewerAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  variant?: string,
): AgentDefinition {
  const definition: AgentDefinition = {
    name: "notion-reviewer-feature",
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
    definition._modelArray = model.map((m) =>
      typeof m === "string" ? { id: m } : m,
    );
  } else if (typeof model === "string" && model) {
    definition.config.model = model;
    if (variant) definition.config.variant = variant;
  }

  return definition;
}
