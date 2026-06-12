#!/usr/bin/env node
// avoid-ai -- Unicode and em-dash scanner
// Usage: node src/scripts/check.js <file>
//        node src/scripts/check.js <file> --fix

const fs   = require("fs");
const path = require("path");

// All target chars as \uXXXX so this file passes the PreToolUse hook.
const CHECKS = [
  // Invisible -- P0
  { code: "\u200B", name: "ZERO-WIDTH SPACE",           severity: "P0", visible: false },
  { code: "\u200C", name: "ZERO-WIDTH NON-JOINER",      severity: "P0", visible: false },
  { code: "\u200D", name: "ZERO-WIDTH JOINER",          severity: "P0", visible: false },
  { code: "\uFEFF", name: "BOM / ZERO-WIDTH NBSP",      severity: "P0", visible: false },
  { code: "\u2060", name: "WORD JOINER",                severity: "P0", visible: false },
  { code: "\u180E", name: "MONGOLIAN VOWEL SEPARATOR",  severity: "P0", visible: false },
  { code: "\u2061", name: "FUNCTION APPLICATION",       severity: "P0", visible: false },
  { code: "\u2062", name: "INVISIBLE TIMES",            severity: "P0", visible: false },
  { code: "\u2064", name: "INVISIBLE PLUS",             severity: "P0", visible: false },
  { code: "\u00A0", name: "NON-BREAKING SPACE",         severity: "P0", visible: false },
  { code: "\u202F", name: "NARROW NO-BREAK SPACE",      severity: "P0", visible: false },
  { code: "\u2007", name: "FIGURE SPACE",               severity: "P0", visible: false },
  { code: "\u00AD", name: "SOFT HYPHEN",                severity: "P1", visible: false },
  // Typographic substitutes -- P1
  { code: "\u2014", name: "EM DASH",                    severity: "P1", visible: true  },
  { code: "\u2013", name: "EN DASH",                    severity: "P1", visible: true  },
  { code: "\u2212", name: "MINUS SIGN",                 severity: "P1", visible: true  },
  { code: "\u2026", name: "ELLIPSIS",                   severity: "P1", visible: true  },
  { code: "\u2019", name: "TYPOGRAPHIC APOSTROPHE",     severity: "P1", visible: true  },
  { code: "\u201C", name: "LEFT DOUBLE QUOTATION MARK", severity: "P1", visible: true  },
  { code: "\u201D", name: "RIGHT DOUBLE QUOTATION MARK",severity: "P1", visible: true  },
];


// Strip markdown non-prose blocks before entropy scoring.
// Code fences, tables, and blockquotes can contain any vocabulary by design --
// counting connectors or measuring length inside them produces false positives.
function stripMarkdownBlocks(src) {
  return src
    .replace(/^```[\s\S]*?^```/gm, "")       // fenced code blocks
    .replace(/^~~~[\s\S]*?^~~~/gm, "")       // tilde code blocks
    .replace(/^[ \t]*\|.*\|[ \t]*$/gm, "")  // table rows (| col | col |)
    .replace(/^[ \t]*>.*$/gm, "")            // blockquotes
    .replace(/^[ \t]{4,}.+$/gm, "")          // indented code (4+ spaces)
    .replace(/`[^`]+`/g, "");               // inline code
}

// Entropy scoring: detects structural uniformity typical of AI text
function entropyScore(src) {
  const prose = stripMarkdownBlocks(src);

  const paras = prose.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
  const sentences = prose.match(/[^.!?]+[.!?]+/g) || [];

  function variance(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
  }

  const paraLengths = paras.map(p => p.length);
  const sentLengths = sentences.map(s => s.trim().length);

  const paraVar   = variance(paraLengths);
  const sentVar   = variance(sentLengths);

  // Common AI connectors
  const connectors = ["moreover", "furthermore", "additionally", "however",
                      "therefore", "thus", "hence", "consequently",
                      "in conclusion", "in summary", "to summarize",
                      "it is worth noting", "it should be noted"];
  const lower = prose.toLowerCase();
  const connectorCount = connectors.reduce((n, c) => n + (lower.split(c).length - 1), 0);

  return { paraVar, sentVar, connectorCount, paraCount: paras.length, sentCount: sentences.length };
}

function entropyFlags(score) {
  const flags = [];
  if (score.paraCount >= 3 && score.paraVar < 200) {
    flags.push("[ENTROPY] Uniform paragraph lengths (variance " + score.paraVar.toFixed(0) + "). Vary structure.");
  }
  if (score.sentCount >= 5 && score.sentVar < 100) {
    flags.push("[ENTROPY] Uniform sentence lengths (variance " + score.sentVar.toFixed(0) + "). Mix short and long.");
  }
  if (score.connectorCount >= 3) {
    flags.push("[ENTROPY] " + score.connectorCount + " AI connector(s) found (moreover/furthermore/etc).");
  }
  return flags;
}

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

// Homoglyph detection: Cyrillic/Greek chars visually identical to Latin
const HOMOGLYPHS = {
  // Cyrillic
  "\u0410": "A", "\u0430": "a",
  "\u0412": "B",
  "\u0421": "C", "\u0441": "c",
  "\u0415": "E", "\u0435": "e",
  "\u041D": "H",
  "\u0406": "I", "\u0456": "i",
  "\u0408": "J",
  "\u041A": "K",
  "\u041C": "M",
  "\u041E": "O", "\u043E": "o",
  "\u0420": "P", "\u0440": "p",
  "\u0455": "s",
  "\u0422": "T",
  "\u0425": "X", "\u0445": "x",
  "\u0443": "y",
  "\u04CF": "l",
  // Greek
  "\u0391": "A", "\u03B1": "a",
  "\u0392": "B",
  "\u0395": "E", "\u03B5": "e",
  "\u039A": "K",
  "\u039C": "M",
  "\u039D": "N", "\u03BD": "v",
  "\u039F": "O", "\u03BF": "o",
  "\u03A1": "P", "\u03C1": "p",
  "\u03A4": "T",
  "\u03A5": "Y", "\u03C5": "u",
  "\u0396": "Z",
  "\u03B9": "i",
};

// Skip homoglyph check when text is predominantly Cyrillic/non-Latin.
// Rationale: a Cyrillic "a" in an English word is a strong AI signal.
// But in Russian text, all Cyrillic is legitimate -- flagging it is a false positive.
// TODO (v2): per-word language detection so mixed-language docs get correct treatment.
// See docs/roadmap.md: "Language-aware filtering".
const cyrillicCount  = (text.match(/[\u0400-\u04FF]/g) || []).length;
const latinCount     = (text.match(/[a-zA-Z]/g) || []).length;
const skipHomoglyphs = cyrillicCount > latinCount;
if (skipHomoglyphs) {
  process.stderr.write("note: homoglyph check skipped (Cyrillic-primary text)\n");
}

// col from indexOf is a UTF-16 code-unit index.
// For reporting we convert to codepoint index via spread (handles surrogate pairs
// from supplementary-plane chars like emoji that appear before the match).
// The while-loop and slice still use the raw UTF-16 col -- indexOf requires it.
function cpCol(line, utf16idx) {
  return [...line.slice(0, utf16idx)].length + 1;
}

if (!skipHomoglyphs) {
  lines.forEach((line, lineIdx) => {
    for (const [cyChar, latinLook] of Object.entries(HOMOGLYPHS)) {
      let col = 0;
      while ((col = line.indexOf(cyChar, col)) !== -1) {
        findings.push({
          line: lineIdx + 1,
          col:  cpCol(line, col),
          severity: "P0",
          name:  "HOMOGLYPH (looks like '" + latinLook + "' U+" + cyChar.codePointAt(0).toString(16).toUpperCase().padStart(4,"0") + ")",
          code:  cyChar,
          context: line.slice(Math.max(0, col - 20), col + 21),
        });
        col++;
      }
    }
  });
}

lines.forEach((line, lineIdx) => {
  CHECKS.forEach(({ code, name, severity }) => {
    let col = 0;
    while ((col = line.indexOf(code, col)) !== -1) {
      findings.push({
        line: lineIdx + 1,
        col:  cpCol(line, col),
        severity,
        name,
        code,
        context: line.slice(Math.max(0, col - 20), col + 21),
      });
      col++;
    }
  });
});

// Run entropy check regardless of Unicode findings
const eScore = entropyScore(text);
const eFlags = entropyFlags(eScore);

if (findings.length === 0 && eFlags.length === 0) {
  console.log("OK: no forbidden characters in", path.basename(filePath));
  if (process.argv.includes("--verbose")) {
    console.log("Entropy: para variance=" + eScore.paraVar.toFixed(0) + " sent variance=" + eScore.sentVar.toFixed(0) + " connectors=" + eScore.connectorCount);
  }
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

if (findings.length > 0) {
  console.log("\nSummary: " + p0.length + " P0 (invisible / homoglyphs)  " + p1.length + " P1 (typographic substitutes)");
}

if (eFlags.length > 0) {
  console.log("\nEntropy warnings:");
  eFlags.forEach(f => console.log("  " + f));
} else if (process.argv.includes("--verbose")) {
  console.log("\nEntropy: para variance=" + eScore.paraVar.toFixed(0) + " sent variance=" + eScore.sentVar.toFixed(0) + " connectors=" + eScore.connectorCount);
}

if (fixMode) {
  // All replacements use keyboard-typeable characters only.
  // Em dash gets space-hyphen-space (clause separator context).
  // En dash and minus sign get plain hyphen.
  // Typographic quotes/apostrophes get ASCII equivalents.
  // Invisible chars are stripped entirely.
  // Homoglyphs are the one exception -- they get a marker because
  // silently substituting a Cyrillic char with Latin could corrupt meaning.
  const REPLACEMENTS = {
    0x2014: " - ",   // em dash -> space-hyphen-space
    0x2013: "-",     // en dash -> hyphen
    0x2212: "-",     // minus sign -> hyphen
    0x2026: "...",   // ellipsis -> three dots
    0x2019: "'",     // typographic apostrophe -> straight apostrophe
    0x201C: "\"",    // left double quote -> straight double quote
    0x201D: "\"",    // right double quote -> straight double quote
  };
  let fixed = text;
  let strippedCount = 0;
  let replacedCount = 0;
  CHECKS.forEach(({ code, visible }) => {
    const cp = code.codePointAt(0);
    if (!visible) {
      const before = fixed.length;
      fixed = fixed.split(code).join("");
      strippedCount += (before - fixed.length);
    } else {
      const replacement = REPLACEMENTS[cp];
      if (replacement) {
        const count = fixed.split(code).length - 1;
        if (count > 0) {
          fixed = fixed.split(code).join(replacement);
          replacedCount += count;
        }
      }
    }
  });
  let homoglyphCount = 0;
  for (const [cyChar, latinLook] of Object.entries(HOMOGLYPHS)) {
    const count = fixed.split(cyChar).length - 1;
    if (count > 0) {
      fixed = fixed.split(cyChar).join("[HOMOGLYPH-" + latinLook.toUpperCase() + ": FIX]");
      homoglyphCount += count;
    }
  }
  const outPath = filePath.replace(/(\.[^.]+)$/, ".fixed$1");
  fs.writeFileSync(outPath, fixed, "utf8");
  console.log("\nFixed file: " + outPath);
  const parts = [];
  if (strippedCount)   parts.push(strippedCount + " invisible char(s) stripped");
  if (replacedCount)   parts.push(replacedCount + " typographic char(s) replaced with keyboard equivalents");
  if (homoglyphCount)  parts.push(homoglyphCount + " homoglyph(s) marked (review manually)");
  console.log(parts.join(", ") + ".");
}

process.exit(findings.length > 0 ? 1 : 0);
