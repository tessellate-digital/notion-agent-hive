// src/agents/thinker-refiner.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentDefinition } from "./types";

const THINKER_REFINER_PROMPT = readFileSync(
  join(import.meta.dir, "../../prompts/dist/thinker-refiner.md"),
  "utf-8"
);

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
