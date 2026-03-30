import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { install } from "../src/cli/install";

const TEST_DIR = join(import.meta.dir, ".test-cli");
const CONFIG_DIR = join(TEST_DIR, "config");
const PROJECT_DIR = join(TEST_DIR, "project");
const ORIGINAL_CWD = process.cwd();
const ORIGINAL_OPENCODE_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR;

function readJson(path: string) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

describe("install", () => {
	beforeEach(() => {
		mkdirSync(CONFIG_DIR, { recursive: true });
		mkdirSync(PROJECT_DIR, { recursive: true });
		process.env.OPENCODE_CONFIG_DIR = CONFIG_DIR;
		process.chdir(PROJECT_DIR);
	});

	afterEach(() => {
		process.chdir(ORIGINAL_CWD);
		if (ORIGINAL_OPENCODE_CONFIG_DIR === undefined) {
			Reflect.deleteProperty(process.env, "OPENCODE_CONFIG_DIR");
		} else {
			process.env.OPENCODE_CONFIG_DIR = ORIGINAL_OPENCODE_CONFIG_DIR;
		}
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("writes opencode.json to the global config dir instead of cwd", async () => {
		await install();

		expect(existsSync(join(CONFIG_DIR, "opencode.json"))).toBe(true);
		expect(existsSync(join(PROJECT_DIR, "opencode.json"))).toBe(false);

		const config = readJson(join(CONFIG_DIR, "opencode.json"));
		expect(config.plugin).toContain("@its-me-loic/notion-agent-hive");
	});

	it("adds plugin to existing opencode.json", async () => {
		writeFileSync(join(CONFIG_DIR, "opencode.json"), JSON.stringify({ plugin: ["other-plugin"] }));

		await install();

		const config = readJson(join(CONFIG_DIR, "opencode.json"));
		expect(config.plugin).toContain("@its-me-loic/notion-agent-hive");
		expect(config.plugin).toContain("other-plugin");
	});

	it("migrates legacy plugins to plugin", async () => {
		writeFileSync(
			join(CONFIG_DIR, "opencode.json"),
			JSON.stringify({ plugins: ["other-plugin", "notion-agent-hive"] }),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "opencode.json"));
		expect(config.plugin).toEqual(["other-plugin", "@its-me-loic/notion-agent-hive"]);
		expect(config.plugins).toBeUndefined();
	});

	it("does not duplicate plugin entry", async () => {
		writeFileSync(
			join(CONFIG_DIR, "opencode.json"),
			JSON.stringify({ plugin: ["@its-me-loic/notion-agent-hive"] }),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "opencode.json"));
		expect(
			config.plugin.filter((p: string) => p === "@its-me-loic/notion-agent-hive"),
		).toHaveLength(1);
	});

	it("replaces legacy unscoped plugin entry with the scoped package name", async () => {
		writeFileSync(
			join(CONFIG_DIR, "opencode.json"),
			JSON.stringify({ plugin: ["notion-agent-hive"] }),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "opencode.json"));
		expect(config.plugin).toEqual(["@its-me-loic/notion-agent-hive"]);
	});

	it("creates starter notion-agent-hive.json in the global config dir", async () => {
		await install();

		expect(existsSync(join(CONFIG_DIR, "notion-agent-hive.json"))).toBe(true);
		expect(existsSync(join(PROJECT_DIR, "notion-agent-hive.json"))).toBe(false);

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.$schema).toBe(
			"https://unpkg.com/@its-me-loic/notion-agent-hive@latest/schema.json",
		);
		expect(config.agents).toEqual({
			coordinator: { model: "openai/gpt-5.2" },
			thinker: { model: "openai/gpt-5.4", variant: "xhigh" },
			executor: { model: "kimi-for-coding/k2p5" },
			reviewer: { model: "openai/gpt-5.4", variant: "xhigh" },
		});
	});

	it("does not overwrite existing notion-agent-hive.json", async () => {
		writeFileSync(join(CONFIG_DIR, "notion-agent-hive.json"), JSON.stringify({ custom: true }));

		await install();

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.custom).toBe(true);
	});
});
