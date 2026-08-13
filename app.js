const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d");
const sceneSection = document.querySelector(".scene-section");
const treeRollVideo = document.querySelector("#treeRollVideo");
const pointer = { x: 0.5, y: 0.52, targetX: 0.5, targetY: 0.52, active: false };
const revealTrail = [];
let width = 0;
let height = 0;
let dpr = 1;
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const scrollMaskCanvas = document.createElement("canvas");
const scrollMaskCtx = scrollMaskCanvas.getContext("2d");
const revealCanvas = document.createElement("canvas");
const revealCtx = revealCanvas.getContext("2d");
// Motion is part of the portfolio's signature experience. Use ?motion=reduce for a quiet fallback.
const requestedMotion = new URLSearchParams(window.location.search).get("motion");
const forceFullMotion = requestedMotion !== "reduce";
if (forceFullMotion) {
  document.documentElement.dataset.motion = "full";
} else {
  delete document.documentElement.dataset.motion;
}
const systemReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroReducedMotion = { matches: systemReducedMotion.matches && !forceFullMotion };
const scrollReveal = {
  target: 0,
  current: 0,
  initialized: false,
  heroExited: false,
  lastTime: 0,
};
const treeRollPlayback = {
  duration: 0,
  metadataReady: false,
  pendingProgress: 0,
};
const dryWood = new Image();
const sproutWood = new Image();
dryWood.src = "./assets/wood-dry.png?v=20260727-tree-roll-cache1";
sproutWood.src = "./assets/wood-sprout.png?v=20260727-tree-roll-cache1";

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  scrollMaskCanvas.width = canvas.width;
  scrollMaskCanvas.height = canvas.height;
  revealCanvas.width = canvas.width;
  revealCanvas.height = canvas.height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scrollMaskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  revealCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initializeScrollReveal();
}

function coverRect(img) {
  const imageRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (canvasRatio > imageRatio) {
    drawHeight = width / imageRatio;
  } else {
    drawWidth = height * imageRatio;
  }
  return {
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
}

function drawImageCover(context, img) {
  if (!img.complete || !img.naturalWidth) return;
  const rect = coverRect(img);
  context.drawImage(img, rect.x, rect.y, rect.width, rect.height);
}

function drawRollingImage(context, img, progress) {
  if (!img.complete || !img.naturalWidth) return;
  const rect = coverRect(img);
  const rollArc = Math.sin(progress * Math.PI);
  const lift = rollArc * height * -0.018;
  const squash = 1 - rollArc * 0.048;
  const verticalOffset = width <= 840
    ? Math.min(46, Math.max(30, height * 0.05))
    : Math.min(72, Math.max(50, height * 0.074));
  context.save();
  context.translate(width * 0.5, height * 0.5 + verticalOffset + lift);
  context.scale(1.002, -squash * 1.002);
  context.drawImage(img, rect.x - width * 0.5, rect.y - height * 0.5, rect.width, rect.height);
  context.restore();
}

function paintRevealMask(time) {
  maskCtx.save();
  maskCtx.globalCompositeOperation = "destination-out";
  maskCtx.fillStyle = pointer.active ? "rgba(0, 0, 0, 0.04)" : "rgba(0, 0, 0, 0.12)";
  maskCtx.fillRect(0, 0, width, height);
  maskCtx.restore();

  if (!pointer.active) return;

  pointer.x += (pointer.targetX - pointer.x) * 0.18;
  pointer.y += (pointer.targetY - pointer.y) * 0.18;

  const x = pointer.x * width;
  const y = pointer.y * height;
  const dx = (pointer.targetX - pointer.x) * width;
  const dy = (pointer.targetY - pointer.y) * height;
  const speed = Math.min(Math.hypot(dx, dy), 80);
  const pulse = Math.sin(time * 0.0034) * 7;
  const radius = Math.min(width, height) * 0.155 + speed * 0.52 + pulse;

  revealTrail.unshift({ x, y, radius, time });
  if (revealTrail.length > 15) revealTrail.pop();

  maskCtx.save();
  maskCtx.globalCompositeOperation = "source-over";

  revealTrail.forEach((point, index) => {
    const age = index / revealTrail.length;
    const alpha = Math.max(0, 1 - age * 1.1);
    const trailRadius = point.radius * (1 - age * 0.32);
    const outer = maskCtx.createRadialGradient(point.x, point.y, trailRadius * 0.05, point.x, point.y, trailRadius);
    outer.addColorStop(0, `rgba(255,255,255,${0.9 * alpha})`);
    outer.addColorStop(0.28, `rgba(255,255,255,${0.66 * alpha})`);
    outer.addColorStop(0.62, `rgba(255,255,255,${0.22 * alpha})`);
    outer.addColorStop(1, "rgba(255,255,255,0)");
    maskCtx.fillStyle = outer;
    maskCtx.beginPath();
    maskCtx.ellipse(
      point.x,
      point.y,
      trailRadius * (1.08 + speed / 360),
      trailRadius * 0.78,
      Math.atan2(dy, dx || 0.001) * 0.18,
      0,
      Math.PI * 2
    );
    maskCtx.fill();
  });

  for (let i = 0; i < 7; i += 1) {
    const angle = time * 0.0013 + i * 1.71;
    const offset = radius * (0.16 + (i % 3) * 0.08);
    const sx = x + Math.cos(angle) * offset;
    const sy = y + Math.sin(angle * 1.23) * offset * 0.48;
    const small = radius * (0.18 + (i % 2) * 0.06);
    const g = maskCtx.createRadialGradient(sx, sy, 0, sx, sy, small);
    g.addColorStop(0, "rgba(255,255,255,0.34)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    maskCtx.fillStyle = g;
    maskCtx.beginPath();
    maskCtx.arc(sx, sy, small, 0, Math.PI * 2);
    maskCtx.fill();
  }

  maskCtx.restore();
}

function clampRevealProgress(value) {
  return Math.min(1, Math.max(0, value));
}

function isScrollRevealComplete() {
  return scrollReveal.target >= 0.9995 && scrollReveal.current >= 0.9995;
}

function treeRollEndTime() {
  const duration = treeRollPlayback.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.max(0, duration - Math.min(1 / 60, duration * 0.0035));
}

function syncTreeRollVideo(progress, force = false) {
  if (!treeRollVideo) return;
  const normalized = clampRevealProgress(progress);
  treeRollPlayback.pendingProgress = normalized;
  if (!treeRollPlayback.metadataReady) return;

  const targetTime = normalized * treeRollEndTime();
  const tolerance = Math.max(1 / 60, treeRollPlayback.duration / 600);
  if (Math.abs(treeRollVideo.currentTime - targetTime) <= tolerance) return;
  if (!force && treeRollVideo.seeking) return;

  try {
    treeRollVideo.currentTime = targetTime;
  } catch {
    // The two-image canvas remains visible until the browser can seek the video.
  }
}

function prepareTreeRollVideo() {
  if (!treeRollVideo) return;
  treeRollVideo.muted = true;
  treeRollVideo.pause();
  treeRollPlayback.duration = treeRollVideo.duration;
  treeRollPlayback.metadataReady = Number.isFinite(treeRollVideo.duration) && treeRollVideo.duration > 0;
  syncTreeRollVideo(treeRollPlayback.pendingProgress, true);
}

treeRollVideo?.addEventListener("loadedmetadata", prepareTreeRollVideo);
treeRollVideo?.addEventListener("loadeddata", () => {
  prepareTreeRollVideo();
  sceneSection.classList.add("is-video-ready");
});
treeRollVideo?.addEventListener("seeked", () => {
  sceneSection.classList.add("is-video-ready");
  syncTreeRollVideo(treeRollPlayback.pendingProgress, true);
});
treeRollVideo?.addEventListener("error", () => {
  sceneSection.classList.remove("is-video-ready");
  treeRollPlayback.metadataReady = false;
});

function publishScrollRevealState() {
  const progress = scrollReveal.current.toFixed(3);
  if (sceneSection.dataset.treeRevealProgress !== progress) {
    sceneSection.dataset.treeRevealProgress = progress;
  }
  sceneSection.style.setProperty("--tree-roll-progress", progress);
  sceneSection.style.setProperty(
    "--tree-roll-end-blend",
    clampRevealProgress((scrollReveal.current - 0.86) / 0.14).toFixed(3)
  );
  sceneSection.classList.toggle("is-tree-rolling", scrollReveal.current > 0.012);
  syncTreeRollVideo(scrollReveal.current);
  sceneSection.toggleAttribute("data-tree-locked", window.scrollY <= 1 && !isScrollRevealComplete());
}

function initializeScrollReveal() {
  if (scrollReveal.initialized) return;
  const deepLink = window.location.hash && !["#", "#index"].includes(window.location.hash);
  const startComplete = heroReducedMotion.matches || window.scrollY > 1 || deepLink;
  scrollReveal.target = startComplete ? 1 : 0;
  scrollReveal.current = scrollReveal.target;
  scrollReveal.heroExited = window.scrollY > 1;
  scrollReveal.initialized = true;
  publishScrollRevealState();
}

function syncScrollRevealWithPage() {
  initializeScrollReveal();
  scrollReveal.heroExited = window.scrollY > 1;
  if (scrollReveal.heroExited) {
    scrollReveal.target = 1;
    scrollReveal.current = 1;
  }
  publishScrollRevealState();
}

function scrollRevealDistance() {
  return Math.max(1080, window.innerHeight * 1.45);
}

function consumeScrollRevealDelta(delta) {
  if (heroReducedMotion.matches || Math.abs(delta) < 0.5 || window.scrollY > 1) return false;

  if (delta > 0 && isScrollRevealComplete()) return false;
  if (delta < 0 && scrollReveal.target <= 0.0005 && scrollReveal.current <= 0.0005) return false;

  const directionalDelta = delta < 0 ? delta * 2.25 : delta;
  const nextTarget = scrollReveal.target + directionalDelta / scrollRevealDistance();
  scrollReveal.target = clampRevealProgress(delta < 0 && nextTarget < 0.055 ? 0 : nextTarget);
  scrollReveal.heroExited = false;
  publishScrollRevealState();
  return true;
}

function advanceScrollReveal(time) {
  if (scrollReveal.heroExited) {
    scrollReveal.current = 1;
    scrollReveal.lastTime = time;
    publishScrollRevealState();
    return;
  }

  if (heroReducedMotion.matches) {
    scrollReveal.current = scrollReveal.target;
    scrollReveal.lastTime = time;
    publishScrollRevealState();
    return;
  }

  const elapsed = scrollReveal.lastTime ? time - scrollReveal.lastTime : 1000 / 60;
  const frameScale = Math.min(2, Math.max(0.25, elapsed / (1000 / 60)));
  const difference = scrollReveal.target - scrollReveal.current;
  const response = difference >= 0 ? 0.13 : 0.22;
  const frameResponse = 1 - Math.pow(1 - response, frameScale);
  scrollReveal.current += difference * frameResponse;

  if (Math.abs(difference) < 0.0005) {
    scrollReveal.current = scrollReveal.target;
  }
  scrollReveal.lastTime = time;
  publishScrollRevealState();
}

function paintScrollRevealMask(time) {
  advanceScrollReveal(time);
  scrollMaskCtx.clearRect(0, 0, width, height);

  const progress = Math.min(1, Math.max(0, scrollReveal.current));
  if (progress <= 0.0001) return;

  if (progress >= 0.9995) {
    scrollMaskCtx.fillStyle = "#fff";
    scrollMaskCtx.fillRect(0, 0, width, height);
    return;
  }

  const frontier = height * (1.12 - progress * 1.24);
  const feather = Math.min(150, Math.max(44, height * 0.12));
  const gradient = scrollMaskCtx.createLinearGradient(0, frontier - feather, 0, frontier + feather);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.42, "rgba(255,255,255,0.16)");
  gradient.addColorStop(0.66, "rgba(255,255,255,0.82)");
  gradient.addColorStop(1, "rgba(255,255,255,1)");
  scrollMaskCtx.fillStyle = gradient;
  scrollMaskCtx.fillRect(0, frontier - feather, width, height - frontier + feather);
}

function combineRevealMasks() {
  scrollMaskCtx.save();
  scrollMaskCtx.globalCompositeOperation = "source-over";
  scrollMaskCtx.drawImage(maskCanvas, 0, 0, width, height);
  scrollMaskCtx.restore();
}

function drawScene(time) {
  ctx.clearRect(0, 0, width, height);

  paintRevealMask(time);
  paintScrollRevealMask(time);
  combineRevealMasks();

  const progress = clampRevealProgress(scrollReveal.current);
  drawRollingImage(ctx, dryWood, progress);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createRadialGradient(width * 0.5, height * 0.5, height * 0.1, width * 0.5, height * 0.52, height * 0.72);
  shade.addColorStop(0, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(225,220,207,0.28)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  revealCtx.clearRect(0, 0, width, height);
  drawRollingImage(revealCtx, sproutWood, progress);
  revealCtx.save();
  revealCtx.globalCompositeOperation = "destination-in";
  revealCtx.drawImage(scrollMaskCanvas, 0, 0, width, height);
  revealCtx.restore();

  ctx.drawImage(revealCanvas, 0, 0, width, height);

  requestAnimationFrame(drawScene);
}

window.addEventListener("resize", resize);
window.addEventListener("scroll", syncScrollRevealWithPage, { passive: true });
window.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey) return;
    let delta = event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= window.innerHeight;
    if (consumeScrollRevealDelta(delta)) event.preventDefault();
  },
  { passive: false }
);

let lastRevealTouchY = null;
window.addEventListener(
  "touchstart",
  (event) => {
    lastRevealTouchY = event.touches[0]?.clientY ?? null;
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (event) => {
    const nextY = event.touches[0]?.clientY;
    if (lastRevealTouchY === null || nextY === undefined) return;
    const delta = lastRevealTouchY - nextY;
    lastRevealTouchY = nextY;
    if (consumeScrollRevealDelta(delta)) event.preventDefault();
  },
  { passive: false }
);
window.addEventListener("touchend", () => {
  lastRevealTouchY = null;
});
window.addEventListener("touchcancel", () => {
  lastRevealTouchY = null;
});
window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, button, a, [contenteditable='true']")) return;

  let delta = 0;
  if (event.key === "ArrowDown") delta = 56;
  if (event.key === "PageDown") delta = window.innerHeight * 0.42;
  if (event.key === " ") delta = (event.shiftKey ? -1 : 1) * window.innerHeight * 0.42;
  if (event.key === "ArrowUp") delta = -56;
  if (event.key === "PageUp") delta = -window.innerHeight * 0.42;
  if (delta && consumeScrollRevealDelta(delta)) event.preventDefault();
});
sceneSection.addEventListener("pointermove", (event) => {
  const rect = sceneSection.getBoundingClientRect();
  pointer.targetX = (event.clientX - rect.left) / rect.width;
  pointer.targetY = (event.clientY - rect.top) / rect.height;
  pointer.active = true;
});
sceneSection.addEventListener("pointerleave", () => {
  pointer.active = false;
  revealTrail.length = 0;
  maskCtx.clearRect(0, 0, width, height);
  revealCtx.clearRect(0, 0, width, height);
});
resize();
Promise.all([
  dryWood.decode().catch(() => undefined),
  sproutWood.decode().catch(() => undefined),
]).then(() => requestAnimationFrame(drawScene));

const ambientCanvas = document.querySelector("#ambientScene");
const ambientCtx = ambientCanvas?.getContext("2d");
if (ambientCanvas && ambientCtx) {
  const ambientMotion = { matches: systemReducedMotion.matches && !forceFullMotion };
  const ambientPointer = { x: 0.5, y: 0.42, targetX: 0.5, targetY: 0.42, strength: 0.28 };
  let ambientWidth = 0;
  let ambientHeight = 0;
  let ambientPixels = null;
  let ambientVisible = true;
  let lastAmbientFrame = 0;

  const resizeAmbient = () => {
    const rect = ambientCanvas.getBoundingClientRect();
    ambientWidth = Math.max(220, Math.round(rect.width * 0.28));
    ambientHeight = Math.max(180, Math.round(rect.height * 0.12));
    if (ambientCanvas.width === ambientWidth && ambientCanvas.height === ambientHeight) return;
    ambientCanvas.width = ambientWidth;
    ambientCanvas.height = ambientHeight;
    ambientPixels = ambientCtx.createImageData(ambientWidth, ambientHeight);
  };

  const drawAmbient = (time = 0) => {
    if (!ambientVisible || !ambientPixels) {
      if (!ambientMotion.matches) requestAnimationFrame(drawAmbient);
      return;
    }
    if (!ambientMotion.matches && time - lastAmbientFrame < 30) {
      requestAnimationFrame(drawAmbient);
      return;
    }
    lastAmbientFrame = time;
    ambientPointer.x += (ambientPointer.targetX - ambientPointer.x) * 0.055;
    ambientPointer.y += (ambientPointer.targetY - ambientPointer.y) * 0.055;
    ambientPointer.strength += (0.28 - ambientPointer.strength) * 0.028;

    const phase = time * 0.00102;
    const pixels = ambientPixels.data;
    for (let y = 0; y < ambientHeight; y += 1) {
      const v = y / Math.max(ambientHeight - 1, 1);
      for (let x = 0; x < ambientWidth; x += 1) {
        const u = x / Math.max(ambientWidth - 1, 1);
        const dx = u - ambientPointer.x;
        const dy = v - ambientPointer.y;
        const distance = Math.hypot(dx, dy);
        const pointerShift = Math.exp(-(dx * dx + dy * dy) * 12) * ambientPointer.strength;
        const pointerWake = Math.sin(distance * 42 - phase * 9.2) * Math.exp(-distance * 6.8) * ambientPointer.strength;
        const waterU = u + Math.sin(v * 8.2 + phase * 1.3) * 0.068 + dx * pointerShift * 0.12;
        const waterV = v + Math.cos(u * 7.4 - phase) * 0.062 + dy * pointerShift * 0.12;
        const swell =
          Math.sin(waterU * 9.5 + phase * 1.2) * 0.34 +
          Math.cos(waterV * 8.6 - phase * 0.82) * 0.31 +
          Math.sin((waterU + waterV) * 6.8 + phase * 0.55) * 0.23 +
          Math.cos((waterU - waterV) * 5.4 - phase * 0.7) * 0.12 +
          pointerWake * 0.56;
        const ripple = Math.sin(waterU * 19 + phase * 2.3) * Math.cos(waterV * 16 - phase * 1.85) + pointerWake * 0.42;
        const caustic = Math.pow(Math.max(0, 1 - Math.abs(ripple)), 3);
        const light = Math.min(1, Math.max(0, 0.48 + swell * 0.48 + caustic * 0.42));
        const warmth = 0.5 + 0.5 * Math.sin(waterU * 4.2 - waterV * 3.1 + phase * 0.35);
        const index = (y * ambientWidth + x) * 4;
        pixels[index] = Math.round(93 + warmth * 43 + light * 34 + caustic * 30);
        pixels[index + 1] = Math.round(128 + (1 - warmth) * 30 + light * 42 + caustic * 26);
        pixels[index + 2] = Math.round(83 + (1 - warmth) * 34 + light * 28 + caustic * 18);
        pixels[index + 3] = Math.round(76 + light * 104 + caustic * 58);
      }
    }
    ambientCtx.putImageData(ambientPixels, 0, 0);
    if (!ambientMotion.matches) requestAnimationFrame(drawAmbient);
  };

  window.addEventListener("resize", resizeAmbient);
  if ("ResizeObserver" in window) new ResizeObserver(resizeAmbient).observe(ambientCanvas.parentElement);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        ambientVisible = entry.isIntersecting;
      },
      { rootMargin: "220px 0px" }
    ).observe(ambientCanvas.parentElement);
  }
  window.addEventListener(
    "pointermove",
    (event) => {
      const rect = ambientCanvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const y = (event.clientY - rect.top) / Math.max(rect.height, 1);
      const velocity = Math.hypot(x - ambientPointer.targetX, y - ambientPointer.targetY);
      ambientPointer.targetX = Math.min(1, Math.max(0, x));
      ambientPointer.targetY = Math.min(1, Math.max(0, y));
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        ambientPointer.strength = Math.min(1.55, Math.max(0.82, 0.72 + velocity * 9));
      }
    },
    { passive: true }
  );
  window.addEventListener("pointerleave", () => {
    ambientPointer.targetX = 0.5;
    ambientPointer.targetY = 0.42;
  });
  resizeAmbient();
 …12031 tokens truncated…
    ? `<div class="modal-links">${data.links
        .map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`)
        .join("")}</div>`
    : "";
  modalBody.innerHTML = `${intro}${tags}${highlights}${links}${points}${demoEntry}${documentViewer}${gallery}`;
  if (!experienceModal.open) experienceModal.showModal();
  const sheet = experienceModal.querySelector(".experience-sheet");
  if (sheet) sheet.scrollTop = 0;
  const pdfReader = modalBody.querySelector("[data-pdf-reader]");
  if (pdfReader) renderPdfPreview(pdfReader);
  syncDialogState();
}

function openExperience(key, trigger) {
  if (!experiences[key]) return;
  lastExperienceTrigger = trigger || lastExperienceTrigger;
  const fallbackPortalKey = ["nearu", "wakeargue"].includes(key) ? "projects" : key === "design" ? "early" : "work";
  const portalKey = activePortalKey || history.state?.portalKey || fallbackPortalKey;
  const parentHash = fallbackPortalKey === "work" ? "#work" : `#experience-${portalKey}`;
  if (window.location.hash !== parentHash) {
    history.replaceState(fallbackPortalKey === "work" ? null : { portalKey }, "", parentHash);
  }
  history.pushState({ portalKey, experienceKey: key }, "", `#detail-${key}`);
  showExperience(key);
}

function closeExperienceModal({ restoreFocus = false } = {}) {
  const trigger = lastExperienceTrigger;
  if (experienceModal.open) experienceModal.close();
  syncDialogState();
  if (restoreFocus && trigger?.isConnected) {
    requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
  }
}

function requestExperienceClose() {
  if (history.state?.experienceKey) {
    history.back();
    return;
  }
  const key = window.location.hash.match(/^#detail-(xiaomi|baidu|buding|nearu|telestudio|wakeargue|design)$/)?.[1];
  if (key) {
    if (["xiaomi", "telestudio", "baidu", "buding"].includes(key)) {
      history.replaceState(null, "", "#work");
      closeExperienceModal({ restoreFocus: true });
      document.querySelector("#work")?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    const portalKey = ["nearu", "wakeargue"].includes(key) ? "projects" : key === "design" ? "early" : "work";
    history.replaceState({ portalKey }, "", `#experience-${portalKey}`);
    closeExperienceModal({ restoreFocus: true });
    renderPortalPanel(portalKey, { focus: true, scroll: true });
    return;
  }
  closeExperienceModal({ restoreFocus: true });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-experience]");
  if (button) {
    event.preventDefault();
    openExperience(button.dataset.experience, button);
  }
});
closeExperience.addEventListener("click", requestExperienceClose);
experienceModal.addEventListener("click", (event) => {
  if (event.target === experienceModal) requestExperienceClose();
});
experienceModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  requestExperienceClose();
});
experienceModal.addEventListener("close", () => {
  stopPdfPreview();
  syncDialogState();
});

const controls = [...document.querySelectorAll("[data-control]")];
const scoreEl = document.querySelector("#score");
const moodEl = document.querySelector("#mood");
function updateTuner() {
  if (!controls.length || !scoreEl || !moodEl) return;
  const values = Object.fromEntries(controls.map((control) => [control.dataset.control, Number(control.value)]));
  const score = Math.round(values.visibility * 0.42 + values.recovery * 0.42 + (100 - values.interrupt) * 0.16);
  scoreEl.textContent = score;
  document.documentElement.style.setProperty("--glow", 28 + values.visibility * 0.72);
  if (score > 82) moodEl.textContent = "Calm, visible, recoverable";
  else if (values.interrupt > 64) moodEl.textContent = "Too noisy";
  else if (values.visibility < 46) moodEl.textContent = "Invisible work";
  else moodEl.textContent = "Needs clearer recovery";
}
controls.forEach((control) => control.addEventListener("input", updateTuner));
updateTuner();

const messageStorageKey = "liuwanzheng-portfolio-message-cache-v2";
const portfolioConfig = window.PORTFOLIO_CONFIG || {};
const supabaseUrl = String(portfolioConfig.supabaseUrl || "").replace(/\/+$/, "");
const supabaseAnonKey = String(portfolioConfig.supabaseAnonKey || "").trim();
const sharedMessagesEnabled = (() => {
  try {
    return new URL(supabaseUrl).protocol === "https:" && supabaseAnonKey.length > 20;
  } catch {
    return false;
  }
})();
const defaultMessages = [
  {
    name: "Yilin",
    message: "这个树枝发芽的首页很有记忆点，像是把技术作品集做成了一个可触摸的隐喻。",
    createdAt: "2026-07-05T10:20:00.000Z"
  },
  {
    name: "Chen",
    message: "喜欢你把模型评测写成产品语言的方式，信息结构比普通简历更容易理解。",
    createdAt: "2026-07-04T15:42:00.000Z"
  },
  {
    name: "Mia",
    message: "经历入口的线性索引很清楚，期待后面看到更多 AI 产品复盘。",
    createdAt: "2026-07-03T08:16:00.000Z"
  },
  {
    name: "Lin",
    message: "从用户问题讲到评测口径，这种项目表达比功能清单更有说服力。",
    createdAt: "2026-06-28T12:30:00.000Z"
  },
  {
    name: "Aaron",
    message: "首页的生命力隐喻很漂亮，也让技术和设计之间的关系更具体了。",
    createdAt: "2026-06-23T09:05:00.000Z"
  },
  {
    name: "Shirley",
    message: "很喜欢这里克制的绿色。项目详情如果继续补充过程图，会更完整。",
    createdAt: "2026-06-18T14:48:00.000Z"
  }
];
const messageList = document.querySelector("#messageList");
const messageDialog = document.querySelector("#messageDialog");
const messageForm = document.querySelector("#messageForm");
const openMessageDialog = document.querySelector("#openMessageDialog");
const closeMessageDialog = document.querySelector("#closeMessageDialog");
const messageName = document.querySelector("#messageName");
const messageText = document.querySelector("#messageText");
const messageCount = document.querySelector("#messageCount");
const messageWebsite = document.querySelector("#messageWebsite");
const messageError = document.querySelector("#messageError");
const messageSyncStatus = document.querySelector("#messageSyncStatus");
const submitMessage = messageForm?.querySelector(".submit-message");
const messageSection = document.querySelector("#message");
const toast = document.querySelector("#toast");
let toastTimer = 0;
let messagesLoading = sharedMessagesEnabled;
let messageSyncVersion = 0;

function updateMessageCount() {
  if (messageCount && messageText) messageCount.textContent = `${messageText.value.length} / 180`;
}

messageText?.addEventListener("input", updateMessageCount);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function loadCachedMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(messageStorageKey));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveMessageCache(messages) {
  try {
    localStorage.setItem(messageStorageKey, JSON.stringify(messages));
  } catch {
    // Privacy modes can block storage; the shared database remains the source of truth.
  }
}

const cachedMessages = loadCachedMessages();
let messageState = cachedMessages.length
  ? cachedMessages
  : (sharedMessagesEnabled ? [] : defaultMessages);

function setMessageSyncStatus(mode, label) {
  if (!messageSyncStatus) return;
  messageSyncStatus.classList.toggle("is-online", mode === "online");
  messageSyncStatus.classList.toggle("is-error", mode === "error");
  const labelElement = messageSyncStatus.querySelector("span");
  if (labelElement) labelElement.textContent = label;
}

function setMessageError(message = "") {
  if (!messageError) return;
  messageError.textContent = message;
  messageError.hidden = !message;
}

function databaseHeaders(extra = {}) {
  const headers = {
    apikey: supabaseAnonKey,
    ...extra,
  };

  // Legacy anon keys are JWTs and may be used as the bearer token. Supabase's
  // newer publishable keys identify the application through `apikey` only.
  if (!supabaseAnonKey.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${supabaseAnonKey}`;
  }

  return headers;
}

async function fetchWithTimeout(url, options = {}, timeout = 9000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalizeRemoteMessage(item) {
  return {
    id: item.id,
    name: item.name,
    message: item.message,
    createdAt: item.created_at,
  };
}

async function fetchAllSharedMessages() {
  const pageSize = 500;
  const messages = [];
  let offset = 0;

  while (true) {
    const endpoint = `${supabaseUrl}/rest/v1/guestbook_messages?select=id,name,message,created_at&order=created_at.desc`;
    const response = await fetchWithTimeout(endpoint, {
      cache: "no-store",
      headers: databaseHeaders({ Range: `${offset}-${offset + pageSize - 1}` }),
    });
    if (!response.ok) throw new Error(`读取留言失败 (${response.status})`);
    const page = await response.json();
    messages.push(...page.map(normalizeRemoteMessage));
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return messages;
}

async function createSharedMessage(name, message) {
  const endpoint = `${supabaseUrl}/rest/v1/guestbook_messages?select=id,name,message,created_at`;
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: databaseHeaders({
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({ name, message }),
  });
  if (!response.ok) throw new Error(`发布留言失败 (${response.status})`);
  const [created] = await response.json();
  if (!created) throw new Error("数据库没有返回新留言");
  return normalizeRemoteMessage(created);
}

function renderMessages() {
  if (!messageList) return;
  if (!messageState.length) {
    messageList.innerHTML = `
      <p class="message-empty">${messagesLoading ? "正在读取留言…" : "还没有留言，写下第一条吧。"}</p>
    `;
    return;
  }
  messageList.innerHTML = messageState
    .map((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      });
      return `
        <article class="message-card">
          <header>
            <strong>${escapeHtml(item.name)}</strong>
            <time>${date}</time>
          </header>
          <p>${escapeHtml(item.message)}</p>
        </article>
      `;
    })
    .join("");
}

async function syncSharedMessages() {
  if (!sharedMessagesEnabled) {
    messagesLoading = false;
    setMessageSyncStatus("preview", "本地预览");
    renderMessages();
    return;
  }

  const syncVersion = ++messageSyncVersion;
  setMessageSyncStatus("loading", "正在同步");
  try {
    const messages = await fetchAllSharedMessages();
    if (syncVersion !== messageSyncVersion) return;
    messageState = messages;
    messagesLoading = false;
    saveMessageCache(messages);
    renderMessages();
    setMessageSyncStatus("online", "所有访客可见");
  } catch (error) {
    if (syncVersion !== messageSyncVersion) return;
    messagesLoading = false;
    renderMessages();
    setMessageSyncStatus("error", messageState.length ? "同步失败，显示缓存" : "留言暂时不可用");
    console.warn(error);
  }
}

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

async function copyText(value) {
  let clipboardError = null;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      clipboardError = error;
    }
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.top = "0";
  input.style.left = "0";
  input.style.opacity = "0";
  document.body.append(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, value.length);
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw clipboardError || new Error("Copy command failed");
}

const copyResetTimers = new WeakMap();
document.querySelectorAll("[data-copy-contact]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyValue;
    const label = button.dataset.copyContact;
    const note = button.dataset.copyNote;
    const title = button.querySelector("strong");
    if (!value || !label || !title) return;
    try {
      await copyText(value);
      const previousTimer = copyResetTimers.get(button);
      if (previousTimer) window.clearTimeout(previousTimer);
      button.classList.add("is-copied");
      title.textContent = `已复制${label}`;
      showToast(`${label}已复制：${value}${note ? `（${note}）` : ""}`);
      const resetTimer = window.setTimeout(() => {
        button.classList.remove("is-copied");
        title.textContent = `复制${label}`;
        copyResetTimers.delete(button);
      }, 1800);
      copyResetTimers.set(button, resetTimer);
    } catch {
      showToast(`复制失败，请手动复制：${value}`);
    }
  });
});

function showMessageComposer() {
  setMessageError();
  if (!messageDialog.open) messageDialog.showModal();
  syncDialogState();
  requestAnimationFrame(() => messageName.focus());
}

function openMessageComposer() {
  if (window.location.hash !== "#message") history.replaceState(null, "", "#message");
  history.pushState({ composeMessage: true }, "", "#message-compose");
  showMessageComposer();
}

function closeMessageComposer({ restoreFocus = false } = {}) {
  if (messageDialog.open) messageDialog.close();
  syncDialogState();
  if (restoreFocus && openMessageDialog?.isConnected) {
    requestAnimationFrame(() => {
      messageSection?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
      openMessageDialog.focus({ preventScroll: true });
    });
  }
}

function requestMessageClose() {
  if (history.state?.composeMessage) {
    history.back();
    return;
  }
  closeMessageComposer();
}

openMessageDialog?.addEventListener("click", openMessageComposer);
closeMessageDialog?.addEventListener("click", requestMessageClose);
messageDialog?.addEventListener("click", (event) => {
  if (event.target === messageDialog) requestMessageClose();
});
messageDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  requestMessageClose();
});
messageDialog?.addEventListener("close", syncDialogState);
messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = messageName.value.trim();
  const message = messageText.value.trim();
  if (!name || !message) return;
  if (messageWebsite?.value) {
    messageForm.reset();
    requestMessageClose();
    return;
  }
  if (!sharedMessagesEnabled) {
    setMessageError("共享数据库尚未连接，当前不能发布留言。");
    return;
  }

  setMessageError();
  messageSyncVersion += 1;
  if (submitMessage) {
    submitMessage.disabled = true;
    submitMessage.textContent = "发布中…";
  }

  try {
    const created = await createSharedMessage(name, message);
    messageState = [created, ...messageState.filter((item) => item.id !== created.id)];
    saveMessageCache(messageState);
    renderMessages();
    messageForm.reset();
    updateMessageCount();
    requestMessageClose();
    showToast("留言已发布，所有访客都能看到");
    setMessageSyncStatus("online", "所有访客可见");
  } catch (error) {
    setMessageError("发布失败，请检查网络后重试。");
    console.warn(error);
  } finally {
    if (submitMessage) {
      submitMessage.disabled = false;
      submitMessage.textContent = "发布留言";
    }
  }
});
renderMessages();
syncSharedMessages();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && sharedMessagesEnabled) syncSharedMessages();
});

function syncHistoryDrivenUi({ focusPortal = false } = {}) {
  syncPortalFromLocation({ focus: focusPortal });
  syncProjectCaseFromLocation();

  const experienceKey =
    history.state?.experienceKey ||
    window.location.hash.match(/^#detail-(xiaomi|baidu|buding|nearu|telestudio|wakeargue|design)$/)?.[1];
  if (experienceKey && experiences[experienceKey]) {
    showExperience(experienceKey);
  } else if (experienceModal.open) {
    closeExperienceModal({ restoreFocus: true });
  }

  if (history.state?.composeMessage) {
    showMessageComposer();
  } else if (messageDialog?.open) {
    closeMessageComposer({ restoreFocus: true });
  }
}

function syncUiAfterNavigation() {
  syncHistoryDrivenUi({ focusPortal: window.location.hash === "#portal" });
  if (/^#detail-(?:xiaomi|baidu|buding)$/.test(window.location.hash)) {
    requestAnimationFrame(() => {
      document.querySelector("#work")?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  } else if (/^#(?:experience|detail)-/.test(window.location.hash)) {
    requestAnimationFrame(() => {
      portalSection.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }
}

let navigationSyncFrame = 0;
function scheduleNavigationSync() {
  if (navigationSyncFrame) return;
  navigationSyncFrame = requestAnimationFrame(() => {
    navigationSyncFrame = 0;
    syncUiAfterNavigation();
  });
}

window.addEventListener("popstate", scheduleNavigationSync);
window.addEventListener("hashchange", scheduleNavigationSync);
syncHistoryDrivenUi();

const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
const trackedSections = sectionLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
  .filter((item) => item.section);
let navFrame = 0;

trackedSections.forEach(({ link, section }) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const href = link.getAttribute("href");
    if (window.location.hash === href) history.replaceState(null, "", href);
    else history.pushState(null, "", href);
    syncHistoryDrivenUi();
    requestAnimationFrame(() => {
      section.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  });
});

function updateActiveNavigation() {
  navFrame = 0;
  const focusLine = window.scrollY + Math.min(window.innerHeight * 0.34, 280);
  let active = null;
  trackedSections.forEach((item) => {
    if (item.section.offsetTop <= focusLine) active = item;
  });
  if (trackedSections[0] && focusLine < trackedSections[0].section.offsetTop) active = null;

  trackedSections.forEach((item) => {
    const isCurrent = item === active;
    item.link.classList.toggle("is-current", isCurrent);
    if (isCurrent) item.link.setAttribute("aria-current", "location");
    else item.link.removeAttribute("aria-current");
  });
}

function scheduleActiveNavigation() {
  if (navFrame) return;
  navFrame = requestAnimationFrame(updateActiveNavigation);
}

window.addEventListener("scroll", scheduleActiveNavigation, { passive: true });
window.addEventListener("resize", scheduleActiveNavigation);
updateActiveNavigation();

