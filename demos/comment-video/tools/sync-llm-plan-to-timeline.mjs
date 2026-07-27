import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const demoDirectory = path.resolve(toolsDirectory, "..");

function fail(message) {
  throw new Error(message);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} is missing: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON (${filePath}): ${error.message}`);
  }
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requiredFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    fail(`${label} must be a finite number.`);
  }
  return value;
}

function closeEnough(actual, expected, tolerance = 0.6) {
  return Math.abs(actual - expected) <= tolerance;
}

function normalizeSpeech(text) {
  return text.replace(/\s+/gu, "");
}

function wrapCaption(value, label) {
  const clean = requiredString(value, label).replace(/\s+/gu, " ");
  const characters = Array.from(clean);
  const asciiCount = characters.filter((character) => character.codePointAt(0) <= 0x7f).length;
  const isSpaceDelimited = clean.includes(" ") && asciiCount / characters.length > 0.6;
  const maxLines = 3;
  const maxLineLength = isSpaceDelimited ? 35 : 21;

  if (isSpaceDelimited) {
    const lines = [];
    let current = "";
    for (const word of clean.split(" ")) {
      if (Array.from(word).length > maxLineLength) {
        fail(`${label} contains a word too long for the video caption.`);
      }
      const candidate = current ? `${current} ${word}` : word;
      if (Array.from(candidate).length <= maxLineLength) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      fail(`${label} is too long for a ${maxLines}-line English video caption.`);
    }
    return lines.join("\n");
  }

  if (characters.length > maxLineLength * maxLines) {
    fail(`${label} is too long for a ${maxLines}-line video caption.`);
  }
  const lines = [];
  for (let offset = 0; offset < characters.length; offset += maxLineLength) {
    lines.push(characters.slice(offset, offset + maxLineLength).join(""));
  }
  return lines.join("\n");
}

function parseArguments(argv) {
  const defaults = {
    plan: path.join(demoDirectory, "assets", "output", "llm-plan.json"),
    input: path.join(demoDirectory, "data", "demo-input.json"),
    timeline: path.join(toolsDirectory, "timeline.json"),
    checkOnly: false,
  };
  const result = { ...defaults };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check-only") {
      result.checkOnly = true;
      continue;
    }
    const keyMap = {
      "--plan": "plan",
      "--input": "input",
      "--timeline": "timeline",
    };
    const key = keyMap[argument];
    if (!key) {
      fail(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      fail(`${argument} requires a file path.`);
    }
    result[key] = path.resolve(value);
    index += 1;
  }
  return result;
}

const options = parseArguments(process.argv.slice(2));
const plan = readJson(options.plan, "LLM plan");
const input = readJson(options.input, "Demo input");
const timeline = readJson(options.timeline, "Timeline");

const planCaseId = requiredString(plan.caseId, "llm-plan.caseId");
const inputCaseId = requiredString(input.caseId, "demo-input.caseId");
const timelineCaseId = requiredString(timeline.caseId, "timeline.caseId");

if (planCaseId !== inputCaseId || planCaseId !== timelineCaseId) {
  fail(
    `caseId mismatch: llm-plan=${planCaseId}, demo-input=${inputCaseId}, timeline=${timelineCaseId}. ` +
      "Refusing to mix a plan with another case's fixed assets.",
  );
}

const planOutput = plan.output && typeof plan.output === "object" ? plan.output : plan;
const spokenLines = planOutput.script?.spokenLines;
if (!Array.isArray(spokenLines) || spokenLines.length < 1 || spokenLines.length > 8) {
  fail(`llm-plan.script.spokenLines must contain 1-8 items; received ${spokenLines?.length ?? 0}.`);
}
if (!Array.isArray(timeline.segments) || timeline.segments.length < 1 || timeline.segments.length > 8) {
  fail(`timeline.segments must contain 1-8 items; received ${timeline.segments?.length ?? 0}.`);
}
if (spokenLines.length !== timeline.segments.length) {
  fail(
    `Plan/timeline segment mismatch: ${spokenLines.length} spoken lines vs ` +
      `${timeline.segments.length} timeline segments.`,
  );
}

const transitionSeconds = requiredFiniteNumber(
  timeline.transitionSeconds,
  "timeline.transitionSeconds",
);
const expectedDuration =
  timeline.segments.reduce(
    (sum, segment, index) =>
      sum +
      requiredFiniteNumber(segment.duration, `timeline.segments[${index}].duration`),
    0,
  ) -
  transitionSeconds * (timeline.segments.length - 1);
const planDuration = requiredFiniteNumber(
  planOutput.script?.durationSec,
  "llm-plan.script.durationSec",
);
if (!closeEnough(planDuration, expectedDuration, 0.2)) {
  fail(
    `Plan duration ${planDuration}s does not match the fixed timeline duration ${expectedDuration}s.`,
  );
}

let expectedStart = 0;
for (let index = 0; index < spokenLines.length; index += 1) {
  const line = spokenLines[index];
  const expectedEnd =
    expectedStart +
    timeline.segments[index].duration -
    (index < spokenLines.length - 1 ? transitionSeconds : 0);
  const actualStart = requiredFiniteNumber(
    line.startSec,
    `llm-plan.script.spokenLines[${index}].startSec`,
  );
  const actualEnd = requiredFiniteNumber(
    line.endSec,
    `llm-plan.script.spokenLines[${index}].endSec`,
  );
  if (!closeEnough(actualStart, expectedStart) || !closeEnough(actualEnd, expectedEnd)) {
    fail(
      `spokenLines[${index}] timing ${actualStart}-${actualEnd}s does not fit timeline slot ` +
        `${expectedStart.toFixed(1)}-${expectedEnd.toFixed(1)}s.`,
    );
  }
  expectedStart = expectedEnd;
}

const openingPrompt = requiredString(
  planOutput.openingVideoPrompt?.prompt,
  "llm-plan.openingVideoPrompt.prompt",
);
if (openingPrompt.length < 80) {
  fail("llm-plan.openingVideoPrompt.prompt must contain at least 80 characters.");
}
const openingSpokenLine = requiredString(
  planOutput.openingVideoPrompt?.spokenLine,
  "llm-plan.openingVideoPrompt.spokenLine",
);
const firstSpokenLine = requiredString(
  spokenLines[0].text,
  "llm-plan.script.spokenLines[0].text",
);
if (normalizeSpeech(openingSpokenLine) !== normalizeSpeech(firstSpokenLine)) {
  fail("openingVideoPrompt.spokenLine must match spokenLines[0].text.");
}

const ctaSpoken = requiredString(planOutput.cta?.spoken, "llm-plan.cta.spoken");
const finalSpokenLine = requiredString(
  spokenLines.at(-1).text,
  `llm-plan.script.spokenLines[${spokenLines.length - 1}].text`,
);
if (normalizeSpeech(ctaSpoken) !== normalizeSpeech(finalSpokenLine)) {
  fail(`cta.spoken must match spokenLines[${spokenLines.length - 1}].text.`);
}

const originalAssets = timeline.segments.map((segment) =>
  requiredString(segment.asset, `timeline segment ${segment.id ?? "unknown"} asset`),
);
const nextTimeline = {
  ...timeline,
  planProvenance: {
    caseId: planCaseId,
    model: typeof plan.model === "string" ? plan.model : "unknown",
    generatedAt: typeof plan.generatedAt === "string" ? plan.generatedAt : null,
    syncedAt: new Date().toISOString(),
  },
  brief: {
    ...timeline.brief,
    cta: ctaSpoken,
  },
  segments: timeline.segments.map((segment, index) => {
    const line = spokenLines[index];
    return {
      ...segment,
      subtitle: wrapCaption(
        index === spokenLines.length - 1 ? ctaSpoken : line.text,
        `llm-plan.script.spokenLines[${index}].text`,
      ),
      purpose:
        typeof line.purpose === "string" && line.purpose.trim()
          ? line.purpose.trim()
          : segment.purpose,
    };
  }),
};

const nextAssets = nextTimeline.segments.map((segment) => segment.asset);
if (JSON.stringify(nextAssets) !== JSON.stringify(originalAssets)) {
  fail("Internal safety check failed: timeline asset mapping changed.");
}

const result = {
  ok: true,
  checkOnly: options.checkOnly,
  caseId: planCaseId,
  segmentCount: nextTimeline.segments.length,
  durationSeconds: Number(expectedDuration.toFixed(3)),
  assetsPreserved: nextAssets,
  openingPromptCharacters: openingPrompt.length,
};

if (!options.checkOnly) {
  fs.writeFileSync(options.timeline, `${JSON.stringify(nextTimeline, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(result, null, 2));
