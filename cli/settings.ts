#!/usr/bin/env bun
/**
 * cli/settings.ts — View and update buddy settings
 *
 * Usage:
 *   bun run settings                Show current settings
 *   bun run settings cooldown 0     Set comment cooldown (0-300 seconds)
 */

import { loadConfig, saveConfig } from "../server/state.ts";

const args = process.argv.slice(2);
const key = args[0];
const value = args[1];

if (!key) {
  const cfg = loadConfig();
  console.log(`
  claude-buddy settings
  ─────────────────────
  Comment cooldown:  ${cfg.commentCooldown}s    (0 = no throttling, default 30)

  Change:  bun run settings cooldown <seconds>
`);
  process.exit(0);
}

if (key === "cooldown") {
  if (value === undefined) {
    const cfg = loadConfig();
    console.log(`Comment cooldown: ${cfg.commentCooldown}s`);
    process.exit(0);
  }

  const n = parseInt(value, 10);
  if (isNaN(n) || n < 0 || n > 300) {
    console.error("Error: cooldown must be 0-300 (seconds)");
    process.exit(1);
  }

  const cfg = saveConfig({ commentCooldown: n });
  console.log(`Updated: comment cooldown → ${cfg.commentCooldown}s`);
  process.exit(0);
}

console.error(`Unknown setting: ${key}`);
console.error("Available: cooldown");
process.exit(1);
