import packageJson from "../../package.json";
import COORDINATOR_PROMPT from "../prompts/coordinator";
// src/agents/coordinator.ts
import type { AgentDefinition } from "./types";

const { version } = packageJson;

export function createCoordinatorAgent(
  model?: string | Array<string | { id: string; variant?: string }>,
  variant?: string,
): AgentDefinition {
  const definition: AgentDefinition = {
    name: `notion agent hive v${version}`,
    config: {
      description: "Coordinator agent for Notion workflow orchestration",
      mode: "primary",
      prompt: COORDINATOR_PROMPT,
      temperature: 0.2,
      permission: {
        question: "allow",
        edit: "deny",
        bash: "deny",
      },
      agents: {
        "notion-thinker": "allow",
        "notion-executor": "allow",
        "notion-reviewer-feature": "allow",
        "notion-reviewer-final": "allow",
        "notion-reviewer-pr": "allow",
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
