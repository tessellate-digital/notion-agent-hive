// src/agents/thinker-planner.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentDefinition } from "./types";

const THINKER_PLANNER_PROMPT = readFileSync(
  join(import.meta.dir, "../../prompts/dist/thinker-planner.md"),
  "utf-8"
);

export function createThinkerPlannerAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  variant?: string
): AgentDefinition {
  const definition: AgentDefinition = {
    name: "notion-thinker-planner",
    config: {
      description: "Deep research and planning agent for feature decomposition",
      mode: "subagent",
      prompt: THINKER_PLANNER_PROMPT,
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
