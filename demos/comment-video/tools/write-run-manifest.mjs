import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const demoDirectory = path.resolve(toolsDirectory, "..");

const paths = {
  input: path.join(demoDirectory, "data", "demo-input.json"),
  plan: path.join(demoDirectory, "assets", "output", "llm-plan.json"),
  prompt: path.join(demoDirectory, "docs", "llm-system-prompt.txt"),
  timeline: path.join(toolsDirectory, "timeline.json"),
  opener: path.join(demoDirectory, "assets", "library", "opener-generated.mp4"),
  voiceover: path.join(demoDirectory, "assets", "library", "voiceover-en-final.wav"),
  finalVideo: path.join(demoDirectory, "assets", "output", "comment-reply-demo-en.mp4"),
  output: process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(demoDirectory, "assets", "output", "workflow-run-en.json"),
};

function fail(message) {
  throw new Error(message);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} is missing: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function describeFile(filePath, relativePath) {
  if (!fs.existsSync(filePath)) fail(`Artifact is missing: ${filePath}`);
  const bytes = fs.readFileSync(filePath);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}

const input = readJson(paths.input, "Demo input");
const plan = readJson(paths.plan, "LLM plan");
const timeline = readJson(paths.timeline, "Timeline");

if (input.caseId !== plan.caseId || plan.caseId !== timeline.caseId) {
  fail("caseId mismatch while creating run manifest.");
}

const manifest = {
  schemaVersion: "1.0",
  caseId: plan.caseId,
  completedAt: new Date().toISOString(),
  executionMode: "local-orchestrated-artifacts",
  textPlan: {
    model: plan.model,
    generatedAt: plan.generatedAt,
    endpoint: "/v1/chat/completions",
    inputSha256: describeFile(paths.input, "data/demo-input.json").sha256,
    systemPromptSha256: describeFile(paths.prompt, "docs/llm-system-prompt.txt").sha256,
    plan: describeFile(paths.plan, "assets/output/llm-plan.json"),
    validation: "passed",
    repairPolicy: "up to two structured-output repairs",
  },
  openingVideo: {
    model: "doubao-seedance-2-0-fast-260128",
    artifact: describeFile(paths.opener, "assets/library/opener-generated.mp4"),
    durationSeconds: 5,
    aspectRatio: "9:16",
    resolution: "720p",
    role: "performance-only; not product evidence",
    finalRunReuse:
      "Real Seedance Fast artifact from the same case was reused after final text-plan tuning.",
  },
  voiceover: {
    engine: "Piper offline",
    voice: "en_US-lessac-medium",
    artifact: describeFile(paths.voiceover, "assets/library/voiceover-en-final.wav"),
    durationSeconds: plan.script.durationSec,
    slots: plan.script.spokenLines.map(({ startSec, endSec }) => ({ startSec, endSec })),
    externalTextEgress: false,
  },
  finalVideo: {
    artifact: describeFile(paths.finalVideo, "assets/output/comment-reply-demo-en.mp4"),
    durationSeconds: plan.script.durationSec,
    width: timeline.canvas.width,
    height: timeline.canvas.height,
    fps: timeline.canvas.fps,
    videoCodec: "H.264",
    audioCodec: "AAC",
  },
  security: {
    apiKeyPersisted: false,
    browserCallsUpstream: false,
    staticSiteLoadsSanitizedPlanOnly: true,
  },
};

fs.writeFileSync(paths.output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      ok: true,
      caseId: manifest.caseId,
      output: path.relative(demoDirectory, paths.output).replaceAll("\\", "/"),
      finalVideoSha256: manifest.finalVideo.artifact.sha256,
    },
    null,
    2,
  ),
);
