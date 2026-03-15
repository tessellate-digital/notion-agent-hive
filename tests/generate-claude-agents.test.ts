import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputDir = resolve(root, '.claude');
const agentsDir = resolve(outputDir, 'agents');

describe('Claude Agent Generator', () => {
  beforeAll(() => {
    // Run the generator using the same CLI command a maintainer would run
    execSync('npm run generate:claude', { cwd: root, stdio: 'pipe' });
  });

  describe('Generated agent files', () => {
    const agents = ['notion-thinker', 'notion-executor', 'notion-reviewer'];

    it.each(agents)('should generate %s.md', (agentName) => {
      const filePath = resolve(agentsDir, `${agentName}.md`);
      expect(existsSync(filePath)).toBe(true);
    });

    it.each(agents)('should not have unresolved placeholders in %s.md', (agentName) => {
      const filePath = resolve(agentsDir, `${agentName}.md`);
      const content = readFileSync(filePath, 'utf-8');
      const unresolvedPattern = /\{\{[A-Z_]+\}\}/g;
      const matches = content.match(unresolvedPattern);
      expect(matches).toBeNull();
    });

    it.each(agents)('should have frontmatter in %s.md', (agentName) => {
      const filePath = resolve(agentsDir, `${agentName}.md`);
      const content = readFileSync(filePath, 'utf-8');
      expect(content.startsWith('---')).toBe(true);
    });
  });

  describe('INSTALL.md', () => {
    const installPath = resolve(outputDir, 'INSTALL.md');

    it('should exist', () => {
      expect(existsSync(installPath)).toBe(true);
    });

    it('should contain platform-specific destination path (.claude/)', () => {
      const content = readFileSync(installPath, 'utf-8');
      expect(content).toContain('.claude/');
    });

    it('should contain copy-oriented install language', () => {
      const content = readFileSync(installPath, 'utf-8');
      // Check for copy command examples with agents/ subfolder
      expect(content).toMatch(/cp\s+\.claude\/agents\/.*\.md/);
      // Check for installation steps
      expect(content).toMatch(/install/i);
    });

    it('should mention all three agent files', () => {
      const content = readFileSync(installPath, 'utf-8');
      expect(content).toContain('notion-thinker.md');
      expect(content).toContain('notion-executor.md');
      expect(content).toContain('notion-reviewer.md');
    });

    it('should mention Claude platform', () => {
      const content = readFileSync(installPath, 'utf-8');
      expect(content).toMatch(/claude/i);
    });
  });
});
