// src/agents/thinker-refiner.ts
import type { AgentDefinition } from "./types";
import THINKER_REFINER_PROMPT from "../prompts/thinker-refiner";

export function createThinkerRefinerAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  variant?: string
): AgentDefinition {
  const definition: AgentDefinition = {
    name: "notion-thinker-refiner",
    config: {
      description: "Task refinement agent for updating specifications based on feedback",
      mode: "subagent",
      prompt: THINKER_REFINER_PROMPT,
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
