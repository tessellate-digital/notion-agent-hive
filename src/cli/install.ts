// src/cli/install.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODELS, DEFAULT_VARIANTS, getGlobalConfigDir } from "../config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

const PLUGIN_ID = "notion-agent-hive";
const PACKAGE_NAME = pkg.name as string;

interface OpencodeConfig {
	plugin?: string[];
	plugins?: string[];
	[key: string]: unknown;
}

function normalizePluginList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function getPackageName(entry: string): string {
  // For scoped packages like @scope/name@version, find @ after the first /
  // For unscoped packages like package@version, find @ after position 0
  const slashIndex = entry.indexOf("/");
  const atIndex = entry.lastIndexOf("@");
  // If @ comes after a / (or at position 0 for unscoped), it's a version
  if (atIndex > 0 && (slashIndex === -1 ? atIndex > 0 : atIndex > slashIndex)) {
    return entry.substring(0, atIndex);
  }
  return entry;
}

function createDefaultAgentConfig(agent: keyof typeof DEFAULT_MODELS) {
	return {
		model: DEFAULT_MODELS[agent],
		...(DEFAULT_VARIANTS[agent] ? { variant: DEFAULT_VARIANTS[agent] } : {}),
	};
}

export function buildNormalizedPluginEntries(
  existingEntries: string[],
  packageName: string,
  pluginId: string,
  version: string,
): string[] {
  const isSamePlugin = (entry: string) => {
    const name = getPackageName(entry);
    return name === packageName || name === pluginId;
  };
  return [
    ...existingEntries.filter((entry) => !isSamePlugin(entry)),
    `${packageName}@${version}`,
  ];
}

export async function install(): Promise<void> {
	const directory = getGlobalConfigDir();

	console.log("Installing notion-agent-hive...");
	mkdirSync(directory, { recursive: true });

	// Patch opencode.json
	const opencodeConfigPath = join(directory, "opencode.json");
	let opencodeConfig: OpencodeConfig = {};

	if (existsSync(opencodeConfigPath)) {
		opencodeConfig = JSON.parse(readFileSync(opencodeConfigPath, "utf-8"));
	}

  const pluginEntries = [
    ...new Set([
      ...normalizePluginList(opencodeConfig.plugin),
      ...normalizePluginList(opencodeConfig.plugins),
    ]),
  ];

  // Check if plugin is already registered (handle all variants: scoped, unscoped, versioned)
  const isSamePlugin = (entry: string) => {
    const pkg = getPackageName(entry);
    return pkg === PACKAGE_NAME || pkg === PLUGIN_ID;
  };

  const alreadyRegistered = pluginEntries.some(isSamePlugin);

  // Always write the version being installed, even if the package was already registered
  const { version } = pkg;
  const normalizedPluginEntries = buildNormalizedPluginEntries(
    pluginEntries,
    PACKAGE_NAME,
    PLUGIN_ID,
    version,
  );

  const existingPluginEntries = normalizePluginList(opencodeConfig.plugin);
  const shouldWriteOpencodeConfig =
    !alreadyRegistered ||
    "plugins" in opencodeConfig ||
    JSON.stringify(existingPluginEntries) !== JSON.stringify(normalizedPluginEntries);

	if (shouldWriteOpencodeConfig) {
		const { plugins: _legacyPlugins, ...nextOpencodeConfig } = opencodeConfig;
		opencodeConfig = { ...nextOpencodeConfig, plugin: normalizedPluginEntries };
		writeFileSync(opencodeConfigPath, `${JSON.stringify(opencodeConfig, null, 2)}\n`);

		if (alreadyRegistered) {
			console.log("  Normalized plugin registry");
		} else {
			console.log(`  Added ${PACKAGE_NAME} to plugin`);
		}
	} else {
		console.log("  Plugin already registered");
	}

	// Create starter config or patch existing one with any missing agents
	const pluginConfigPath = join(directory, "notion-agent-hive.json");
	const NEW_AGENTS = ["finalReviewer", "gitCommitArchitect", "prReviewer"] as const;

	if (existsSync(pluginConfigPath)) {
		const existingConfig = JSON.parse(readFileSync(pluginConfigPath, "utf-8"));
		const agents = existingConfig.agents ?? {};
		const missing = NEW_AGENTS.filter((key) => !agents[key]);

		if (missing.length > 0) {
			for (const key of missing) {
				agents[key] = createDefaultAgentConfig(key);
			}
			existingConfig.agents = agents;
			writeFileSync(pluginConfigPath, `${JSON.stringify(existingConfig, null, 2)}\n`);
			console.log(`  Patched notion-agent-hive.json: added ${missing.join(", ")}`);
		} else {
			console.log("  notion-agent-hive.json already up to date");
		}
	} else {
		const starterConfig = {
			$schema: `https://unpkg.com/${PACKAGE_NAME}@latest/schema.json`,
			agents: {
				coordinator: createDefaultAgentConfig("coordinator"),
				thinker: createDefaultAgentConfig("thinker"),
				executor: createDefaultAgentConfig("executor"),
				reviewer: createDefaultAgentConfig("reviewer"),
				finalReviewer: createDefaultAgentConfig("finalReviewer"),
				gitCommitArchitect: createDefaultAgentConfig("gitCommitArchitect"),
				prReviewer: createDefaultAgentConfig("prReviewer"),
			},
			fallback: { enabled: true, chains: {} },
		};
		writeFileSync(pluginConfigPath, `${JSON.stringify(starterConfig, null, 2)}\n`);
		console.log("  Created notion-agent-hive.json");
	}

	console.log("\nDone! Restart OpenCode to load the plugin.");
}
