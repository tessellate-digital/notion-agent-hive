export const models = {
  "claude-opus-4.6": "github-copilot/claude-opus-4.6",
  "claude-sonnet-4.6": "github-copilot/claude-sonnet-4.6",
  "claude-haiku-4.5": "github-copilot/claude-haiku-4.5",
  "gpt-5.3-codex": "openai/gpt-5.3-codex",
  "gpt-5.2": "openai/gpt-5.2",
  "gpt-5.4": "openai/gpt-5.4",
  "gpt-5-mini": "github-copilot/gpt-5-mini",
  "kimi-2.5-free": "opencode/kimi-2.5-free",
  k2p5: "kimi-for-coding/k2p5",
  "gemini-3-pro-preview": "google/gemini-3-pro-preview",
  "gemini-3-flash-preview": "google/gemini-3-flash-preview",
} as const;

export type ModelName = keyof typeof models;
