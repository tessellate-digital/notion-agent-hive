#!/usr/bin/env bun
// src/cli/index.ts
import { install } from "./install";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
	switch (command) {
		case "install":
			await install();
			break;
		case "--help":
		case "-h":
		case undefined:
			console.log(`
notion-agent-hive - Notion-powered agent orchestration for OpenCode

Usage:
  notion-agent-hive install    Install plugin into OpenCode config
  notion-agent-hive --help     Show this help message
`);
			break;
		default:
			console.error(`Unknown command: ${command}`);
			process.exit(1);
	}
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
