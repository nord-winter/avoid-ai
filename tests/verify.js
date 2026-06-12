#!/usr/bin/env node
// avoid-ai -- test suite
// Run: node tests/verify.js

const fs      = require("fs");
const os      = require("os");
const path    = require("path");
const { execSync, spawnSync } = require("child_process");

const ROOT    = path.join(__dirname, "..");
const CHECK   = path.join(ROOT, "src/scripts/check.js");
const PREWRITE = path.join(ROOT, "src/hooks/avoid-ai-prewrite.js");
const CONFIG  = path.join(ROOT, "src/hooks/avoid-ai-config.js");
const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), "avoid-ai-test-"));

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log("  PASS  " + label);
    passed++;
  } catch (e) {
    console.log("  FAIL  " + label);
    console.log("        " + e.message);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function tmpFile(name, content) {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

function runCheck(filePath) {
  return spawnSync("node", [CHECK, filePath], { encoding: "utf8" });
}

function runPrewrite(toolName, content) {
  const input = JSON.stringify({
    tool_name: toolName,
    tool_input: toolName === "Write"
      ? { content }
      : toolName === "Edit"
        ? { new_string: content }
        : { edits: [{ new_string: content }] }
  });
  const flagPath = path.join(tmpDir, ".avoid-ai-active");
  fs.writeFileSync(flagPath, "on", "utf8");
  const env = Object.assign({}, process.env, { CLAUDE_CONFIG_DIR: tmpDir });
  return spawnSync("node", [PREWRITE], { input, encoding: "utf8", env });
}

// ── check.js tests ────────────────────────────────────────────────────────

console.log("\ncheck.js");

test("clean file -> exit 0, prints OK", () => {
  const f = tmpFile("clean.md", "Hello world. No issues here.\n");
  const r = runCheck(f);
  assert(r.status === 0, "expected exit 0, got " + r.status);
  assert(r.stdout.includes("OK"), "expected OK in output");
});

test("em dash -> exit 1, P1 finding", () => {
  const f = tmpFile("emdash.md", "Some text \u2014 more text\n");
  const r = runCheck(f);
  assert(r.status === 1, "expected exit 1");
  assert(r.stdout.includes("P1"), "expected P1 in output");
  assert(r.stdout.includes("EM DASH"), "expected EM DASH in output");
});

test("non-breaking space -> exit 1, P0 finding", () => {
  const f = tmpFile("nbsp.md", "Word word\n");
  const r = runCheck(f);
  assert(r.status === 1, "expected exit 1");
  assert(r.stdout.includes("P0"), "expected P0 in output");
  assert(r.stdout.includes("NON-BREAKING"), "expected NON-BREAKING in output");
});

test("zero-width space -> exit 1, P0 finding", () => {
  const f = tmpFile("zwsp.md", "Word​word\n");
  const r = runCheck(f);
  assert(r.status === 1, "expected exit 1");
  assert(r.stdout.includes("U+200B"), "expected U+200B in output");
});

test("correct line:col reported", () => {
  const f = tmpFile("linecol.md", "line1\nline2 \u2014 here\n");
  const r = runCheck(f);
  assert(r.stdout.includes("line 2:7"), "expected line 2:7, got: " + r.stdout);
});

test("multiple findings counted in summary", () => {
  const f = tmpFile("multi.md", "a\u2014b\u2014c\n");
  const r = runCheck(f);
  assert(r.stdout.includes("2 P1"), "expected 2 P1 in summary");
});

test("BOM at start -> P0", () => {
  const f = tmpFile("bom.md", "﻿Hello\n");
  const r = runCheck(f);
  assert(r.stdout.includes("P0"), "expected P0");
  assert(r.stdout.includes("BOM"), "expected BOM label");
});

test("--fix replaces em dash with keyboard hyphen", () => {
  const f = tmpFile("fix.md", "text \u2014 more\n");
  spawnSync("node", [CHECK, f, "--fix"], { encoding: "utf8" });
  const fixed = f.replace(".md", ".fixed.md");
  assert(fs.existsSync(fixed), ".fixed.md not created");
  const content = fs.readFileSync(fixed, "utf8");
  assert(content.includes(" - "), "expected space-hyphen-space replacement");
  assert(!content.includes("\u2014"), "literal em dash still present");
});

test("--fix replaces ellipsis with three dots", () => {
  const f = tmpFile("fix-ellipsis.md", "wait\u2026 and see\n");
  spawnSync("node", [CHECK, f, "--fix"], { encoding: "utf8" });
  const fixed = f.replace(".md", ".fixed.md");
  const content = fs.readFileSync(fixed, "utf8");
  assert(content.includes("..."), "expected ... replacement");
  assert(!content.includes("\u2026"), "literal ellipsis still present");
});

test("--fix strips invisible chars, preserves text", () => {
  const f = tmpFile("fix-invis.md", "hello\u200Bworld\n");
  spawnSync("node", [CHECK, f, "--fix"], { encoding: "utf8" });
  const fixed = f.replace(".md", ".fixed.md");
  const content = fs.readFileSync(fixed, "utf8");
  assert(content.includes("helloworld"), "expected invisible char stripped");
  assert(!content.includes("\u200B"), "zero-width space still present");
});

// ── prewrite hook tests ───────────────────────────────────────────────────

console.log("\nprewrite hook");

test("Write with em dash -> blocked", () => {
  const r = runPrewrite("Write", "hello \u2014 world");
  const out = JSON.parse(r.stdout);
  assert(out.decision === "block", "expected block, got: " + JSON.stringify(out));
});

test("Write without em dash -> approve (exit 0, no block)", () => {
  const r = runPrewrite("Write", "clean content here");
  const out = r.stdout.trim();
  if (out) {
    const parsed = JSON.parse(out);
    assert(parsed.decision !== "block", "got unexpected block");
  }
  assert(r.status === 0, "expected exit 0");
});

test("Edit new_string with em dash -> blocked", () => {
  const r = runPrewrite("Edit", "new \u2014 value");
  const out = JSON.parse(r.stdout);
  assert(out.decision === "block", "expected block");
});

test("MultiEdit with em dash -> blocked", () => {
  const r = runPrewrite("MultiEdit", "text \u2014 here");
  const out = JSON.parse(r.stdout);
  assert(out.decision === "block", "expected block");
});

test("non-Write tool -> approve (exit 0)", () => {
  const input = JSON.stringify({ tool_name: "Bash", tool_input: { command: "echo hi" } });
  const flagPath = path.join(tmpDir, ".avoid-ai-active");
  fs.writeFileSync(flagPath, "on", "utf8");
  const env = Object.assign({}, process.env, { CLAUDE_CONFIG_DIR: tmpDir });
  const r = spawnSync("node", [PREWRITE], { input, encoding: "utf8", env });
  assert(r.status === 0, "expected exit 0 for non-write tool");
  assert(!r.stdout.includes("block"), "should not block non-write tool");
});

test("avoid-ai inactive -> approve even with em dash", () => {
  const flagPath = path.join(tmpDir, ".avoid-ai-active");
  try { fs.unlinkSync(flagPath); } catch (e) {}
  const input = JSON.stringify({ tool_name: "Write", tool_input: { content: "text \u2014 here" } });
  const env = Object.assign({}, process.env, { CLAUDE_CONFIG_DIR: tmpDir });
  const r = spawnSync("node", [PREWRITE], { input, encoding: "utf8", env });
  assert(r.status === 0, "expected exit 0 when inactive");
  assert(!r.stdout.includes("block"), "should not block when inactive");
});

// ── config tests ──────────────────────────────────────────────────────────

console.log("\nconfig");

test("getDefaultMode returns valid mode", () => {
  const { getDefaultMode, VALID_MODES } = require(CONFIG);
  const mode = getDefaultMode();
  assert(VALID_MODES.includes(mode), "invalid mode: " + mode);
});

test("safeWriteFlag + readFlag roundtrip", () => {
  const { safeWriteFlag, readFlag } = require(CONFIG);
  const fp = path.join(tmpDir, ".avoid-ai-test-flag");
  safeWriteFlag(fp, "strict");
  const read = readFlag(fp);
  assert(read === "strict", "expected strict, got " + read);
  fs.unlinkSync(fp);
});

test("readFlag returns null for missing file", () => {
  const { readFlag } = require(CONFIG);
  const fp = path.join(tmpDir, ".nonexistent-flag");
  assert(readFlag(fp) === null, "expected null for missing flag");
});


test("en dash -> P1 finding", () => {
  const f = tmpFile("endash.md", "pages 10–15\n");
  const r = runCheck(f);
  assert(r.status === 1, "expected exit 1");
  assert(r.stdout.includes("EN DASH"), "expected EN DASH");
});

test("ellipsis char -> P1 finding", () => {
  const f = tmpFile("ellipsis.md", "wait…\n");
  const r = runCheck(f);
  assert(r.stdout.includes("ELLIPSIS"), "expected ELLIPSIS");
});

test("typographic apostrophe -> P1 finding", () => {
  const f = tmpFile("apos.md", "don’t\n");
  const r = runCheck(f);
  assert(r.stdout.includes("APOSTROPHE"), "expected APOSTROPHE");
});

test("cyrillic homoglyph in latin text -> P0 finding", () => {
  const f = tmpFile("homo.md", "heоllo\n");
  const r = runCheck(f);
  assert(r.status === 1, "expected exit 1");
  assert(r.stdout.includes("HOMOGLYPH"), "expected HOMOGLYPH");
  assert(r.stdout.includes("P0"), "expected P0 severity");
});

test("word joiner -> P0 finding", () => {
  const f = tmpFile("wj.md", "word⁠joiner\n");
  const r = runCheck(f);
  assert(r.stdout.includes("WORD JOINER"), "expected WORD JOINER");
});

// ── entropy tests ────────────────────────────────────────────────────────

console.log("\nentropy");

test("uniform paragraphs -> ENTROPY warning", () => {
  // 4 paragraphs of nearly identical length
  const body = [
    "This is paragraph one with some content here to fill it out nicely.",
    "This is paragraph two with some content here to fill it out nicely.",
    "This is paragraph three with content here to fill it out just right.",
    "This is paragraph four with some content here to fill it out nicely.",
  ].join("\n\n");
  const f = tmpFile("entropy-para.md", body);
  const r = runCheck(f);
  assert(r.stdout.includes("ENTROPY"), "expected ENTROPY warning for uniform paragraphs: " + r.stdout);
});

test("high connector count -> ENTROPY warning", () => {
  const body = "Moreover this is true. Furthermore it holds. Additionally we note. However it is complex. Therefore we conclude.";
  const f = tmpFile("entropy-connectors.md", body);
  const r = runCheck(f);
  assert(r.stdout.includes("ENTROPY"), "expected ENTROPY warning for connectors: " + r.stdout);
});

test("varied text -> no ENTROPY warning", () => {
  const body = "Short.\n\nThis paragraph is considerably longer and covers much more ground than the first one does, with multiple clauses and ideas.\n\nMedium length paragraph here with a couple of sentences. It rounds things out.";
  const f = tmpFile("entropy-ok.md", body);
  const r = runCheck(f);
  assert(!r.stdout.includes("ENTROPY"), "unexpected ENTROPY warning for varied text");
});

// golden fixture tests
// tests/fixtures/golden.txt is generated by Python with exact byte layout.
// Every line:col assertion here is derived from known codepoint positions,
// not from running the scanner and copying output.
//
// golden.txt layout:
//   line 1: "hello [EM DASH] world"       U+2014 at codepoint col 7
//   line 2: "word [ZWSP]word"             U+200B at codepoint col 6
//   line 3: "long word [NBSP]here"        U+00A0 at codepoint col 10
//   line 4: "[emoji]text [EM DASH] end"   U+2014 at codepoint col 7 (emoji counts as 1)
//   line 5: "clean line no issues"        no findings

console.log("\ngolden fixture");

const GOLDEN = path.join(ROOT, "tests/fixtures/golden.txt");

test("golden: em dash on line 1 at col 7", () => {
  const r = runCheck(GOLDEN);
  assert(r.status === 1, "expected exit 1");
  assert(r.stdout.includes("line 1:7"), "expected line 1:7, got:\n" + r.stdout);
  assert(r.stdout.includes("EM DASH"), "expected EM DASH label");
});

test("golden: ZWSP on line 2 at col 6", () => {
  const r = runCheck(GOLDEN);
  assert(r.stdout.includes("line 2:6"), "expected line 2:6, got:\n" + r.stdout);
  assert(r.stdout.includes("ZERO-WIDTH SPACE"), "expected ZERO-WIDTH SPACE label");
});

test("golden: NBSP on line 3 at col 10", () => {
  const r = runCheck(GOLDEN);
  assert(r.stdout.includes("line 3:10"), "expected line 3:10, got:\n" + r.stdout);
  assert(r.stdout.includes("NON-BREAKING"), "expected NON-BREAKING label");
});

test("golden: em dash on line 4 at codepoint col 7 (emoji before it counts as 1)", () => {
  const r = runCheck(GOLDEN);
  assert(r.stdout.includes("line 4:7"), "expected line 4:7 (codepoint col), got:\n" + r.stdout);
});

test("golden: exactly 4 findings total (line 5 is clean)", () => {
  const r = runCheck(GOLDEN);
  const matches = r.stdout.match(/(\d+) P0.*?(\d+) P1/);
  assert(matches, "summary line not found");
  const total = parseInt(matches[1]) + parseInt(matches[2]);
  assert(total === 4, "expected exactly 4 findings, got " + total);
});

// ── cleanup ───────────────────────────────────────────────────────────────

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log("\n" + passed + " passed  " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
