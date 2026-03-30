import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_MODELS, DEFAULT_VARIANTS, getGlobalConfigDir, loadConfig } from "../src/config";

const TEST_DIR = join(import.meta.dir, ".test-config");
const GLOBAL_DIR = join(TEST_DIR, "global");
const PROJECT_DIR = join(TEST_DIR, "project");

function writeJson(dir: string, name: string, data: unknown) {
	writeFileSync(join(dir, name), JSON.stringify(data));
}

function unsetEnv(name: "OPENCODE_CONFIG_DIR" | "XDG_CONFIG_HOME") {
	Reflect.deleteProperty(process.env, name);
}

describe("loadConfig", () => {
	beforeEach(() => {
		mkdirSync(GLOBAL_DIR, { recursive: true });
		mkdirSync(PROJECT_DIR, { recursive: true });
		process.env.OPENCODE_CONFIG_DIR = GLOBAL_DIR;
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
		unsetEnv("OPENCODE_CONFIG_DIR");
	});

	it("returns empty object when both configs are missing", () => {
		const config = loadConfig(PROJECT_DIR);
		expect(config.agents).toBeUndefined();
		expect(config.fallback).toBeUndefined();
	});

	it("loads project config when only project config exists", () => {
		writeJson(PROJECT_DIR, "notion-agent-hive.json", {
			agents: { thinker: { model: "openai/gpt-5.4" } },
		});
		const config = loadConfig(PROJECT_DIR);
		expect(config.agents?.thinker?.model).toBe("openai/gpt-5.4");
	});

	it("loads global config when only global config exists", () => {
		writeJson(GLOBAL_DIR, "notion-agent-hive.json", {
			agents: { coordinator: { model: "google/gemini-2.5-pro" } },
		});
		const config = loadConfig(PROJECT_DIR);
		expect(config.agents?.coordinator?.model).toBe("google/gemini-2.5-pro");
	});

	it("project config overrides global config per agent key", () => {
		writeJson(GLOBAL_DIR, "notion-agent-hive.json", {
			agents: {
				thinker: { model: "openai/gpt-4o" },
				executor: { model: "openai/gpt-4o" },
			},
		});
		writeJson(PROJECT_DIR, "notion-agent-hive.json", {
			agents: { thinker: { model: "openai/gpt-5.4" } },
		});
		const config = loadConfig(PROJECT_DIR);
		// project overrides thinker
		expect(config.agents?.thinker?.model).toBe("openai/gpt-5.4");
		// global executor survives (not overwritten by project)
		expect(config.agents?.executor?.model).toBe("openai/gpt-4o");
	});

	it("merges fallback chains from both configs", () => {
		writeJson(GLOBAL_DIR, "notion-agent-hive.json", {
			fallback: { enabled: true, chains: { thinker: ["google/gemini-2.5-pro"] } },
		});
		writeJson(PROJECT_DIR, "notion-agent-hive.json", {
			fallback: { chains: { executor: ["anthropic/claude-opus-4"] } },
		});
		const config = loadConfig(PROJECT_DIR);
		expect(config.fallback?.chains?.thinker).toEqual(["google/gemini-2.5-pro"]);
		expect(config.fallback?.chains?.executor).toEqual(["anthropic/claude-opus-4"]);
		expect(config.fallback?.enabled).toBe(true);
	});

	it("supports model arrays for fallback chains", () => {
		writeJson(PROJECT_DIR, "notion-agent-hive.json", {
			agents: { thinker: { model: ["openai/gpt-5.4", "anthropic/claude-opus-4"] } },
		});
		const config = loadConfig(PROJECT_DIR);
		expect(Array.isArray(config.agents?.thinker?.model)).toBe(true);
	});

	it("accepts arbitrary variant strings like xhigh", () => {
		writeJson(PROJECT_DIR, "notion-agent-hive.json", {
			agents: { thinker: { model: "openai/gpt-5.4", variant: "xhigh" } },
		});
		const config = loadConfig(PROJECT_DIR);
		expect(config.agents?.thinker?.variant).toBe("xhigh");
	});

	it("returns empty object on invalid config schema (no throw)", () => {
		writeJson(PROJECT_DIR, "notion-agent-hive.json", { agents: { invalid: 123 } });
		const config = loadConfig(PROJECT_DIR);
		// invalid config is skipped gracefully
		expect(config.agents).toBeUndefined();
	});
});

describe("getGlobalConfigDir", () => {
	afterEach(() => {
		unsetEnv("OPENCODE_CONFIG_DIR");
		unsetEnv("XDG_CONFIG_HOME");
	});

	it("uses OPENCODE_CONFIG_DIR when set", () => {
		process.env.OPENCODE_CONFIG_DIR = "/custom/config";
		expect(getGlobalConfigDir()).toBe("/custom/config");
	});

	it("uses XDG_CONFIG_HOME/opencode when set", () => {
		unsetEnv("OPENCODE_CONFIG_DIR");
		process.env.XDG_CONFIG_HOME = "/xdg/config";
		expect(getGlobalConfigDir()).toBe("/xdg/config/opencode");
	});

	it("falls back to ~/.config/opencode", () => {
		unsetEnv("OPENCODE_CONFIG_DIR");
		unsetEnv("XDG_CONFIG_HOME");
		expect(getGlobalConfigDir()).toMatch(/\.config\/opencode$/);
	});
});

describe("DEFAULT_MODELS", () => {
	it("has defaults for all four agents", () => {
		expect(DEFAULT_MODELS.coordinator).toBeDefined();
		expect(DEFAULT_MODELS.thinker).toBeDefined();
		expect(DEFAULT_MODELS.executor).toBeDefined();
		expect(DEFAULT_MODELS.reviewer).toBeDefined();
	});

	it("uses the expected starter defaults", () => {
		expect(DEFAULT_MODELS.coordinator).toBe("openai/gpt-5.2");
		expect(DEFAULT_MODELS.thinker).toBe("openai/gpt-5.4");
		expect(DEFAULT_MODELS.executor).toBe("kimi-for-coding/k2p5");
		expect(DEFAULT_MODELS.reviewer).toBe("openai/gpt-5.4");
		expect(DEFAULT_VARIANTS.coordinator).toBeUndefined();
		expect(DEFAULT_VARIANTS.thinker).toBe("xhigh");
		expect(DEFAULT_VARIANTS.executor).toBeUndefined();
		expect(DEFAULT_VARIANTS.reviewer).toBe("xhigh");
	});
});
