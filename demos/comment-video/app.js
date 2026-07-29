const stageIds = ["stage-1", "stage-2", "stage-3", "stage-4", "stage-5", "stage-6"];
const stageButtons = [...document.querySelectorAll(".rail-step")];
const toast = document.querySelector("#toast");
let unlockedStage = 1;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function scrollToStage(id) {
  document.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function unlock(index, message) {
  unlockedStage = Math.max(unlockedStage, index);
  const section = document.querySelector(`#${stageIds[index]}`);
  section?.classList.remove("is-locked");
  showToast(message);
  setTimeout(() => scrollToStage(stageIds[index]), 220);
}

document.querySelectorAll("[data-scroll-to]").forEach((button) => {
  button.addEventListener("click", () => scrollToStage(button.dataset.scrollTo));
});

stageButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (index > unlockedStage) {
      showToast("Complete the current stage first.");
      return;
    }
    scrollToStage(button.dataset.stageTarget);
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    stageButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.stageTarget === visible.target.id);
    });
  },
  { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.15, 0.35] }
);
stageIds.forEach((id) => observer.observe(document.querySelector(`#${id}`)));

document.querySelector("#reference-upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const video = document.querySelector("#reference-video");
  video.src = URL.createObjectURL(file);
  video.load();
  showToast("Local video loaded. Saved analysis remains for this prototype.");
});

document.querySelector("#brief-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const required = ["comment-input", "response-input", "audience-input", "facts-input"];
  if (required.some((id) => !document.querySelector(`#${id}`).value.trim())) {
    showToast("Complete all four brief fields.");
    return;
  }
  unlock(2, "Creative outline generated from the pattern and merchant brief.");
});

document.querySelector("#approve-outline").addEventListener("click", () => {
  unlock(3, "Outline approved. Select the evidence for each shot.");
});

document.querySelectorAll(".asset-card[data-asset]").forEach((card) => {
  card.addEventListener("click", () => card.classList.toggle("is-selected"));
});

document.querySelector("#asset-upload").addEventListener("change", (event) => {
  const count = event.target.files.length;
  if (count) showToast(`${count} local asset${count > 1 ? "s" : ""} added to this session.`);
});

document.querySelector("#ground-assets").addEventListener("click", () => {
  const selected = document.querySelectorAll(".asset-card.is-selected").length;
  if (selected < 3) {
    showToast("Select at least three proof assets.");
    return;
  }
  unlock(4, "Production script grounded in the selected evidence.");
});

document.querySelector("#render-video").addEventListener("click", () => {
  unlock(5, "Saved demo creative and evaluation loaded.");
});

const evaluation = window.COMMENT_VIDEO_EVALUATION;
if (evaluation) {
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  setText("#evaluation-status", evaluation.verdict.status.replaceAll("-", " "));
  setText("#evaluation-label", evaluation.verdict.label);
  setText(
    "#beat-coverage",
    `${evaluation.templateReplication.beatCoverage.matched} / ${evaluation.templateReplication.beatCoverage.total}`
  );
  setText(
    "#reference-cuts",
    `${evaluation.templateReplication.reference.detectedShotCount} shots`
  );
  setText(
    "#output-segments",
    `${evaluation.templateReplication.output.authoredSegments} segments`
  );
  setText(
    "#missing-beat",
    evaluation.templateReplication.beatCoverage.missingBeats.join(", ")
  );
  setText(
    "#claim-trace",
    `${evaluation.marketingReadiness.productGrounding.tracedClaims} / ${evaluation.marketingReadiness.productGrounding.totalClaims}`
  );
  setText(
    "#forbidden-claims",
    String(evaluation.marketingReadiness.productGrounding.forbiddenPhraseHits.length)
  );
  setText("#technical-gate", evaluation.marketingReadiness.technicalCompliance.gate);
  setText("#dover-status", evaluation.marketingReadiness.ugcQuality.status.replace("-", " "));

  const provenance = document.querySelector("#evaluation-provenance");
  if (provenance) {
    provenance.innerHTML = evaluation.openSourceProvenance
      .map(
        (item) => `
          <a href="${item.url}" target="_blank" rel="noreferrer">
            <b>${item.name}</b>
            <span>${item.role}</span>
            <em>${item.status.replaceAll("-", " ")}</em>
          </a>
        `
      )
      .join("");
  }
}
