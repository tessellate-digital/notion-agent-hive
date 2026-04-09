import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { install } from "../src/cli/install";

const TEST_DIR = join(import.meta.dir, ".test-cli");
const CONFIG_DIR = join(TEST_DIR, "config");
const PROJECT_DIR = join(TEST_DIR, "project");
const ORIGINAL_CWD = process.cwd();
const ORIGINAL_OPENCODE_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR;

const MOCK_VERSION = "9.9.9";

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

// Mock package.json before importing install
const originalReadFileSync = readFileSync;
const mockedReadFileSync = Object.assign(
  (path: string, encoding?: string) => {
    if (typeof path === "string" && path.includes("package.json")) {
      return JSON.stringify({
        name: "@tesselate-digital/notion-agent-hive",
        version: MOCK_VERSION,
      });
    }
    return originalReadFileSync(path, encoding as BufferEncoding);
  },
  readFileSync,
);

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
    expect(config.plugin[0]).toMatch(/@tesselate-digital\/notion-agent-hive@\d+\.\d+\.\d+/);
  });

  it("adds plugin to existing opencode.json", async () => {
    writeFileSync(join(CONFIG_DIR, "opencode.json"), JSON.stringify({ plugin: ["other-plugin"] }));

    await install();

    const config = readJson(join(CONFIG_DIR, "opencode.json"));
    expect(config.plugin[1]).toMatch(/@tesselate-digital\/notion-agent-hive@\d+\.\d+\.\d+/);
    expect(config.plugin).toContain("other-plugin");
  });

  it("migrates legacy plugins to plugin", async () => {
    writeFileSync(
      join(CONFIG_DIR, "opencode.json"),
      JSON.stringify({ plugins: ["other-plugin", "notion-agent-hive"] }),
    );

    await install();

    const config = readJson(join(CONFIG_DIR, "opencode.json"));
    expect(config.plugin).toEqual(["other-plugin", "notion-agent-hive"]);
    expect(config.plugins).toBeUndefined();
  });

	it("does not duplicate plugin entry", async () => {
		writeFileSync(
			join(CONFIG_DIR, "opencode.json"),
			JSON.stringify({ plugin: ["@tesselate-digital/notion-agent-hive"] }),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "opencode.json"));
		expect(
			config.plugin.filter((p: string) => p === "@tesselate-digital/notion-agent-hive"),
		).toHaveLength(1);
	});

  it("replaces legacy unscoped plugin entry with the scoped package name", async () => {
    writeFileSync(
      join(CONFIG_DIR, "opencode.json"),
      JSON.stringify({ plugin: ["notion-agent-hive"] }),
    );

    await install();

    const config = readJson(join(CONFIG_DIR, "opencode.json"));
    expect(config.plugin).toEqual(["notion-agent-hive"]);
  });

  it("does not duplicate plugin entry when versioned entry exists", async () => {
    writeFileSync(
      join(CONFIG_DIR, "opencode.json"),
      JSON.stringify({ plugin: ["@tesselate-digital/notion-agent-hive@0.2.0"] }),
    );

    await install();

    const config = readJson(join(CONFIG_DIR, "opencode.json"));
    expect(config.plugin).toHaveLength(1);
    // Should preserve the existing version
    expect(config.plugin[0]).toBe("@tesselate-digital/notion-agent-hive@0.2.0");
  });

  it("removes versioned duplicate when both versioned and unversioned exist", async () => {
    writeFileSync(
      join(CONFIG_DIR, "opencode.json"),
      JSON.stringify({
        plugin: ["@tesselate-digital/notion-agent-hive", "@tesselate-digital/notion-agent-hive@0.1.0"],
      }),
    );

    await install();

    const config = readJson(join(CONFIG_DIR, "opencode.json"));
    const matches = config.plugin.filter(
      (p: string) => p.startsWith("@tesselate-digital/notion-agent-hive"),
    );
    expect(matches).toHaveLength(1);
  });

	it("creates starter notion-agent-hive.json in the global config dir", async () => {
		await install();

		expect(existsSync(join(CONFIG_DIR, "notion-agent-hive.json"))).toBe(true);
		expect(existsSync(join(PROJECT_DIR, "notion-agent-hive.json"))).toBe(false);

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.$schema).toBe(
			"https://unpkg.com/@tesselate-digital/notion-agent-hive@latest/schema.json",
		);
		expect(config.agents).toEqual({
			coordinator: { model: "openai/gpt-5.2" },
			thinker: { model: "openai/gpt-5.4", variant: "xhigh" },
			executor: { model: "kimi-for-coding/k2p5" },
			reviewer: { model: "openai/gpt-5.4", variant: "xhigh" },
			finalReviewer: { model: "openai/gpt-5.4", variant: "xhigh" },
			gitCommitArchitect: { model: "openai/gpt-5.4", variant: "xhigh" },
			prReviewer: { model: "openai/gpt-5.4", variant: "xhigh" },
		});
	});

	it("patches existing notion-agent-hive.json to add missing new agents", async () => {
		writeFileSync(
			join(CONFIG_DIR, "notion-agent-hive.json"),
			JSON.stringify({
				agents: {
					coordinator: { model: "openai/gpt-5.2" },
					thinker: { model: "openai/gpt-5.4", variant: "xhigh" },
					executor: { model: "kimi-for-coding/k2p5" },
					reviewer: { model: "openai/gpt-5.4", variant: "xhigh" },
				},
			}),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.agents.finalReviewer).toEqual({ model: "openai/gpt-5.4", variant: "xhigh" });
		expect(config.agents.gitCommitArchitect).toEqual({ model: "openai/gpt-5.4", variant: "xhigh" });
		expect(config.agents.prReviewer).toEqual({ model: "openai/gpt-5.4", variant: "xhigh" });
		// existing agents are untouched
		expect(config.agents.coordinator).toEqual({ model: "openai/gpt-5.2" });
	});

	it("does not overwrite agents already present in existing notion-agent-hive.json", async () => {
		writeFileSync(
			join(CONFIG_DIR, "notion-agent-hive.json"),
			JSON.stringify({
				agents: {
					finalReviewer: { model: "custom/model" },
					gitCommitArchitect: { model: "custom/model" },
				},
			}),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.agents.finalReviewer.model).toBe("custom/model");
		expect(config.agents.gitCommitArchitect.model).toBe("custom/model");
	});

	it("does not overwrite prReviewer when already present in existing config", async () => {
		writeFileSync(
			join(CONFIG_DIR, "notion-agent-hive.json"),
			JSON.stringify({
				agents: {
					prReviewer: { model: "custom/model" },
				},
			}),
		);

		await install();

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.agents.prReviewer.model).toBe("custom/model");
	});

	it("preserves unrecognized top-level keys when patching", async () => {
		writeFileSync(join(CONFIG_DIR, "notion-agent-hive.json"), JSON.stringify({ custom: true }));

		await install();

		const config = readJson(join(CONFIG_DIR, "notion-agent-hive.json"));
		expect(config.custom).toBe(true);
		expect(config.agents.finalReviewer).toBeDefined();
		expect(config.agents.gitCommitArchitect).toBeDefined();
	});
});
