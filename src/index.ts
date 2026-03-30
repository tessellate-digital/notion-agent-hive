import { createCoordinatorAgent } from "./agents/coordinator";
import { createExecutorAgent } from "./agents/executor";
import { createReviewerAgent } from "./agents/reviewer";
import { createThinkerAgent } from "./agents/thinker";
// src/index.ts
import type { AgentDefinition } from "./agents/types";
import { DEFAULT_MODELS, DEFAULT_VARIANTS, loadConfig } from "./config";
import { ForegroundFallbackManager } from "./fallback";

export type { AgentDefinition } from "./agents/types";
export { loadConfig, DEFAULT_MODELS, DEFAULT_VARIANTS } from "./config";
export { createCoordinatorAgent } from "./agents/coordinator";
export { createThinkerAgent } from "./agents/thinker";
export { createExecutorAgent } from "./agents/executor";
export { createReviewerAgent } from "./agents/reviewer";
export { ForegroundFallbackManager } from "./fallback";

import type { Plugin } from "@opencode-ai/plugin";

export const NotionAgentHivePlugin: Plugin = async ({ directory }) => {
	const config = loadConfig(directory);

	const agentDefs: AgentDefinition[] = [
		createCoordinatorAgent(
			config.agents?.coordinator?.model ?? DEFAULT_MODELS.coordinator,
			config.agents?.coordinator?.variant ?? DEFAULT_VARIANTS.coordinator,
		),
		createThinkerAgent(
			config.agents?.thinker?.model ?? DEFAULT_MODELS.thinker,
			config.agents?.thinker?.variant ?? DEFAULT_VARIANTS.thinker,
		),
		createExecutorAgent(
			config.agents?.executor?.model ?? DEFAULT_MODELS.executor,
			config.agents?.executor?.variant ?? DEFAULT_VARIANTS.executor,
		),
		createReviewerAgent(
			config.agents?.reviewer?.model ?? DEFAULT_MODELS.reviewer,
			config.agents?.reviewer?.variant ?? DEFAULT_VARIANTS.reviewer,
		),
	];

	// Resolve first model from _modelArray for startup
	for (const def of agentDefs) {
		if (def._modelArray?.length) {
			const chosen = def._modelArray[0];
			def.config.model = chosen.id;
			if (chosen.variant) def.config.variant = chosen.variant;
		}
	}

	return {
		config: async (input) => {
			if (!input.agent) input.agent = {};
			for (const def of agentDefs) {
				input.agent[def.name] = def.config as (typeof input.agent)[string];
			}
		},
	};
};

export default {
	server: NotionAgentHivePlugin,
};
