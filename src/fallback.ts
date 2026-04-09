// src/fallback.ts

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

export class ForegroundFallbackManager {
  private currentIndex: Map<string, number> = new Map();

  constructor(
    private chains: Record<string, string[]>,
    private enabled: boolean,
  ) {}

  async handleEvent(event: FallbackEvent): Promise<FallbackResult | undefined> {
    if (!this.enabled) return undefined;
    if (event.type !== "error") return undefined;
    if (event.properties?.error?.code !== "rate_limit_exceeded")
      return undefined;

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
