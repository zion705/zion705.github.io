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
dryWood.src = "./assets/wood-dry.png";
sproutWood.src = "./assets/wood-sprout.png";

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
  return Math.max(0, duration - Math.min(0.08, duration * 0.008));
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
  revealTrail.length =×ßuöÚ$z{-®éÜj×[É^[èkˆ^jY®ûÈÎiÉş[è^Yî™Ú.yÈ¾X‹i»NZI¢’Kª~Y8ZHŞy¹8""À¢7&VFVDC¢###bÓrÓ5Cƒ£c£ã¢ ¢ÒÀ¢°¢æÖS¢$Æ–â"À¢ÖW76vS¢.K¸îyJh‹~™zîš)Šë.X‹ŠøNkX¾Xú>[èNûÈÎ‹ùzxŞšyºîŠ‹ëîjùNX©şˆ;Şkˆ^XÙ^i»NiÈŠûNiÈŞX©¾8""À¢7&VFVDC¢###bÓbÓ#…C#£3£ã¢ ¢ÒÀ¢°¢æÖS¢$&öâ"À¢ÖW76vS¢.šinš^y¨NyIşYŞX©¾™©Yk¾[èkÈ.KªîûÈÎK™şŠêh¨iÊşY(ÎŠëîŠêK˜¾™{Ny¨NX[>{;¾i»NX[~KÙ>K¨n8""À¢7&VFVDC¢###bÓbÓ#5C“£S£ã¢ ¢ÒÀ¢°¢æÖS¢%6†—&ÆW’"À¢ÖW76vS¢.[èYiÎjÊ.‹ù˜xÎXX¾X‹ny¨N{»şˆ›.8.šyºîŠúnh8^Zh.iéÎ{º~{ºŞŠ^XX^‹ø~zˆ¾Y»îûÈÎKÉ®i»NZèÎi[N8""À¢7&VFVDC¢###bÓbÓ…CC£Cƒ£ã¢ ¢Ğ¥Ó°¦6öç7BÖW76vTÆ—7BÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vTÆ—7B"“°¦6öç7BÖW76vTF–ÆörÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vTF–Æör"“°¦6öç7BÖW76vTf÷&ÒÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vTf÷&Ò"“°¦6öç7B÷VäÖW76vTF–ÆörÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6÷VäÖW76vTF–Æör"“°¦6öç7B6Æ÷6TÖW76vTF–ÆörÒFö7VÖVçBçVW'•6VÆV7F÷"‚"66Æ÷6TÖW76vTF–Æör"“°¦6öç7BÖW76vTæÖRÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vTæÖR"“°¦6öç7BÖW76vUFW‡BÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vUFW‡B"“°¦6öç7BÖW76vT6÷VçBÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vT6÷VçB"“°¦6öç7BÖW76vUvV'6—FRÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vUvV'6—FR"“°¦6öç7BÖW76vTW'&÷"ÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vTW'&÷""“°¦6öç7BÖW76vU7–æ57FGW2ÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vU7–æ57FGW2"“°¦6öç7B7V&Ö—DÖW76vRÒÖW76vTf÷&ÓòçVW'•6VÆV7F÷"‚"ç7V&Ö—BÖÖW76vR"“°¦6öç7BÖW76vU6V7F–öâÒFö7VÖVçBçVW'•6VÆV7F÷"‚"6ÖW76vR"“°¦6öç7BFö7BÒFö7VÖVçBçVW'•6VÆV7F÷"‚"7Fö7B"“°¦ÆWBFö7EF–ÖW"Ò°¦ÆWBÖW76vW4ÆöF–ærÒ6†&VDÖW76vW4Væ&ÆVC°¦ÆWBÖW76vU7–æ5fW'6–öâÒ° ¦gVæ7F–öâWFFTÖW76vT6÷VçB‚’°¢–b†ÖW76vT6÷VçBbbÖW76vUFW‡B’ÖW76vT6÷VçBçFW‡D6öçFVçBÒG¶ÖW76vUFW‡BçfÇVRæÆVæwF‡Òòƒ°§Ğ ¦ÖW76vUFW‡CòæFDWfVçDÆ—7FVæW"‚&–çWB"ÂWFFTÖW76vT6÷VçB“° ¦gVæ7F–öâW66T‡FÖÂ‡fÇVR’°¢&WGW&â7G&–ær‡fÇVR’ç&WÆ6R‚õ²cÃâ"uÒörÂ†6†"’Óâ‡°¢"b#¢"f×²"À¢#Â#¢"fÇC²"À¢#â#¢"fwC²"À¢r"s¢"gV÷C²"À¢"r#¢"b33“²"À¢Ò•¶6†%Ò“°§Ğ ¦gVæ7F–öâÆöD66†VDÖW76vW2‚’°¢G'’°¢6öç7B7F÷&VBÒ¥4ôâç'6R†Æö6Å7F÷&vRævWD—FVÒ†ÖW76vU7F÷&vT¶W’’“°¢&WGW&â'&’æ—4'&’‡7F÷&VB’ò7F÷&VB¢µÓ°¢Ò6F6‚°¢&WGW&âµÓ°¢Ğ§Ğ ¦gVæ7F–öâ6fTÖW76vT66†R†ÖW76vW2’°¢G'’°¢Æö6Å7F÷&vRç6WD—FVÒ†ÖW76vU7F÷&vT¶W’Â¥4ôâç7G&–æv–g’†ÖW76vW2’“°¢Ò6F6‚°¢òò&—f7’ÖöFW26â&Æö6²7F÷&vS²F†R6†&VBFF&6R&VÖ–ç2F†R6÷W&6RöbG'WF‚à¢Ğ§Ğ ¦6öç7B66†VDÖW76vW2ÒÆöD66†VDÖW76vW2‚“°¦ÆWBÖW76vU7FFRÒ66†VDÖW76vW2æÆVæwF€¢ò66†VDÖW76vW0¢¢‡6†&VDÖW76vW4Væ&ÆVBòµÒ¢FVfVÇDÖW76vW2“° ¦gVæ7F–öâ6WDÖW76vU7–æ57FGW2†ÖöFRÂÆ&VÂ’°¢–b‚ÖW76vU7–æ57FGW2’&WGW&ã°¢ÖW76vU7–æ57FGW2æ6Æ74Æ—7BçFövvÆR‚&—2ÖöæÆ–æR"ÂÖöFRÓÓÒ&öæÆ–æR"“°¢ÖW76vU7–æ57FGW2æ6Æ74Æ—7BçFövvÆR‚&—2ÖW'&÷""ÂÖöFRÓÓÒ&W'&÷""“°¢6öç7BÆ&VÄVÆVÖVçBÒÖW76vU7–æ57FGW2çVW'•6VÆV7F÷"‚'7â"“°¢–b†Æ&VÄVÆVÖVçB’Æ&VÄVÆVÖVçBçFW‡D6öçFVçBÒÆ&VÃ°§Ğ ¦gVæ7F–öâ6WDÖW76vTW'&÷"†ÖW76vRÒ""’°¢–b‚ÖW76vTW'&÷"’&WGW&ã°¢ÖW76vTW'&÷"çFW‡D6öçFVçBÒÖW76vS°¢ÖW76vTW'&÷"æ†–FFVâÒÖW76vS°§Ğ ¦gVæ7F–öâFF&6T†VFW'2†W‡G&Ò·Ò’°¢6öç7B†VFW'2Ò°¢–¶W“¢7W&6Tæöä¶W’À¢ââæW‡G&À¢Ó° ¢òòÆVv7’æöâ¶W—2&R¥uG2æBÖ’&RW6VB2F†R&V&W"Fö¶Vââ7W&6Rw0¢òòæWvW"V&Æ—6†&ÆR¶W—2–FVçF–g’F†RÆ–6F–öâF‡&÷Vv‚–¶W–öæÇ’à¢–b‚7W&6Tæöä¶W’ç7F'G5v—F‚‚'6%÷V&Æ—6†&ÆUò"’’°¢†VFW'2äWF†÷&—¦F–öâÒ&V&W"G·7W&6Tæöä¶W—Ö°¢Ğ ¢&WGW&â†VFW'3°§Ğ ¦7–æ2gVæ7F–öâfWF6…v—F…F–ÖV÷WB‡W&ÂÂ÷F–öç2Ò·ÒÂF–ÖV÷WBÒ“’°¢6öç7B6öçG&öÆÆW"ÒæWr&÷'D6öçG&öÆÆW"‚“°¢6öç7BF–ÖV÷WD–BÒv–æF÷rç6WEF–ÖV÷WB‚‚’Óâ6öçG&öÆÆW"æ&÷'B‚’ÂF–ÖV÷WB“°¢G'’°¢&WGW&âv—BfWF6‚‡W&ÂÂ²ââæ÷F–öç2Â6–væÃ¢6öçG&öÆÆW"ç6–væÂÒ“°¢Òf–æÆÇ’°¢v–æF÷ræ6ÆV%F–ÖV÷WB‡F–ÖV÷WD–B“°¢Ğ§Ğ ¦gVæ7F–öâæ÷&ÖÆ—¦U&VÖ÷FTÖW76vR†—FVÒ’°¢&WGW&â°¢–C¢—FVÒæ–BÀ¢æÖS¢—FVÒææÖRÀ¢ÖW76vS¢—FVÒæÖW76vRÀ¢7&VFVDC¢—FVÒæ7&VFVEöBÀ¢Ó°§Ğ ¦7–æ2gVæ7F–öâfWF6„ÆÅ6†&VDÖW76vW2‚’°¢6öç7BvU6—¦RÒS°¢6öç7BÖW76vW2ÒµÓ°¢ÆWBöfg6WBÒ° ¢v†–ÆR‡G'VR’°¢6öç7BVæGö–çBÒG·7W&6UW&ÇÒ÷&W7B÷cöwVW7F&ööµöÖW76vW3÷6VÆV7CÖ–BÆæÖRÆÖW76vRÆ7&VFVEöBf÷&FW#Ö7&VFVEöBæFW66°¢6öç7B&W7öç6RÒv—BfWF6…v—F…F–ÖV÷WB†VæGö–çBÂ°¢66†S¢&æò×7F÷&R"À¢†VFW'3¢FF&6T†VFW'2‡²&ævS¢G¶öfg6WGÒÒG¶öfg6WB²vU6—¦RÒÖÒ’À¢Ò“°¢–b‚&W7öç6Ræö²’F‡&÷ræWrW'&÷"†Šû¾XùnyYŠˆZK‹JR‚G·&W7öç6Rç7FGW7Ò–“°¢6öç7BvRÒv—B&W7öç6Ræ§6öâ‚“°¢ÖW76vW2çW6‚‚ââçvRæÖ†æ÷&ÖÆ—¦U&VÖ÷FTÖW76vR’“°¢–b‡vRæÆVæwF‚ÂvU6—¦R’'&V³°¢öfg6WB³ÒvU6—¦S°¢Ğ ¢&WGW&âÖW76vW3°§Ğ ¦7–æ2gVæ7F–öâ7&VFU6†&VDÖW76vR†æÖRÂÖW76vR’°¢6öç7BVæGö–çBÒG·7W&6UW&ÇÒ÷&W7B÷cöwVW7F&ööµöÖW76vW3÷6VÆV7CÖ–BÆæÖRÆÖW76vRÆ7&VFVEöF°¢6öç7B&W7öç6RÒv—BfWF6…v—F…F–ÖV÷WB†VæGö–çBÂ°¢ÖWF†öC¢%õ5B"À¢†VFW'3¢FF&6T†VFW'2‡°¢$6öçFVçBÕG—R#¢&Æ–6F–öâö§6öâ"À¢&VfW#¢'&WGW&ã×&W&W6VçFF–öâ"À¢Ò’À¢&öG“¢¥4ôâç7G&–æv–g’‡²æÖRÂÖW76vRÒ’À¢Ò“°¢–b‚&W7öç6Ræö²’F‡&÷ræWrW'&÷"†Xù[ˆ>yYŠˆZK‹JR‚G·&W7öç6Rç7FGW7Ò–“°¢6öç7B¶7&VFVEÒÒv—B&W7öç6Ræ§6öâ‚“°¢–b‚7&VFVB’F‡&÷ræWrW'&÷"‚.i[hÚî[©>k*iÈ‹ùNY¹îikyYŠˆ"“°¢&WGW&âæ÷&ÖÆ—¦U&VÖ÷FTÖW76vR†7&VFVB“°§Ğ ¦gVæ7F–öâ&VæFW$ÖW76vW2‚’°¢–b‚ÖW76vTÆ—7B’&WGW&ã°¢–b‚ÖW76vU7FFRæÆVæwF‚’°¢ÖW76vTÆ—7Bæ–ææW$…DÔÂÒ ¢Ç6Æ73Ò&ÖW76vRÖV×G’#âG¶ÖW76vW4ÆöF–ærò.jÚ>YÊŠû¾XùnyYŠˆ(
b"¢.‹ùk*iÈyYŠˆûÈÎXiKˆ¾zÊÎKˆiÚY
~8"'ÓÂ÷à¢°¢&WGW&ã°¢Ğ¢ÖW76vTÆ—7Bæ–ææW$…DÔÂÒÖW76vU7FFP¢æÖ‚†—FVÒ’Óâ°¢6öç7BFFRÒæWrFFR†—FVÒæ7&VFVDB’çFôÆö6ÆTFFU7G&–ær‚'¦‚Ô4â"Â°¢ÖöçFƒ¢#"ÖF–v—B"À¢F“¢#"ÖF–v—B"À¢Ò“°¢&WGW&â ¢Æ'F–6ÆR6Æ73Ò&ÖW76vRÖ6&B#à¢Æ†VFW#à¢Ç7G&öæsâG¶W66T‡FÖÂ†—FVÒææÖR—ÓÂ÷7G&öæsà¢ÇF–ÖSâG¶FFWÓÂ÷F–ÖSà¢Âö†VFW#à¢ÇâG¶W66T‡FÖÂ†—FVÒæÖW76vR—ÓÂ÷à¢Âö'F–6ÆSà¢°¢Ò¢æ¦ö–â‚""“°§Ğ ¦7–æ2gVæ7F–öâ7–æ56†&VDÖW76vW2‚’°¢–b‚6†&VDÖW76vW4Væ&ÆVB’°¢ÖW76vW4ÆöF–ærÒfÇ6S°¢6WDÖW76vU7–æ57FGW2‚'&Wf–Wr"Â.iÊÎYËš(NŠx‚"“°¢&VæFW$ÖW76vW2‚“°¢&WGW&ã°¢Ğ ¢6öç7B7–æ5fW'6–öâÒ²¶ÖW76vU7–æ5fW'6–öã°¢6WDÖW76vU7–æ57FGW2‚&ÆöF–ær"Â.jÚ>YÊYÎjÚR"“°¢G'’°¢6öç7BÖW76vW2Òv—BfWF6„ÆÅ6†&VDÖW76vW2‚“°¢–b‡7–æ5fW'6–öâÓÒÖW76vU7–æ5fW'6–öâ’&WGW&ã°¢ÖW76vU7FFRÒÖW76vW3°¢ÖW76vW4ÆöF–ærÒfÇ6S°¢6fTÖW76vT66†R†ÖW76vW2“°¢&VæFW$ÖW76vW2‚“°¢6WDÖW76vU7–æ57FGW2‚&öæÆ–æR"Â.h˜iÈŠëşZê.XúşŠx"“°¢Ò6F6‚†W'&÷"’°¢–b‡7–æ5fW'6–öâÓÒÖW76vU7–æ5fW'6–öâ’&WGW&ã°¢ÖW76vW4ÆöF–ærÒfÇ6S°¢&VæFW$ÖW76vW2‚“°¢6WDÖW76vU7–æ57FGW2‚&W'&÷""ÂÖW76vU7FFRæÆVæwF‚ò.YÎjÚ^ZK‹J^ûÈÎi‹îzK®{É>ZÙ‚"¢.yYŠˆi¨.i{nKˆŞXúşyJ‚"“°¢6öç6öÆRçv&â†W'&÷"“°¢Ğ§Ğ ¦gVæ7F–öâ6†÷uFö7B†ÖW76vR’°¢–b‚Fö7B’&WGW&ã°¢v–æF÷ræ6ÆV%F–ÖV÷WB‡Fö7EF–ÖW"“°¢Fö7BçFW‡D6öçFVçBÒÖW76vS°¢Fö7Bæ6Æ74Æ—7BæFB‚&—2×f—6–&ÆR"“°¢Fö7EF–ÖW"Òv–æF÷rç6WEF–ÖV÷WB‚‚’ÓâFö7Bæ6Æ74Æ—7Bç&VÖ÷fR‚&—2×f—6–&ÆR"’Â#c“°§Ğ ¦7–æ2gVæ7F–öâ6÷•FW‡B‡fÇVR’°¢ÆWB6Æ—&ö&DW'&÷"ÒçVÆÃ°¢–b†æf–vF÷"æ6Æ—&ö&Bbbv–æF÷ræ—56V7W&T6öçFW‡B’°¢G'’°¢v—Bæf–vF÷"æ6Æ—&ö&Bçw&—FUFW‡B‡fÇVR“°¢&WGW&ã°¢Ò6F6‚†W'&÷"’°¢6Æ—&ö&DW'&÷"ÒW'&÷#°¢Ğ¢Ğ¢6öç7B–çWBÒFö7VÖVçBæ7&VFTVÆVÖVçB‚'FW‡F&V"“°¢–çWBçfÇVRÒfÇVS°¢–çWBç6WDGG&–'WFR‚'&VFöæÇ’"Â""“°¢–çWBç7G–ÆRç÷6—F–öâÒ&f—†VB#°¢–çWBç7G–ÆRçF÷Ò##°¢–çWBç7G–ÆRæÆVgBÒ##°¢–çWBç7G–ÆRæ÷6—G’Ò##°¢Fö7VÖVçBæ&öG’æVæB†–çWB“°¢–çWBæfö7W2‚“°¢–çWBç6VÆV7B‚“°¢–çWBç6WE6VÆV7F–öå&ævRƒÂfÇVRæÆVæwF‚“°¢6öç7B6÷–VBÒFö7VÖVçBæW†V46öÖÖæB‚&6÷’"“°¢–çWBç&VÖ÷fR‚“°¢–b‚6÷–VB’F‡&÷r6Æ—&ö&DW'&÷"ÇÂæWrW'&÷"‚$6÷’6öÖÖæBf–ÆVB"“°§Ğ ¦6öç7B6÷•&W6WEF–ÖW'2ÒæWrvV´Ö‚“°¦Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ6÷’Ö6öçF7EÒ"’æf÷$V6‚‚†'WGFöâ’Óâ°¢'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2‚’Óâ°¢6öç7BfÇVRÒ'WGFöâæFF6WBæ6÷•fÇVS°¢6öç7BÆ&VÂÒ'WGFöâæFF6WBæ6÷”6öçF7C°¢6öç7Bæ÷FRÒ'WGFöâæFF6WBæ6÷”æ÷FS°¢6öç7BF—FÆRÒ'WGFöâçVW'•6VÆV7F÷"‚'7G&öær"“°¢–b‚fÇVRÇÂÆ&VÂÇÂF—FÆR’&WGW&ã°¢G'’°¢v—B6÷•FW‡B‡fÇVR“°¢6öç7B&Wf–÷W5F–ÖW"Ò6÷•&W6WEF–ÖW'2ævWB†'WGFöâ“°¢–b‡&Wf–÷W5F–ÖW"’v–æF÷ræ6ÆV%F–ÖV÷WB‡&Wf–÷W5F–ÖW"“°¢'WGFöâæ6Æ74Æ—7BæFB‚&—2Ö6÷–VB"“°¢F—FÆRçFW‡D6öçFVçBÒ[{.ZHŞX‹bG¶Æ&VÇÖ°¢6†÷uFö7B†G¶Æ&VÇŞ[{.ZHŞX‹nûÉ¢G·fÇVWÒG¶æ÷FRòûÈ‚G¶æ÷FWŞûÈ–¢"'Ö“°¢6öç7B&W6WEF–ÖW"Òv–æF÷rç6WEF–ÖV÷WB‚‚’Óâ°¢'WGFöâæ6Æ74Æ—7Bç&VÖ÷fR‚&—2Ö6÷–VB"“°¢F—FÆRçFW‡D6öçFVçBÒZHŞX‹bG¶Æ&VÇÖ°¢6÷•&W6WEF–ÖW'2æFVÆWFR†'WGFöâ“°¢ÒÂƒ“°¢6÷•&W6WEF–ÖW'2ç6WB†'WGFöâÂ&W6WEF–ÖW"“°¢Ò6F6‚°¢6†÷uFö7B†ZHŞX‹nZK‹J^ûÈÎŠû~h˜¾XªZHŞX‹nûÉ¢G·fÇVWÖ“°¢Ğ¢Ò“°§Ò“° ¦gVæ7F–öâ6†÷tÖW76vT6ö×÷6W"‚’°¢6WDÖW76vTW'&÷"‚“°¢–b‚ÖW76vTF–Æöræ÷Vâ’ÖW76vTF–Æörç6†÷tÖöFÂ‚“°¢7–æ4F–Æöu7FFR‚“°¢&WVW7Dæ–ÖF–öäg&ÖR‚‚’ÓâÖW76vTæÖRæfö7W2‚’“°§Ğ ¦gVæ7F–öâ÷VäÖW76vT6ö×÷6W"‚’°¢–b‡v–æF÷ræÆö6F–öâæ†6‚ÓÒ"6ÖW76vR"’†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â"6ÖW76vR"“°¢†—7F÷'’çW6…7FFR‡²6ö×÷6TÖW76vS¢G'VRÒÂ""Â"6ÖW76vRÖ6ö×÷6R"“°¢6†÷tÖW76vT6ö×÷6W"‚“°§Ğ ¦gVæ7F–öâ6Æ÷6TÖW76vT6ö×÷6W"‡²&W7F÷&Tfö7W2ÒfÇ6RÒÒ·Ò’°¢–b†ÖW76vTF–Æöræ÷Vâ’ÖW76vTF–Æöræ6Æ÷6R‚“°¢7–æ4F–Æöu7FFR‚“°¢–b‡&W7F÷&Tfö7W2bb÷VäÖW76vTF–Æösòæ—46öææV7FVB’°¢&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢ÖW76vU6V7F–öãòç67&öÆÄ–çFõf–Wr‡°¢&V†f–÷#¢&VGV6VDÖ÷F–öâæÖF6†W2ò&WFò"¢'6Öö÷F‚"À¢&Æö6³¢'7F'B"À¢Ò“°¢÷VäÖW76vTF–Æöræfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°¢Ò“°¢Ğ§Ğ ¦gVæ7F–öâ&WVW7DÖW76vT6Æ÷6R‚’°¢–b††—7F÷'’ç7FFSòæ6ö×÷6TÖW76vR’°¢†—7F÷'’æ&6²‚“°¢&WGW&ã°¢Ğ¢6Æ÷6TÖW76vT6ö×÷6W"‚“°§Ğ ¦÷VäÖW76vTF–ÆösòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â÷VäÖW76vT6ö×÷6W"“°¦6Æ÷6TÖW76vTF–ÆösòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â&WVW7DÖW76vT6Æ÷6R“°¦ÖW76vTF–ÆösòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°¢–b†WfVçBçF&vWBÓÓÒÖW76vTF–Æör’&WVW7DÖW76vT6Æ÷6R‚“°§Ò“°¦ÖW76vTF–ÆösòæFDWfVçDÆ—7FVæW"‚&6æ6VÂ"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢&WVW7DÖW76vT6Æ÷6R‚“°§Ò“°¦ÖW76vTF–ÆösòæFDWfVçDÆ—7FVæW"‚&6Æ÷6R"Â7–æ4F–Æöu7FFR“°¦ÖW76vTf÷&ÓòæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7–æ2†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢6öç7BæÖRÒÖW76vTæÖRçfÇVRçG&–Ò‚“°¢6öç7BÖW76vRÒÖW76vUFW‡BçfÇVRçG&–Ò‚“°¢–b‚æÖRÇÂÖW76vR’&WGW&ã°¢–b†ÖW76vUvV'6—FSòçfÇVR’°¢ÖW76vTf÷&Òç&W6WB‚“°¢&WVW7DÖW76vT6Æ÷6R‚“°¢&WGW&ã°¢Ğ¢–b‚6†&VDÖW76vW4Væ&ÆVB’°¢6WDÖW76vTW'&÷"‚.X[Kª¾i[hÚî[©>[	®iÊ®‹ùîhê^ûÈÎ[Ù>X˜ŞKˆŞˆ;ŞXù[ˆ>yYŠˆ8""“°¢&WGW&ã°¢Ğ ¢6WDÖW76vTW'&÷"‚“°¢ÖW76vU7–æ5fW'6–öâ³Ò°¢–b‡7V&Ö—DÖW76vR’°¢7V&Ö—DÖW76vRæF—6&ÆVBÒG'VS°¢7V&Ö—DÖW76vRçFW‡D6öçFVçBÒ.Xù[ˆ>KŠŞ(
b#°¢Ğ ¢G'’°¢6öç7B7&VFVBÒv—B7&VFU6†&VDÖW76vR†æÖRÂÖW76vR“°¢ÖW76vU7FFRÒ¶7&VFVBÂââæÖW76vU7FFRæf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ7&VFVBæ–B•Ó°¢6fTÖW76vT66†R†ÖW76vU7FFR“°¢&VæFW$ÖW76vW2‚“°¢ÖW76vTf÷&Òç&W6WB‚“°¢WFFTÖW76vT6÷VçB‚“°¢&WVW7DÖW76vT6Æ÷6R‚“°¢6†÷uFö7B‚.yYŠˆ[{.Xù[ˆ>ûÈÎh˜iÈŠëşZê.˜;Şˆ;ŞyÈ¾X‹"“°¢6WDÖW76vU7–æ57FGW2‚&öæÆ–æR"Â.h˜iÈŠëşZê.XúşŠx"“°¢Ò6F6‚†W'&÷"’°¢6WDÖW76vTW'&÷"‚.Xù[ˆ>ZK‹J^ûÈÎŠû~j8iú^{Ù{¹ÎYî˜xŞŠù^8""“°¢6öç6öÆRçv&â†W'&÷"“°¢Òf–æÆÇ’°¢–b‡7V&Ö—DÖW76vR’°¢7V&Ö—DÖW76vRæF—6&ÆVBÒfÇ6S°¢7V&Ö—DÖW76vRçFW‡D6öçFVçBÒ.Xù[ˆ>yYŠˆ#°¢Ğ¢Ğ§Ò“°§&VæFW$ÖW76vW2‚“°§7–æ56†&VDÖW76vW2‚“° ¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚'f—6–&–Æ—G–6†ævR"Â‚’Óâ°¢–b†Fö7VÖVçBçf—6–&–Æ—G•7FFRÓÓÒ'f—6–&ÆR"bb6†&VDÖW76vW4Væ&ÆVB’7–æ56†&VDÖW76vW2‚“°§Ò“° ¦gVæ7F–öâ7–æ4†—7F÷'”G&—fVåV’‡²fö7W5÷'FÂÒfÇ6RÒÒ·Ò’°¢7–æ5÷'FÄg&öÔÆö6F–öâ‡²fö7W3¢fö7W5÷'FÂÒ“°¢7–æ5&ö¦V7D66Tg&öÔÆö6F–öâ‚“° ¢6öç7BW‡W&–Væ6T¶W’Ğ¢†—7F÷'’ç7FFSòæW‡W&–Væ6T¶W’ÇÀ¢v–æF÷ræÆö6F–öâæ†6‚æÖF6‚‚õâ6FWF–ÂÒ‡†–öÖ—Æ&–GWÆ'VF–æwÆæV'WÇFVÆW7GVF–÷Çv¶V&wVWÆFW6–vâ’Bò“òå³Ó°¢–b†W‡W&–Væ6T¶W’bbW‡W&–Væ6W5¶W‡W&–Væ6T¶W•Ò’°¢6†÷tW‡W&–Væ6R†W‡W&–Væ6T¶W’“°¢ÒVÇ6R–b†W‡W&–Væ6TÖöFÂæ÷Vâ’°¢6Æ÷6TW‡W&–Væ6TÖöFÂ‡²&W7F÷&Tfö7W3¢G'VRÒ“°¢Ğ ¢–b††—7F÷'’ç7FFSòæ6ö×÷6TÖW76vR’°¢6†÷tÖW76vT6ö×÷6W"‚“°¢ÒVÇ6R–b†ÖW76vTF–Æösòæ÷Vâ’°¢6Æ÷6TÖW76vT6ö×÷6W"‡²&W7F÷&Tfö7W3¢G'VRÒ“°¢Ğ§Ğ ¦gVæ7F–öâ7–æ5V”gFW$æf–vF–öâ‚’°¢7–æ4†—7F÷'”G&—fVåV’‡²fö7W5÷'FÃ¢v–æF÷ræÆö6F–öâæ†6‚ÓÓÒ"7÷'FÂ"Ò“°¢–b‚õâ6FWF–ÂÒƒó§†–öÖ—Æ&–GWÆ'VF–ær’BòçFW7B‡v–æF÷ræÆö6F–öâæ†6‚’’°¢&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢Fö7VÖVçBçVW'•6VÆV7F÷"‚"7v÷&²"“òç67&öÆÄ–çFõf–Wr‡°¢&V†f–÷#¢&VGV6VDÖ÷F–öâæÖF6†W2ò&WFò"¢'6Öö÷F‚"À¢&Æö6³¢'7F'B"À¢Ò“°¢Ò“°¢ÒVÇ6R–b‚õâ2ƒó¦W‡W&–Væ6WÆFWF–Â’ÒòçFW7B‡v–æF÷ræÆö6F–öâæ†6‚’’°¢&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢÷'FÅ6V7F–öâç67&öÆÄ–çFõf–Wr‡°¢&V†f–÷#¢&VGV6VDÖ÷F–öâæÖF6†W2ò&WFò"¢'6Öö÷F‚"À¢&Æö6³¢'7F'B"À¢Ò“°¢Ò“°¢Ğ§Ğ ¦ÆWBæf–vF–öå7–æ4g&ÖRÒ°¦gVæ7F–öâ66†VGVÆTæf–vF–öå7–æ2‚’°¢–b†æf–vF–öå7–æ4g&ÖR’&WGW&ã°¢æf–vF–öå7–æ4g&ÖRÒ&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢æf–vF–öå7–æ4g&ÖRÒ°¢7–æ5V”gFW$æf–vF–öâ‚“°¢Ò“°§Ğ §v–æF÷ræFDWfVçDÆ—7FVæW"‚'÷7FFR"Â66†VGVÆTæf–vF–öå7–æ2“°§v–æF÷ræFDWfVçDÆ—7FVæW"‚&†6†6†ævR"Â66†VGVÆTæf–vF–öå7–æ2“°§7–æ4†—7F÷'”G&—fVåV’‚“° ¦6öç7B6V7F–öäÆ–æ·2Ò²ââæFö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚%¶FF×6V7F–öâÖÆ–æµÒ"•Ó°¦6öç7BG&6¶VE6V7F–öç2Ò6V7F–öäÆ–æ·0¢æÖ‚†Æ–æ²’Óâ‡²Æ–æ²Â6V7F–öã¢Fö7VÖVçBçVW'•6VÆV7F÷"†Æ–æ²ævWDGG&–'WFR‚&‡&Vb"’’Ò’¢æf–ÇFW"‚†—FVÒ’Óâ—FVÒç6V7F–öâ“°¦ÆWBædg&ÖRÒ° §G&6¶VE6V7F–öç2æf÷$V6‚‚‡²Æ–æ²Â6V7F–öâÒ’Óâ°¢Æ–æ²æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢6öç7B‡&VbÒÆ–æ²ævWDGG&–'WFR‚&‡&Vb"“°¢–b‡v–æF÷ræÆö6F–öâæ†6‚ÓÓÒ‡&Vb’†—7F÷'’ç&WÆ6U7FFR†çVÆÂÂ""Â‡&Vb“°¢VÇ6R†—7F÷'’çW6…7FFR†çVÆÂÂ""Â‡&Vb“°¢7–æ4†—7F÷'”G&—fVåV’‚“°¢&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢6V7F–öâç67&öÆÄ–çFõf–Wr‡°¢&V†f–÷#¢&VGV6VDÖ÷F–öâæÖF6†W2ò&WFò"¢'6Öö÷F‚"À¢&Æö6³¢'7F'B"À¢Ò“°¢Ò“°¢Ò“°§Ò“° ¦gVæ7F–öâWFFT7F—fTæf–vF–öâ‚’°¢ædg&ÖRÒ°¢6öç7Bfö7W4Æ–æRÒv–æF÷rç67&öÆÅ’²ÖF‚æÖ–â‡v–æF÷ræ–ææW$†V–v‡B¢ã3BÂ#ƒ“°¢ÆWB7F—fRÒçVÆÃ°¢G&6¶VE6V7F–öç2æf÷$V6‚‚†—FVÒ’Óâ°¢–b†—FVÒç6V7F–öâæöfg6WEF÷ÃÒfö7W4Æ–æR’7F—fRÒ—FVÓ°¢Ò“°¢–b‡G&6¶VE6V7F–öç5³Òbbfö7W4Æ–æRÂG&6¶VE6V7F–öç5³Òç6V7F–öâæöfg6WEF÷’7F—fRÒçVÆÃ° ¢G&6¶VE6V7F–öç2æf÷$V6‚‚†—FVÒ’Óâ°¢6öç7B—47W'&VçBÒ—FVÒÓÓÒ7F—fS°¢—FVÒæÆ–æ²æ6Æ74Æ—7BçFövvÆR‚&—2Ö7W'&VçB"Â—47W'&VçB“°¢–b†—47W'&VçB’—FVÒæÆ–æ²ç6WDGG&–'WFR‚&&–Ö7W'&VçB"Â&Æö6F–öâ"“°¢VÇ6R—FVÒæÆ–æ²ç&VÖ÷fTGG&–'WFR‚&&–Ö7W'&VçB"“°¢Ò“°§Ğ ¦gVæ7F–öâ66†VGVÆT7F—fTæf–vF–öâ‚’°¢–b†ædg&ÖR’&WGW&ã°¢ædg&ÖRÒ&WVW7Dæ–ÖF–öäg&ÖR‡WFFT7F—fTæf–vF–öâ“°§Ğ §v–æF÷ræFDWfVçDÆ—7FVæW"‚'67&öÆÂ"Â66†VGVÆT7F—fTæf–vF–öâÂ²76—fS¢G'VRÒ“°§v–æF÷ræFDWfVçDÆ—7FVæW"‚'&W6—¦R"Â66†VGVÆT7F—fTæf–vF–öâ“°§WFFT7F—fTæf–vF–öâ‚“°