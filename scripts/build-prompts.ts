// scripts/build-prompts.ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const PROMPTS_SRC = join(import.meta.dir, "../prompts/src");
const PROMPTS_SHARED = join(import.meta.dir, "../prompts/shared");
const PROMPTS_DIST = join(import.meta.dir, "../prompts/dist");

const INCLUDE_REGEX = /\{\{include:([^}]+)\}\}/g;

function resolveIncludes(content: string, depth = 0): string {
  if (depth > 10) {
    throw new Error("Include depth exceeded 10 - possible circular reference");
  }

  return content.replace(INCLUDE_REGEX, (match, includePath) => {
    const fullPath = join(PROMPTS_SHARED, includePath.trim());
    if (!existsSync(fullPath)) {
      throw new Error(`Missing partial: ${fullPath} (referenced as {{include:${includePath}}})`);
    }
    const partialContent = readFileSync(fullPath, "utf-8");
    return resolveIncludes(partialContent, depth + 1);
  });
}

function build() {
  console.log("Building prompts...");

  // Ensure dist directory exists
  mkdirSync(PROMPTS_DIST, { recursive: true });

  // Check source directory exists
  if (!existsSync(PROMPTS_SRC)) {
    throw new Error(`Source directory not found: ${PROMPTS_SRC}`);
  }

  const files = readdirSync(PROMPTS_SRC).filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.warn("Warning: No .md files found in prompts/src/");
    return;
  }

  for (const file of files) {
    const srcPath = join(PROMPTS_SRC, file);
    const distPath = join(PROMPTS_DIST, file);

    console.log(`  ${file}`);

    const content = readFileSync(srcPath, "utf-8");
    const resolved = resolveIncludes(content);
    writeFileSync(distPath, resolved, "utf-8");
  }

  console.log(`Built ${files.length} prompts to prompts/dist/`);
}

build();
