import { describe, expect, test } from "bun:test";
import { buildNormalizedPluginEntries } from "./install";

const PACKAGE = "@tesselate-digital/notion-agent-hive";
const PLUGIN_ID = "notion-agent-hive";
const VERSION = "1.2.3";

describe("buildNormalizedPluginEntries", () => {
	test("adds versioned entry on fresh install", () => {
		const result = buildNormalizedPluginEntries([], PACKAGE, PLUGIN_ID, VERSION);
		expect(result).toEqual([`${PACKAGE}@${VERSION}`]);
	});

	test("updates version when package is already declared with an older version", () => {
		const result = buildNormalizedPluginEntries(
			[`${PACKAGE}@0.1.0`],
			PACKAGE,
			PLUGIN_ID,
			VERSION,
		);
		expect(result).toEqual([`${PACKAGE}@${VERSION}`]);
	});

	test("updates version when package is already declared with a newer version", () => {
		const result = buildNormalizedPluginEntries(
			[`${PACKAGE}@99.0.0`],
			PACKAGE,
			PLUGIN_ID,
			VERSION,
		);
		expect(result).toEqual([`${PACKAGE}@${VERSION}`]);
	});

	test("does not double-declare the plugin", () => {
		const result = buildNormalizedPluginEntries(
			[`${PACKAGE}@1.0.0`],
			PACKAGE,
			PLUGIN_ID,
			VERSION,
		);
		const occurrences = result.filter((e) => e.startsWith(PACKAGE));
		expect(occurrences).toHaveLength(1);
	});

	test("preserves other plugins in the list", () => {
		const result = buildNormalizedPluginEntries(
			["some-other-plugin@2.0.0", `${PACKAGE}@0.1.0`],
			PACKAGE,
			PLUGIN_ID,
			VERSION,
		);
		expect(result).toContain("some-other-plugin@2.0.0");
		expect(result).toContain(`${PACKAGE}@${VERSION}`);
		expect(result).toHaveLength(2);
	});

	test("recognises legacy unscoped plugin id without version", () => {
		const result = buildNormalizedPluginEntries(
			[PLUGIN_ID],
			PACKAGE,
			PLUGIN_ID,
			VERSION,
		);
		expect(result).toEqual([`${PACKAGE}@${VERSION}`]);
	});

	test("recognises legacy unscoped plugin id with version", () => {
		const result = buildNormalizedPluginEntries(
			[`${PLUGIN_ID}@0.9.0`],
			PACKAGE,
			PLUGIN_ID,
			VERSION,
		);
		expect(result).toEqual([`${PACKAGE}@${VERSION}`]);
	});
});
