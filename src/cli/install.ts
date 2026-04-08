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

function createDefaultAgentConfig(agent: keyof typeof DEFAULT_MODELS) {
	return {
		model: DEFAULT_MODELS[agent],
		...(DEFAULT_VARIANTS[agent] ? { variant: DEFAULT_VARIANTS[agent] } : {}),
	};
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
	const normalizedPluginEntries = pluginEntries.filter((entry) => entry !== PLUGIN_ID);
	const alreadyRegistered = normalizedPluginEntries.includes(PACKAGE_NAME);

	if (!alreadyRegistered) {
		normalizedPluginEntries.push(PACKAGE_NAME);
	}

	const shouldWriteOpencodeConfig =
		!alreadyRegistered ||
		"plugins" in opencodeConfig ||
		JSON.stringify(normalizePluginList(opencodeConfig.plugin)) !==
			JSON.stringify(normalizedPluginEntries);

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
	const NEW_AGENTS = ["finalReviewer", "gitCommitArchitect"] as const;

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
			},
			fallback: { enabled: true, chains: {} },
		};
		writeFileSync(pluginConfigPath, `${JSON.stringify(starterConfig, null, 2)}\n`);
		console.log("  Created notion-agent-hive.json");
	}

	console.log("\nDone! Restart OpenCode to load the plugin.");
}
