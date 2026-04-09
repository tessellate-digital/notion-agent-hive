import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const AgentModelSchema = z.union([
  z.string(),
  z.array(
    z.union([
      z.string(),
      z.object({ id: z.string(), variant: z.string().optional() }),
    ]),
  ),
]);

const AgentConfigSchema = z.object({
  model: AgentModelSchema.optional(),
  variant: z.string().optional(),
});

const PluginConfigSchema = z.object({
  $schema: z.string().optional(),
  agents: z
    .object({
      coordinator: AgentConfigSchema.optional(),
      thinker: AgentConfigSchema.optional(),
      executor: AgentConfigSchema.optional(),
      reviewer: AgentConfigSchema.optional(),
      finalReviewer: AgentConfigSchema.optional(),
      gitCommitArchitect: AgentConfigSchema.optional(),
      prReviewer: AgentConfigSchema.optional(),
    })
    .strict()
    .optional(),
  fallback: z
    .object({
      enabled: z.boolean().optional(),
      chains: z.record(z.array(z.string())).optional(),
    })
    .optional(),
});

export type PluginConfig = z.infer<typeof PluginConfigSchema>;

export const DEFAULT_MODELS = {
  coordinator: "openai/gpt-5.2",
  thinker: "openai/gpt-5.4",
  executor: "kimi-for-coding/k2p5",
  reviewer: "openai/gpt-5.4",
  finalReviewer: "openai/gpt-5.4",
  gitCommitArchitect: "openai/gpt-5.4",
  prReviewer: "openai/gpt-5.4",
} as const;

export const DEFAULT_VARIANTS = {
  coordinator: undefined,
  thinker: "xhigh",
  executor: undefined,
  reviewer: "xhigh",
  finalReviewer: "xhigh",
  gitCommitArchitect: "xhigh",
  prReviewer: "xhigh",
} as const;

const CONFIG_FILENAME = "notion-agent-hive.json";

/**
 * Resolve the OpenCode global config directory.
 * Order: OPENCODE_CONFIG_DIR > XDG_CONFIG_HOME/opencode > ~/.config/opencode
 */
export function getGlobalConfigDir(): string {
  if (process.env.OPENCODE_CONFIG_DIR?.trim()) {
    return process.env.OPENCODE_CONFIG_DIR.trim();
  }
  const xdg = process.env.XDG_CONFIG_HOME?.trim();
  return join(xdg || join(homedir(), ".config"), "opencode");
}

function readConfig(filePath: string): PluginConfig | null {
  if (!existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"));
    const result = PluginConfigSchema.safeParse(parsed);
    if (!result.success) {
      console.warn(
        `[notion-agent-hive] Invalid config at ${filePath}:`,
        result.error.format(),
      );
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

function deepMerge(base: PluginConfig, override: PluginConfig): PluginConfig {
  return {
    ...base,
    ...override,
    agents: { ...base.agents, ...override.agents },
    fallback:
      base.fallback || override.fallback
        ? {
            ...base.fallback,
            ...override.fallback,
            chains: { ...base.fallback?.chains, ...override.fallback?.chains },
          }
        : undefined,
  };
}

/**
 * Load plugin config from two locations and deep-merge them.
 *
 * 1. Global: ~/.config/opencode/notion-agent-hive.json (or $OPENCODE_CONFIG_DIR / $XDG_CONFIG_HOME)
 * 2. Project: <directory>/notion-agent-hive.json
 *
 * Project config takes precedence. Agents are merged per-key so a global
 * thinker model is not overwritten by a project config that only sets executor.
 */
export function loadConfig(directory: string): PluginConfig {
  const globalConfig = readConfig(join(getGlobalConfigDir(), CONFIG_FILENAME));
  const projectConfig = readConfig(join(directory, CONFIG_FILENAME));

  if (!globalConfig || !projectConfig) {
    return globalConfig ?? projectConfig ?? {};
  }

  return deepMerge(globalConfig, projectConfig);
}
