import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const demoDirectory = path.resolve(toolsDirectory, "..");
const repositoryDirectory = path.resolve(demoDirectory, "../..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUniqueIds(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert(duplicates.length === 0, `${filePath} has duplicate IDs: ${duplicates.join(", ")}`);
  return ids.length;
}

function assertRelativeReferences(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const baseDirectory = path.dirname(htmlPath);
  const references = [
    ...html.matchAll(/(?:src|href)="\.\/([^"#?]+)(?:[?#][^"]*)?"/g),
  ].map((match) => match[1]);
  const missing = references.filter(
    (reference) => !fs.existsSync(path.resolve(baseDirectory, reference)),
  );
  assert(missing.length === 0, `Missing HTML references: ${missing.join(", ")}`);
  return references.length;
}

const demoHtmlPath = path.join(demoDirectory, "index.html");
const mainHtmlPath = path.join(repositoryDirectory, "index.html");
const mainAppPath = path.join(repositoryDirectory, "app.js");
const timelinePath = path.join(toolsDirectory, "timeline.json");
const outputPath = path.join(demoDirectory, "assets", "output", "comment-reply-demo-en.mp4");
const manifestPath = path.join(demoDirectory, "assets", "output", "workflow-run-en.json");
const planPath = path.join(demoDirectory, "assets", "output", "llm-plan.json");
const voiceoverPath = path.join(demoDirectory, "assets", "library", "voiceover-en-final.wav");
const workflowDataPath = path.join(demoDirectory, "data", "workflow-data.js");

const workflowSource = fs.readFileSync(workflowDataPath, "utf8");
const dataModuleUrl = `${pathToFileURL(workflowDataPath).href}?validate=${Date.now()}`;
await import(dataModuleUrl);
const workflowData = globalThis.COMMENT_VIDEO_WORKFLOW_DATA;
assert(workflowData, "Workflow data did not attach to globalThis.");

const defaultExample = workflowData.examples.find(
  (example) => example.id === workflowData.meta.defaultExampleId,
);
assert(defaultExample, "Default example is missing.");
assert(
  defaultExample.input.product.name === "High-Rise A-Line Denim Midi Skirt",
  "Default product is not synchronized.",
);
assert(defaultExample.output.script.durationSec === 20.8, "Default script duration must be 20.8 seconds.");
assert(
  defaultExample.output.storyboard.length >= 1 && defaultExample.output.storyboard.length <= 8,
  "Default storyboard must contain 1-8 scenes.",
);

const missingExampleAssets = defaultExample.input.assetLibrary
  .map((asset) => asset.file)
  .filter((asset) => !fs.existsSync(path.join(demoDirectory, asset)));
assert(missingExampleAssets.length === 0, `Missing default example assets: ${missingExampleAssets.join(", ")}`);

const timeline = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
assert(
  Array.isArray(timeline.segments) &&
    timeline.segments.length >= 1 &&
    timeline.segments.length <= 8,
  "Timeline must contain 1-8 segments.",
);
const missingTimelineAssets = timeline.segments
  .map((segment) => segment.asset)
  .filter((asset) => !fs.existsSync(path.join(demoDirectory, "assets", "library", asset)));
assert(missingTimelineAssets.length === 0, `Missing timeline assets: ${missingTimelineAssets.join(", ")}`);
assert(timeline.caseId === defaultExample.id, "Timeline caseId does not match the default example.");
assert(
  !timeline.segments.some((segment) => segment.asset === "cta.png"),
  "The four-scene English timeline must not reference cta.png.",
);

const requiredEnglishLines = [
  "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
  "From the front, this sample has a high-rise A-line shape that opens below the hips.",
  "From the side, this sample leaves visible room through the hip area.",
  "The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering.",
];
const requiredEnglishLabels = [
  "HIGH-INTENT COMMENT",
  "PROOF 1 / FRONT",
  "PROOF 2 / SIDE",
  "FABRIC + SIZE CHECK",
];
if (timeline.caseId === "a-line-denim-skirt") {
  assert(timeline.segments.length === requiredEnglishLines.length, "English demo timeline must contain four segments.");
  timeline.segments.forEach((segment, index) => {
    assert(
      segment.subtitle.replace(/\s+/gu, " ").trim() === requiredEnglishLines[index],
      `Timeline subtitle ${index + 1} does not match the approved English line.`,
    );
    assert(
      segment.label === requiredEnglishLabels[index],
      `Timeline label ${index + 1} does not match the approved English label.`,
    );
  });
}

assert(fs.existsSync(planPath), "Validated LLM plan is missing.");
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
assert(plan.caseId === defaultExample.id, "LLM plan caseId does not match the default example.");
assert(plan.model === "doubao-seed-2-0-mini-260428", "Unexpected LLM model in the saved plan.");
assert(
  plan.script?.spokenLines?.length >= 1 && plan.script.spokenLines.length <= 8,
  "LLM plan must contain 1-8 spoken lines.",
);
assert(
  plan.script.spokenLines.length === timeline.segments.length,
  "LLM plan spoken-line count must match timeline segment count.",
);
assert(
  timeline.planProvenance?.caseId === plan.caseId &&
    timeline.planProvenance?.model === plan.model,
  "Timeline provenance does not match the validated LLM plan.",
);

assert(fs.existsSync(voiceoverPath), "Aligned voiceover is missing.");
assert(fs.statSync(voiceoverPath).size > 100_000, "Aligned voiceover is unexpectedly small.");

assert(fs.existsSync(outputPath), "Final MP4 is missing.");
const outputStat = fs.statSync(outputPath);
assert(outputStat.size > 100_000, "Final MP4 is unexpectedly small.");
const header = fs.readFileSync(outputPath).subarray(0, 32).toString("latin1");
assert(header.includes("ftyp"), "Final output does not have an MP4 ftyp header.");

assert(fs.existsSync(manifestPath), "Sanitized workflow run manifest is missing.");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert(manifest.caseId === defaultExample.id, "Run manifest caseId does not match the default example.");
assert(manifest.textPlan?.validation === "passed", "Run manifest does not record a passed LLM plan.");
assert(manifest.security?.apiKeyPersisted === false, "Run manifest security flag is invalid.");
const outputSha256 = crypto
  .createHash("sha256")
  .update(fs.readFileSync(outputPath))
  .digest("hex");
assert(
  manifest.finalVideo?.artifact?.sha256 === outputSha256,
  "Run manifest final-video hash does not match the current MP4.",
);

const mainApp = fs.readFileSync(mainAppPath, "utf8");
assert(mainApp.includes("评论驱动 AIGC 商品视频工作流"), "Main site project entry is missing.");
assert(mainApp.includes("./demos/comment-video/"), "Main site project URL is missing.");

const demoApp = fs.readFileSync(path.join(demoDirectory, "app.js"), "utf8");
const demoHtml = fs.readFileSync(demoHtmlPath, "utf8");
assert(
  demoHtml.includes('data-view-target="brief"') &&
    demoHtml.includes('data-view-target="assets"') &&
    demoHtml.includes('data-view-target="workflow"'),
  "Demo must expose two user tasks and one system-map view.",
);
assert(
  !demoHtml.includes("data-step-target") && !demoHtml.includes("data-step-panel"),
  "Legacy six-step navigation is still present.",
);
assert(
  demoHtml.includes('id="asset-upload"') &&
    demoHtml.includes('accept="image/*,video/*"') &&
    demoApp.includes("URL.createObjectURL"),
  "Local image/video upload support is missing.",
);
assert(
  (demoHtml.match(/data-node="/g) || []).length === 10 &&
    demoApp.includes("const workflowNodes"),
  "End-to-end workflow map must contain ten inspectable nodes.",
);
assert(
  !workflowSource.includes("走动时不会整片粘腿"),
  "Static fallback still contains the rejected unsupported movement claim.",
);

const result = {
  mainHtmlIds: assertUniqueIds(mainHtmlPath),
  demoHtmlIds: assertUniqueIds(demoHtmlPath),
  demoRelativeReferences: assertRelativeReferences(demoHtmlPath),
  defaultExampleId: defaultExample.id,
  defaultAssets: defaultExample.input.assetLibrary.length,
  durationSeconds:
    timeline.segments.reduce((sum, segment) => sum + segment.duration, 0) -
    timeline.transitionSeconds * (timeline.segments.length - 1),
  segmentCount: timeline.segments.length,
  planModel: plan.model,
  voiceoverBytes: fs.statSync(voiceoverPath).size,
  outputBytes: outputStat.size,
  outputSha256,
};

console.log(JSON.stringify(result, null, 2));
