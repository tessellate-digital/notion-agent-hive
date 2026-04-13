import { describe, expect, it } from "bun:test";
import PR_RESPONDER_PROMPT from "../src/prompts/pr/responder";
import { PR_RESPOND_TEMPLATE } from "../src/prompts/shared/dispatch-templates";

describe("PR responder prompt", () => {
	it("uses the PR-scoped inline reply endpoint", () => {
		expect(PR_RESPONDER_PROMPT).toContain(
			"/repos/{owner}/{repo}/pulls/{pull_number}/comments/{github_id}/replies",
		);
		expect(PR_RESPONDER_PROMPT).toContain(
			"/repos/{owner}/{repo}/pulls/comments/{github_id}/replies",
		);
	});

	it("parses the repository from PR_URL instead of gh repo view", () => {
		expect(PR_RESPONDER_PROMPT).toContain("Parse `owner`, `repo`, and `pull_number` directly from `PR_URL`.");
		expect(PR_RESPOND_TEMPLATE).toContain("Parse the repo owner and name from PR_URL");
	});

	it("does not allow batching inline reply fallbacks", () => {
		expect(PR_RESPONDER_PROMPT).toContain(
			"Do not batch multiple replies into a single summary comment.",
		);
		expect(PR_RESPOND_TEMPLATE).toContain(
			"Do not collapse replies into a single PR comment.",
		);
	});
});
