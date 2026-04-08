import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { version } from "../package.json";
import pluginModule, { NotionAgentHivePlugin } from "../src/index";

const TEST_DIR = join(import.meta.dir, ".test-plugin-entry");
const CONFIG_DIR = join(TEST_DIR, "config");
const PROJECT_DIR = join(TEST_DIR, "project");
const ORIGINAL_OPENCODE_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR;

describe("plugin entry", () => {
	beforeEach(() => {
		mkdirSync(CONFIG_DIR, { recursive: true });
		mkdirSync(PROJECT_DIR, { recursive: true });
		process.env.OPENCODE_CONFIG_DIR = CONFIG_DIR;
	});

	afterEach(() => {
		if (ORIGINAL_OPENCODE_CONFIG_DIR === undefined) {
			Reflect.deleteProperty(process.env, "OPENCODE_CONFIG_DIR");
		} else {
			process.env.OPENCODE_CONFIG_DIR = ORIGINAL_OPENCODE_CONFIG_DIR;
		}
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("default exports a server plugin for OpenCode npm loading", () => {
		expect(pluginModule).toBeDefined();
		expect(pluginModule.server).toBe(NotionAgentHivePlugin);
	});

	it("uses the intended runtime defaults when no config file exists", async () => {
		const hooks = await NotionAgentHivePlugin({
			directory: PROJECT_DIR,
		} as Parameters<typeof NotionAgentHivePlugin>[0]);
		const input: { agent?: Record<string, { model?: string; variant?: string }> } = {};

		await hooks.config?.(input);

		expect(input.agent?.[`notion agent hive v${version}`]).toMatchObject({ model: "openai/gpt-5.2" });
		expect(input.agent?.["notion-thinker-planner"]).toMatchObject({
			model: "openai/gpt-5.4",
			variant: "xhigh",
		});
		expect(input.agent?.["notion-thinker-investigator"]).toMatchObject({
			model: "openai/gpt-5.4",
			variant: "xhigh",
		});
		expect(input.agent?.["notion-thinker-refiner"]).toMatchObject({
			model: "openai/gpt-5.4",
			variant: "xhigh",
		});
		expect(input.agent?.["notion-executor"]).toMatchObject({ model: "kimi-for-coding/k2p5" });
		expect(input.agent?.["notion-reviewer"]).toMatchObject({
			model: "openai/gpt-5.4",
			variant: "xhigh",
		});
	});
});
