// src/agents/thinker-investigator.ts
import type { AgentDefinition } from "./types";
import THINKER_INVESTIGATOR_PROMPT from "../prompts/thinker-investigator";

export function createThinkerInvestigatorAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  variant?: string
): AgentDefinition {
  const definition: AgentDefinition = {
    name: "notion-thinker-investigator",
    config: {
      description: "Focused research agent for investigating blockers and failures",
      mode: "subagent",
      prompt: THINKER_INVESTIGATOR_PROMPT,
      temperature: 0.3,
      permission: {
        question: "allow",
        edit: "deny",
        bash: "deny",
      },
      tools: {
        Edit: false,
        Write: false,
      },
    },
  };

  if (Array.isArray(model)) {
    definition._modelArray = model.map((m) =>
      typeof m === "string" ? { id: m } : m
    );
  } else if (typeof model === "string" && model) {
    definition.config.model = model;
    if (variant) definition.config.variant = variant;
  }

  return definition;
}
