#!/usr/bin/env node
// Estimate tokens spent in the current Claude Code session by summing the
// `usage` fields from the session transcript JSONL that Claude Code writes to
// ~/.claude/projects/<project>/<session>.jsonl.
//
// Prints a single integer (total tokens) to stdout, or exits non-zero with a
// message on stderr if no transcript/usage can be found — in which case the
// caller should fall back to asking the user for `/cost`.
//
// By default it counts only MESSAGE tokens (input_tokens + output_tokens) — the
// actual prompt + generation — and EXCLUDES cache creation/read overhead. Pass
// --total for the grand total (message + cache creation + cache read), which
// matches what /cost reports.
//
// Usage:
//   node session-tokens.mjs                 # auto-detect current session (message tokens only)
//   node session-tokens.mjs --total         # grand total (includes cache tokens)
//   node session-tokens.mjs <transcript>    # explicit transcript path
//
// Caveat: this reads Claude Code's transcript format, which is an internal
// detail and could change. Treat a failure as "ask the user for /cost".
import { readdirSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const root = join(homedir(), ".claude", "projects");

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

function norm(p) {
  return String(p || "").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

async function firstLineObj(file) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    rl.close();
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }
  return null;
}

async function pickTranscript() {
  const files = walk(root)
    .map((f) => ({ f, m: statSync(f).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (files.length === 0) return null;

  // Prefer the newest transcript whose cwd matches this one; else newest overall.
  const cwd = norm(process.cwd());
  for (const { f } of files) {
    const obj = await firstLineObj(f);
    if (obj && norm(obj.cwd) === cwd) return f;
  }
  return files[0].f;
}

async function sumTokens(file, includeCache) {
  const totals = { input: 0, output: 0, cacheCreate: 0, cacheRead: 0 };
  let seen = false;
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const u = obj?.message?.usage;
    if (u) {
      seen = true;
      totals.input += u.input_tokens || 0;
      totals.output += u.output_tokens || 0;
      totals.cacheCreate += u.cache_creation_input_tokens || 0;
      totals.cacheRead += u.cache_read_input_tokens || 0;
    }
  }
  if (!seen) return null;
  const messageTokens = totals.input + totals.output;
  const total = includeCache ? messageTokens + totals.cacheCreate + totals.cacheRead : messageTokens;
  return { total, totals };
}

const args = process.argv.slice(2);
const includeCache = args.includes("--total");
const pathArg = args.find((a) => !a.startsWith("-"));

const target = pathArg || (await pickTranscript());
if (!target) {
  console.error(`No Claude Code transcripts found under ${root}`);
  process.exit(1);
}
const result = await sumTokens(target, includeCache);
if (result === null) {
  console.error(`No usage data in transcript: ${target}`);
  process.exit(1);
}
// Breakdown to stderr for transparency; the single number to stdout.
const { totals } = result;
console.error(
  `input=${totals.input} output=${totals.output} cacheCreate=${totals.cacheCreate} ` +
    `cacheRead=${totals.cacheRead} → ${includeCache ? "grand total (message + cache)" : "message tokens (input + output)"}`,
);
console.log(result.total);
