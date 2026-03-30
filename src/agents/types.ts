import type { AgentConfig } from "@opencode-ai/sdk/v2";

export type { AgentConfig };

/**
 * Extended agent definition with metadata for plugin registration.
 */
export interface AgentDefinition {
	/** Unique agent name (e.g., "notion agent hive") */
	name: string;
	/** Agent configuration (matches OpenCode's AgentConfig shape) */
	config: AgentConfig;
	/** Priority-ordered model entries for runtime fallback resolution */
	_modelArray?: Array<{ id: string; variant?: string }>;
}
