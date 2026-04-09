// src/fallback.ts
import packageJson from "../package.json";

interface FallbackEvent {
	type: string;
	properties?: {
		error?: { code?: string };
		agentName?: string;
	};
}

interface FallbackResult {
	agentName: string;
	nextModel: string;
}

const { version } = packageJson;

const AGENT_CHAIN_ALIASES: Record<string, string[]> = {
	coordinator: [`notion agent hive v${version}`],
	thinker: ["notion-thinker-planner", "notion-thinker-investigator", "notion-thinker-refiner"],
	executor: ["notion-executor"],
	reviewer: ["notion-reviewer-feature"],
	finalReviewer: ["notion-reviewer-final"],
	gitCommitArchitect: ["notion-git-commit-architect"],
	prReviewer: ["notion-reviewer-pr"],
};

function normalizeChains(chains: Record<string, string[]>): Record<string, string[]> {
	const normalized: Record<string, string[]> = {};

	for (const [key, chain] of Object.entries(chains)) {
		const aliases = AGENT_CHAIN_ALIASES[key];
		if (!aliases) continue;

		for (const agentName of aliases) {
			normalized[agentName] ??= chain;
		}
	}

	for (const [key, chain] of Object.entries(chains)) {
		if (AGENT_CHAIN_ALIASES[key]) continue;
		normalized[key] = chain;
	}

	return normalized;
}

export class ForegroundFallbackManager {
	private currentIndex: Map<string, number> = new Map();
	private chains: Record<string, string[]>;

	constructor(
		chains: Record<string, string[]>,
		private enabled: boolean,
	) {
		this.chains = normalizeChains(chains);
	}

	async handleEvent(event: FallbackEvent): Promise<FallbackResult | undefined> {
		if (!this.enabled) return undefined;
		if (event.type !== "error") return undefined;
		if (event.properties?.error?.code !== "rate_limit_exceeded") return undefined;

		const agentName = event.properties?.agentName;
		if (!agentName) return undefined;

		const chain = this.chains[agentName];
		if (!chain || chain.length === 0) return undefined;

		const currentIdx = this.currentIndex.get(agentName) ?? 0;
		const nextIdx = currentIdx + 1;

		if (nextIdx >= chain.length) return undefined;

		this.currentIndex.set(agentName, nextIdx);
		return { agentName, nextModel: chain[nextIdx] };
	}

	reset(agentName?: string): void {
		if (agentName) {
			this.currentIndex.delete(agentName);
		} else {
			this.currentIndex.clear();
		}
	}
}
