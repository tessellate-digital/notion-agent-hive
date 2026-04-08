// tests/setup.ts
// Mock prompt files so tests don't require build:prompts to have run
import { mock } from "bun:test";
import * as fs from "node:fs";

const MOCK_PROMPT = "mock prompt content for testing";
const originalReadFileSync = fs.readFileSync;

mock.module("node:fs", () => ({
	existsSync: fs.existsSync,
	mkdirSync: fs.mkdirSync,
	rmSync: fs.rmSync,
	writeFileSync: fs.writeFileSync,
	readdirSync: fs.readdirSync,
	statSync: fs.statSync,
	readFileSync: (path: string, encoding?: string) => {
		if (typeof path === "string" && path.includes("prompts/dist/")) {
			return MOCK_PROMPT;
		}
		return originalReadFileSync(path, encoding as BufferEncoding);
	},
}));
