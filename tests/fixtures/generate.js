#!/usr/bin/env node
// avoid-ai -- fixture generator
// Writes tests/fixtures/golden.txt with known forbidden chars at known byte positions.
// Run to regenerate: node tests/fixtures/generate.js
//
// Layout:
//   line 1: em dash at codepoint col 7
//   line 2: ZWSP at codepoint col 6
//   line 3: NBSP at codepoint col 10
//   line 4: fire emoji + em dash, em dash at codepoint col 7 (emoji counts as 1)
//   line 5: clean, no findings

const fs   = require("fs");
const path = require("path");

const FIXTURE = path.join(__dirname, "golden.txt");

const lines = [
  "hello — world",
  "word ​word",
  "long word here",
  "\u{1F525}text — end",
  "clean line no issues",
];

fs.writeFileSync(FIXTURE, lines.join("\n") + "\n", "utf8");

// Verify codepoint positions match what tests/verify.js asserts.
function cpIdx(line, ch) {
  const utf16 = line.indexOf(ch);
  if (utf16 === -1) throw new Error("char not found in: " + JSON.stringify(line));
  return [...line.slice(0, utf16)].length + 1;
}

const checks = [
  [lines[0], "—", 7,  "line 1: em dash"],
  [lines[1], "​", 6,  "line 2: ZWSP"],
  [lines[2], " ", 10, "line 3: NBSP"],
  [lines[3], "—", 7,  "line 4: em dash after emoji"],
];

let ok = true;
checks.forEach(([line, ch, expected, label]) => {
  const got = cpIdx(line, ch);
  if (got !== expected) {
    console.error("MISMATCH " + label + ": expected col " + expected + ", got " + got);
    ok = false;
  } else {
    console.log("OK  " + label + " -> col " + got);
  }
});

if (!ok) process.exit(1);
console.log("\nWritten: " + FIXTURE);
