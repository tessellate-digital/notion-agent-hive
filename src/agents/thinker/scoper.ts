import THINKER_SCOPER_PROMPT from "../../prompts/thinker/scoper";
// src/agents/thinker/scoper.ts
import type { AgentDefinition } from "../types";

export function createThinkerScoperAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  variant?: string,
): AgentDefinition {
  const definition: AgentDefinition = {
    name: "notion-thinker-scoper",
    config: {
      description: "Fast scope analyser for multi-vertical feature triage",
      mode: "subagent",
      prompt: THINKER_SCOPER_PROMPT,
      temperature: 0.2,
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
      typeof m === "string" ? { id: m } : m,
    );
  } else if (typeof model === "string" && model) {
    definition.config.model = model;
    if (variant) definition.config.variant = variant;
  }

  return definition;
}
