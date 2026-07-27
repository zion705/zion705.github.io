(() => {
  "use strict";

  const dataset = window.COMMENT_VIDEO_WORKFLOW_DATA || {};
  const example = Array.isArray(dataset.examples) ? dataset.examples[0] : null;

  const fallback = {
    comment:
      "Does this skirt really not emphasize the hips on a pear-shaped body? The model photos don’t show it clearly.",
    merchant:
      "This recurring fit question is blocking purchase decisions. Acknowledge that model photos do not answer every fit question. Show the high-rise A-line shape from the front, visible room through the hip area from the side, and the fabric structure. Ask shoppers to check the size chart by waist. Do not promise the same result for every pear-shaped body or invent measurements.",
    product: "High-Rise A-Line Denim Midi Skirt",
    lines: [
      {
        startSec: 0,
        endSec: 5.2,
        text: "Pear-shaped and worried this skirt will emphasize your hips? Let’s check the actual fit.",
        purpose: "State the concern and promise visible evidence",
      },
      {
        startSec: 5.2,
        endSec: 10.4,
        text: "From the front, this sample has a high-rise A-line shape that opens below the hips.",
        purpose: "Show the front-view shape",
      },
      {
        startSec: 10.4,
        endSec: 15.6,
        text: "From the side, this sample leaves visible room through the hip area.",
        purpose: "Show the side-view room through the hips",
      },
      {
        startSec: 15.6,
        endSec: 20.8,
        text: "The fabric holds its shape without feeling stiff. Check the size chart by waist before ordering.",
        purpose: "Close with fabric evidence and a sizing action",
      },
    ],
    assets: [
      {
        id: "skirt-a0",
        name: "Generated comment opener",
        file: "assets/library/opener-generated.mp4",
        mediaType: "video",
        duration: 5.2,
        tags: ["AI opener", "Creator"],
        role: "Performance hook",
      },
      {
        id: "skirt-a1",
        name: "Front fit proof",
        file: "assets/library/fit-front.png",
        mediaType: "image",
        duration: 5.2,
        tags: ["Front view", "High rise"],
        role: "Product evidence",
      },
      {
        id: "skirt-a2",
        name: "Side fit proof",
        file: "assets/library/fit-side.png",
        mediaType: "image",
        duration: 5.2,
        tags: ["Side view", "Hip room"],
        role: "Product evidence",
      },
      {
        id: "skirt-a3",
        name: "Fabric detail + size cue",
        file: "assets/library/fabric-detail.png",
        mediaType: "image",
        duration: 5.2,
        tags: ["Fabric", "Size guide"],
        role: "Product evidence",
      },
    ],
  };

  const workflowNodes = {
    query: {
      step: "01",
      mode: "Human input",
      title: "Query + merchant brief",
      summary: "What is the shopper really asking—and what can the merchant prove?",
      tool: "Demo form + normalized case schema",
      input: "Original comment, merchant response goal, product facts, and claim boundaries",
      output: "A normalized case packet for the planner",
      note: "This is the only information the user prepares before generation.",
    },
    plan: {
      step: "02",
      mode: "Actual AI API",
      title: "Generate the video plan",
      summary: "Turn one comment into a complete, evidence-led reply plan.",
      tool: "Doubao Seed 2.0 Mini via POST /v1/chat/completions",
      input: "Case packet + structured system prompt",
      output: "Comment analysis, four-line script, storyboard, asset queries, opener prompt, CTA, and self-evaluation",
      note: "The site replays the saved English adaptation of a completed model run; it does not call the API in the browser.",
    },
    validate: {
      step: "03",
      mode: "Local processing",
      title: "Validate claims and structure",
      summary: "No unsupported claim, broken reference, or off-timeline line passes.",
      tool: "Local schema, fact-ID, asset-ID, and timing rule gate",
      input: "Model plan + fact whitelist + asset library + duration rules",
      output: "Validated plan or actionable repair errors",
      note: "Validation is deterministic and runs before any media generation.",
    },
    assets: {
      step: "04",
      mode: "Human input",
      title: "Match or upload evidence",
      summary: "Reuse approved merchant footage first; add only what the plan is missing.",
      tool: "Local asset metadata matcher + device file picker",
      input: "Asset queries, approved library metadata, and usage rights",
      output: "Selected opener, front, side, and fabric asset IDs",
      note: "This static demo uses local metadata matching, not a production DAM or live vector search.",
    },
    gap: {
      step: "05",
      mode: "Local processing",
      title: "Check the evidence gap",
      summary: "Can every product claim be shown—not just said?",
      tool: "Fact-to-asset coverage rules",
      input: "Script fact IDs + selected assets + supported-fact metadata",
      output: "Ready to produce, or a missing-shot / missing-fact list",
      note: "Missing proof loops back to merchant upload or requires removing the unsupported claim.",
    },
    opener: {
      step: "06A",
      mode: "Actual AI API",
      title: "Generate the comment opener",
      summary: "Generate the performance hook, not the product proof.",
      tool: "Seedance 2.0 Fast via POST /v1/video/generations",
      input: "Five-second 9:16 UGC prompt with an unreadable phone screen",
      output: "opener-generated.mp4",
      note: "The current page plays a pre-generated opener. The exact comment card is added later to avoid generated-text errors.",
    },
    voice: {
      step: "06B",
      mode: "Local processing",
      title: "Create the voiceover",
      summary: "One approved script line becomes one fixed audio slot.",
      tool: "Piper en_US-lessac-medium offline TTS",
      input: "Four exact spoken lines + fixed time ranges",
      output: "Slot-aligned voiceover-en-final.wav",
      note: "Narration is created locally. The original Seedance speech is muted in the final cut.",
    },
    edit: {
      step: "07",
      mode: "Local processing",
      title: "Assemble the cut",
      summary: "Combine one generated hook with three evidence-led product shots.",
      tool: "FFmpeg edit, caption, transition, and audio filters",
      input: "Opener, selected assets, timeline, voiceover, English captions, and BGM",
      output: "A 20.8-second 1080 × 1920 draft",
      note: "Captions match the narration verbatim; music is mixed under the voice and fades at the end.",
    },
    evaluate: {
      step: "08",
      mode: "Local processing",
      title: "Evaluate and gate",
      summary: "Relevance is not enough: factuality and visible evidence are release gates.",
      tool: "Model self-evaluation + deterministic media and data validators",
      input: "Comment, fact whitelist, plan, asset coverage, and rendered artifact",
      output: "Scores, veto results, and pass / revise decision",
      note: "The portfolio shows results from the completed run rather than pretending to run an independent live evaluator.",
    },
    output: {
      step: "09",
      mode: "Static output",
      title: "Publish the artifact",
      summary: "Deliver a reproducible output artifact, not a browser-side generation claim.",
      tool: "Local file pipeline + static portfolio page",
      input: "Passed render + sanitized run manifest",
      output: "comment-reply-demo-en.mp4 + workflow-run-en.json",
      note: "The final MP4 is embedded in the portfolio and can be played without exposing credentials.",
    },
  };

  const byId = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 20 : ms));

  const elements = {
    tabs: [...document.querySelectorAll("[data-view-target]")],
    views: [...document.querySelectorAll("[data-view]")],
    queryForm: byId("query-form"),
    comment: byId("comment-input"),
    merchant: byId("merchant-input"),
    product: byId("product-input"),
    duration: byId("duration-input"),
    commentCount: byId("comment-count"),
    merchantCount: byId("merchant-count"),
    packetComment: byId("packet-comment"),
    packetMerchant: byId("packet-merchant"),
    generateScript: byId("generate-script"),
    scriptResult: byId("script-result"),
    scriptGrid: byId("script-grid"),
    script: byId("script-input"),
    scriptEditState: byId("script-edit-state"),
    restoreScript: byId("restore-script"),
    continueAssets: byId("continue-assets"),
    assetGrid: byId("asset-grid"),
    uploadCard: byId("asset-dropzone"),
    assetUpload: byId("asset-upload"),
    assetSearch: byId("asset-search"),
    selectedCount: byId("selected-count"),
    coverageState: byId("coverage-state"),
    coverageFill: byId("coverage-fill"),
    selectedStack: byId("selected-stack"),
    uploadNote: byId("upload-note"),
    assemblePreview: byId("assemble-preview"),
    videoShell: byId("video-shell"),
    resultVideo: byId("result-video"),
    openWorkflow: byId("open-workflow"),
    flowNodes: [...document.querySelectorAll("[data-node]")],
    inspectorMode: byId("inspector-mode"),
    inspectorStep: byId("inspector-step"),
    inspectorTitle: byId("inspector-title"),
    inspectorSummary: byId("inspector-summary"),
    inspectorTool: byId("inspector-tool"),
    inspectorInput: byId("inspector-input"),
    inspectorOutput: byId("inspector-output"),
    inspectorNote: byId("inspector-note"),
    toast: byId("toast"),
  };

  const inputData = example?.input || {};
  const outputData = example?.output || {};
  const productData = inputData.product || {};
  const briefData = inputData.merchantBrief || {};
  const scriptLines =
    Array.isArray(outputData.script?.spokenLines) && outputData.script.spokenLines.length
      ? outputData.script.spokenLines
      : fallback.lines;

  const assetNameMap = Object.fromEntries(fallback.assets.map((asset) => [asset.id, asset]));
  const sourceAssets =
    Array.isArray(inputData.assetLibrary) && inputData.assetLibrary.length
      ? inputData.assetLibrary.map((asset, index) => {
          const friendly = assetNameMap[asset.id] || {};
          return {
            id: asset.id || `source-${index}`,
            name: friendly.name || asset.description || `Merchant asset ${index + 1}`,
            file: asset.file || friendly.file || "",
            mediaType: asset.type || friendly.mediaType || "image",
            duration: Number(asset.durationSec) || friendly.duration || 5.2,
            tags: friendly.tags || asset.tags?.slice(0, 2) || ["Merchant asset"],
            role: friendly.role || (index === 0 ? "Performance hook" : "Product evidence"),
            local: false,
          };
        })
      : fallback.assets.map((asset) => ({ ...asset, local: false }));

  const state = {
    view: "brief",
    canonicalScript: scriptLines.map((line) => line.text).join("\n\n"),
    assets: sourceAssets,
    selected: new Set(sourceAssets.map((asset) => asset.id)),
    search: "",
    objectUrls: new Map(),
    generated: false,
  };

  function merchantCopy() {
    if (!briefData.whyReply) return fallback.merchant;
    const focus = Array.isArray(briefData.responseFocus)
      ? ` Explain: ${briefData.responseFocus.join("; ")}.`
      : "";
    const avoid = Array.isArray(briefData.mustAvoid)
      ? ` Avoid: ${briefData.mustAvoid.join("; ")}.`
      : "";
    return `${briefData.whyReply}${focus}${avoid}`;
  }

  function setView(viewName, options = {}) {
    state.view = viewName;
    elements.views.forEach((view) => {
      const active = view.dataset.view === viewName;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
    });
    elements.tabs.forEach((tab) => {
      const active = tab.dataset.viewTarget === viewName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (options.focus !== false) {
      const activeView = document.querySelector(`[data-view="${viewName}"]`);
      const heading = activeView?.querySelector("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function updateQueryPacket() {
    const comment = elements.comment.value.trim();
    const merchant = elements.merchant.value.trim();
    elements.commentCount.textContent = String(elements.comment.value.length);
    elements.merchantCount.textContent = String(elements.merchant.value.length);
    elements.packetComment.textContent = comment || "Add the customer’s exact comment.";
    elements.packetMerchant.textContent = merchant || "Add the merchant’s explanation and boundaries.";
  }

  function formatTime(value) {
    return Number(value).toFixed(1).padStart(4, "0");
  }

  function renderScriptCards() {
    elements.scriptGrid.replaceChildren();
    scriptLines.forEach((line, index) => {
      const article = document.createElement("article");
      article.className = "script-card";

      const header = document.createElement("div");
      const scene = document.createElement("span");
      scene.textContent = `SCENE ${String(index + 1).padStart(2, "0")}`;
      const time = document.createElement("strong");
      time.textContent = `${formatTime(line.startSec)}—${formatTime(line.endSec)}s`;
      header.append(scene, time);

      const copy = document.createElement("p");
      copy.textContent = line.text;
      const purpose = document.createElement("small");
      purpose.textContent = line.purpose || "Evidence-led narration";

      article.append(header, copy, purpose);
      elements.scriptGrid.append(article);
    });
  }

  async function generateScript() {
    const comment = elements.comment.value.trim();
    const merchant = elements.merchant.value.trim();
    if (!comment || !merchant) {
      showToast("Add both the original comment and the merchant explanation.");
      (!comment ? elements.comment : elements.merchant).focus();
      return;
    }

    const original = elements.generateScript.innerHTML;
    elements.generateScript.disabled = true;
    elements.generateScript.textContent = "Building query packet…";
    await wait(380);
    elements.generateScript.textContent = "Loading verified plan…";
    await wait(520);

    elements.script.value = state.canonicalScript;
    elements.scriptEditState.textContent = "Matches the verified run";
    renderScriptCards();
    elements.scriptResult.hidden = false;
    state.generated = true;
    elements.generateScript.disabled = false;
    elements.generateScript.innerHTML = original;
    elements.scriptResult.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    showToast("The four-scene script is ready.");
  }

  function createUploadCard() {
    const card = elements.uploadCard;
    card.hidden = false;
    return card;
  }

  function createAssetCard(asset) {
    const wrapper = document.createElement("article");
    wrapper.className = `asset-card-wrap${state.selected.has(asset.id) ? " is-selected" : ""}`;
    wrapper.dataset.assetId = asset.id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "asset-card";
    button.setAttribute("aria-pressed", String(state.selected.has(asset.id)));
    button.setAttribute("aria-label", `${asset.name}. ${state.selected.has(asset.id) ? "Selected" : "Not selected"}.`);

    const visual = document.createElement("div");
    visual.className = "asset-visual";
    if (asset.file) {
      const media =
        asset.mediaType === "video" ? document.createElement("video") : document.createElement("img");
      media.src = asset.file;
      media.alt = asset.mediaType === "image" ? asset.name : "";
      if (media instanceof HTMLVideoElement) {
        media.muted = true;
        media.preload = "metadata";
        media.playsInline = true;
      }
      visual.append(media);
    }

    const selectMark = document.createElement("span");
    selectMark.className = "asset-select-mark";
    selectMark.textContent = state.selected.has(asset.id) ? "✓" : "+";
    visual.append(selectMark);

    const role = document.createElement("span");
    role.className = "asset-role";
    role.textContent = asset.local ? "LOCAL UPLOAD" : asset.role.toUpperCase();
    visual.append(role);

    const copy = document.createElement("div");
    copy.className = "asset-card-copy";
    const name = document.createElement("strong");
    name.textContent = asset.name;
    const tags = document.createElement("p");
    tags.textContent = asset.tags.slice(0, 2).join(" · ");
    copy.append(name, tags);

    button.append(visual, copy);
    button.addEventListener("click", () => {
      if (state.selected.has(asset.id)) state.selected.delete(asset.id);
      else state.selected.add(asset.id);
      renderAssets();
    });

    wrapper.append(button);

    if (asset.local) {
      const remove = document.createElement("button");
      remove.className = "remove-upload";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${asset.name}`);
      remove.addEventListener("click", () => removeLocalAsset(asset.id));
      wrapper.append(remove);
    }

    return wrapper;
  }

  function renderAssets() {
    const query = state.search.trim().toLowerCase();
    const visible = state.assets.filter((asset) => {
      const haystack = `${asset.name} ${asset.tags.join(" ")} ${asset.role}`.toLowerCase();
      return !query || haystack.includes(query);
    });

    elements.assetGrid.replaceChildren(createUploadCard());
    visible.forEach((asset) => elements.assetGrid.append(createAssetCard(asset)));

    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "asset-empty";
      empty.textContent = "No matching footage. Add a local file or try another keyword.";
      elements.assetGrid.append(empty);
    }
    renderCoverage();
  }

  function renderCoverage() {
    const selectedAssets = state.assets.filter((asset) => state.selected.has(asset.id));
    const requiredSlots = 4;
    const covered = Math.min(requiredSlots, selectedAssets.length);
    const percent = (covered / requiredSlots) * 100;

    elements.selectedCount.textContent = `${selectedAssets.length} selected`;
    elements.coverageState.textContent =
      covered === requiredSlots
        ? "All four source slots are covered"
        : `${requiredSlots - covered} source slot${requiredSlots - covered === 1 ? "" : "s"} still open`;
    elements.coverageFill.style.width = `${percent}%`;

    elements.selectedStack.replaceChildren();
    selectedAssets.forEach((asset, index) => {
      const chip = document.createElement("div");
      chip.className = "source-chip";
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = asset.name;
      const small = document.createElement("small");
      small.textContent = asset.local ? "Local session asset" : asset.role;
      copy.append(strong, small);
      chip.append(number, copy);
      elements.selectedStack.append(chip);
    });

    if (!selectedAssets.length) {
      const empty = document.createElement("p");
      empty.className = "stack-empty";
      empty.textContent = "Select at least one source from the library.";
      elements.selectedStack.append(empty);
    }
  }

  function handleAssetFiles(files) {
    const accepted = [...files].filter((file) => {
      const validType = file.type.startsWith("image/") || file.type.startsWith("video/");
      return validType && file.size <= 100 * 1024 * 1024;
    });

    if (!accepted.length) {
      showToast("Choose an image or video under 100 MB.");
      return;
    }

    accepted.slice(0, 12).forEach((file) => {
      const id =
        typeof crypto.randomUUID === "function"
          ? `local-${crypto.randomUUID()}`
          : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const objectUrl = URL.createObjectURL(file);
      state.objectUrls.set(id, objectUrl);
      state.assets.push({
        id,
        name: file.name,
        file: objectUrl,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
        duration: 3,
        tags: ["Local file", file.type.split("/")[0]],
        role: "Uploaded evidence",
        local: true,
        fileObject: file,
      });
      state.selected.add(id);
    });

    elements.assetUpload.value = "";
    renderAssets();
    elements.uploadNote.textContent = `${accepted.length} local file${accepted.length === 1 ? "" : "s"} added to this session. The files have not left your device.`;
    showToast(`${accepted.length} local file${accepted.length === 1 ? "" : "s"} added.`);
  }

  function removeLocalAsset(id) {
    const asset = state.assets.find((item) => item.id === id);
    if (!asset?.local) return;
    const url = state.objectUrls.get(id);
    if (url) URL.revokeObjectURL(url);
    state.objectUrls.delete(id);
    state.selected.delete(id);
    state.assets = state.assets.filter((item) => item.id !== id);
    renderAssets();
    showToast("Local file removed.");
  }

  function updateInspector(nodeId) {
    const node = workflowNodes[nodeId];
    if (!node) return;
    elements.flowNodes.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.node === nodeId);
    });
    elements.inspectorMode.textContent = node.mode;
    elements.inspectorStep.textContent = node.step;
    elements.inspectorTitle.textContent = node.title;
    elements.inspectorSummary.textContent = node.summary;
    elements.inspectorTool.textContent = node.tool;
    elements.inspectorInput.textContent = node.input;
    elements.inspectorOutput.textContent = node.output;
    elements.inspectorNote.textContent = node.note;
  }

  let toastTimer;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2800);
  }

  function bindEvents() {
    elements.tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => setView(tab.dataset.viewTarget));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const target = elements.tabs[(index + direction + elements.tabs.length) % elements.tabs.length];
        target.focus();
        setView(target.dataset.viewTarget, { focus: false });
      });
    });

    elements.comment.addEventListener("input", updateQueryPacket);
    elements.merchant.addEventListener("input", updateQueryPacket);
    elements.queryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      generateScript();
    });
    elements.script.addEventListener("input", () => {
      elements.scriptEditState.textContent =
        elements.script.value === state.canonicalScript ? "Matches the verified run" : "Edited locally";
    });
    elements.restoreScript.addEventListener("click", () => {
      elements.script.value = state.canonicalScript;
      elements.scriptEditState.textContent = "Matches the verified run";
      showToast("Generated draft restored.");
    });
    elements.continueAssets.addEventListener("click", () => setView("assets"));

    elements.assetSearch.addEventListener("input", () => {
      state.search = elements.assetSearch.value;
      renderAssets();
    });
    elements.assetUpload.addEventListener("change", () => handleAssetFiles(elements.assetUpload.files));
    elements.uploadCard.addEventListener("dragover", (event) => {
      event.preventDefault();
      elements.uploadCard.classList.add("is-dragging");
    });
    elements.uploadCard.addEventListener("dragleave", () => {
      elements.uploadCard.classList.remove("is-dragging");
    });
    elements.uploadCard.addEventListener("drop", (event) => {
      event.preventDefault();
      elements.uploadCard.classList.remove("is-dragging");
      handleAssetFiles(event.dataTransfer.files);
    });

    elements.assemblePreview.addEventListener("click", () => {
      if (!state.selected.size) {
        showToast("Select at least one source before opening the cut.");
        return;
      }
      elements.videoShell.hidden = false;
      elements.videoShell.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
      elements.resultVideo.play().catch(() => {});
    });
    elements.openWorkflow.addEventListener("click", () => setView("workflow"));

    elements.flowNodes.forEach((node) => {
      node.addEventListener("click", () => updateInspector(node.dataset.node));
    });

    window.addEventListener("beforeunload", () => {
      state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    });
  }

  function initialize() {
    elements.comment.value = inputData.userComment || fallback.comment;
    elements.merchant.value = merchantCopy();
    elements.product.value = productData.name || fallback.product;
    elements.duration.value = String(Number(outputData.script?.durationSec) || 20.8);
    elements.script.value = state.canonicalScript;
    updateQueryPacket();
    renderScriptCards();
    renderAssets();
    updateInspector("query");
    bindEvents();
    setView("brief", { focus: false });
  }

  initialize();
})();
