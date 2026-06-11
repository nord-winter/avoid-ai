#!/usr/bin/env node
// avoid-ai -- Unicode and em-dash scanner
// Usage: node src/scripts/check.js <file>
//        node src/scripts/check.js <file> --fix

const fs   = require("fs");
const path = require("path");

// All target chars as \uXXXX so this file passes the PreToolUse hook.
const CHECKS = [
  { code: "\u2014", name: "EM DASH",               severity: "P1", visible: true  },
  { code: "\u00A0", name: "NON-BREAKING SPACE",     severity: "P0", visible: false },
  { code: "\u202F", name: "NARROW NO-BREAK SPACE",  severity: "P0", visible: false },
  { code: "\u2007", name: "FIGURE SPACE",           severity: "P0", visible: false },
  { code: "\u200B", name: "ZERO-WIDTH SPACE",       severity: "P0", visible: false },
  { code: "\u200C", name: "ZERO-WIDTH NON-JOINER",  severity: "P0", visible: false },
  { code: "\u200D", name: "ZERO-WIDTH JOINER",      severity: "P0", visible: false },
  { code: "\uFEFF", name: "BOM / ZERO-WIDTH NBSP",  severity: "P0", visible: false },
  { code: "\u00AD", name: "SOFT HYPHEN",            severity: "P1", visible: false },
];

const filePath = process.argv[2];
const fixMode  = process.argv.includes("--fix");

if (!filePath) {
  console.error("Usage: node check.js <file> [--fix]");
  process.exit(1);
}

let text;
try {
  text = fs.readFileSync(filePath, "utf8");
} catch (e) {
  console.error("Cannot read file:", e.message);
  process.exit(1);
}

const lines    = text.split("\n");
const findings = [];

lines.forEach((line, lineIdx) => {
  CHECKS.forEach(({ code, name, severity }) => {
    let col = 0;
    while ((col = line.indexOf(code, col)) !== -1) {
      findings.push({
        line: lineIdx + 1,
        col:  col + 1,
        severity,
        name,
        code,
        context: line.slice(Math.max(0, col - 20), col + 21),
      });
      col++;
    }
  });
});

if (findings.length === 0) {
  console.log("OK: no forbidden characters in", path.basename(filePath));
  process.exit(0);
}

const p0 = findings.filter(f => f.severity === "P0");
const p1 = findings.filter(f => f.severity === "P1");

function sanitizeCtx(str) {
  let out = "";
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp === 0x2014)                                    { out += "[EMDASH]"; }
    else if ([0x200B,0x200C,0x200D,0xFEFF,0x00AD].includes(cp)) { out += "[?]"; }
    else if ([0x00A0,0x202F,0x2007].includes(cp))         { out += "[_]"; }
    else { out += ch; }
  }
  return out;
}

findings.forEach(f => {
  const hex = f.code.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  console.log("[" + f.severity + "] line " + f.line + ":" + f.col + "  U+" + hex + " " + f.name);
  console.log("       ..." + sanitizeCtx(f.context) + "...");
});

console.log("\nSummary: " + p0.length + " P0 (invisible Unicode)  " + p1.length + " P1 (em dash / soft hyphen)");

if (fixMode) {
  let fixed = text;
  CHECKS.forEach(({ code, visible }) => {
    if (!visible) {
      fixed = fixed.split(code).join("");
    } else if (code === "\u2014") {
      fixed = fixed.split(code).join("[EM-DASH: FIX MANUALLY]");
    }
  });
  const outPath = filePath.replace(/(\.[^.]+)$/, ".fixed$1");
  fs.writeFileSync(outPath, fixed, "utf8");
  console.log("\nFixed file: " + outPath);
  console.log("Invisible chars stripped. Em dashes marked [EM-DASH: FIX MANUALLY].");
}

process.exit(findings.length > 0 ? 1 : 0);
