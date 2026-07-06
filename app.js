const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d");
const pointer = { x: 0.5, y: 0.52, targetX: 0.5, targetY: 0.52, active: false };
const revealTrail = [];
let width = 0;
let height = 0;
let dpr = 1;
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const revealCanvas = document.createElement("canvas");
const revealCtx = revealCanvas.getContext("2d");
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
  revealCanvas.width = canvas.width;
  revealCanvas.height = canvas.height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  revealCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

function paintRevealMask(time) {
  maskCtx.save();
  maskCtx.globalCompositeOperation = "destination-out";
  maskCtx.fillStyle = pointer.active ? "rgba(0, 0, 0, 0.026)" : "rgba(0, 0, 0, 0.05)";
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

function drawScene(time) {
  ctx.clearRect(0, 0, width, height);

  drawImageCover(ctx, dryWood);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createRadialGradient(width * 0.5, height * 0.5, height * 0.1, width * 0.5, height * 0.52, height * 0.72);
  shade.addColorStop(0, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(225,220,207,0.28)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  paintRevealMask(time);

  revealCtx.clearRect(0, 0, width, height);
  drawImageCover(revealCtx, sproutWood);
  revealCtx.save();
  revealCtx.globalCompositeOperation = "destination-in";
  revealCtx.drawImage(maskCanvas, 0, 0, width, height);
  revealCtx.restore();

  ctx.drawImage(revealCanvas, 0, 0, width, height);

  if (pointer.active) {
    const x = pointer.x * width;
    const y = pointer.y * height;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, Math.min(width, height) * 0.24);
    glow.addColorStop(0, "rgba(151, 219, 77, 0.16)");
    glow.addColorStop(0.5, "rgba(151, 219, 77, 0.08)");
    glow.addColorStop(1, "rgba(151, 219, 77, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  requestAnimationFrame(drawScene);
}

window.addEventListener("resize", resize);
const sceneSection = document.querySelector(".scene-section");
sceneSection.addEventListener("pointermove", (event) => {
  const rect = sceneSection.getBoundingClientRect();
  pointer.targetX = (event.clientX - rect.left) / rect.width;
  pointer.targetY = (event.clientY - rect.top) / rect.height;
  pointer.active = true;
  const cursor = document.querySelector("#cursorDot");
  if (cursor) {
    cursor.style.opacity = "1";
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  }
});
sceneSection.addEventListener("pointerleave", () => {
  pointer.active = false;
  revealTrail.length = 0;
});
resize();
Promise.all([
  dryWood.decode().catch(() => undefined),
  sproutWood.decode().catch(() => undefined),
]).then(() => requestAnimationFrame(drawScene));

const heroScene = document.querySelector(".scene-section");
const heroCopy = document.querySelector(".hero-copy");
const viewfinder = document.querySelector(".viewfinder");
function updateHeroFade() {
  const progress = Math.min(window.scrollY / (window.innerHeight * 0.72), 1);
  const opacity = Math.max(0, 1 - progress * 1.25);
  if (heroCopy) {
    heroCopy.style.opacity = opacity.toFixed(3);
    heroCopy.style.transform = `translate(-50%, ${-48 - progress * 24}%) scale(${1 - progress * 0.04})`;
    heroCopy.style.filter = `blur(${progress * 8}px)`;
  }
  if (viewfinder) {
    viewfinder.style.opacity = String(Math.max(0.05, 0.34 - progress * 0.28));
    viewfinder.style.transform = `translate(-50%, -50%) scale(${1 + progress * 0.16})`;
  }
  if (heroScene) {
    heroScene.style.opacity = String(Math.max(0.72, 1 - progress * 0.28));
  }
}
window.addEventListener("scroll", updateHeroFade, { passive: true });
updateHeroFade();

const articles = document.querySelector(".articles");
const groups = [...document.querySelectorAll("[data-year-group]")];
groups.forEach((group) => {
  group.addEventListener("pointerenter", () => {
    articles.dataset.hovering = "";
    groups.forEach((item) => item.toggleAttribute("data-active", item === group));
  });
  group.addEventListener("pointerleave", () => {
    articles.removeAttribute("data-hovering");
    groups.forEach((item) => item.removeAttribute("data-active"));
  });
});

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789产品评测原型";
function scrambleText(element) {
  const original = element.dataset.original || element.textContent;
  element.dataset.original = original;
  let frame = 0;
  const max = 13;
  clearInterval(element._scrambleTimer);
  element._scrambleTimer = setInterval(() => {
    element.textContent = original
      .split("")
      .map((char, index) => {
        if (char === " " || index < frame / 1.65) return char;
        return alphabet[Math.floor(Math.random() * alphabet.length)];
      })
      .join("");
    frame += 1;
    if (frame > max) {
      clearInterval(element._scrambleTimer);
      element.textContent = original;
    }
  }, 22);
}

document.querySelectorAll(".article-link").forEach((link) => {
  link.addEventListener("pointerenter", () => {
    const title = link.querySelector("[data-scramble]");
    if (title) scrambleText(title);
  });
});

const experiences = {
  xiaomi: {
    kicker: "Xiaomi / AI Innovation",
    title: "AI 创新产品经理 · 小米",
    meta: "智能硬件与 AI 生态 | 2026/4 - 2026/7",
    points: [
      "参与 AI 创新项目 0-1，面向 Agent 多任务执行场景，拆解等待执行、设备连接、状态切换、结果回收中的失控感与打扰感。",
      "围绕首次配置、设备连接、Agent 选择、状态反馈、用量信息展示等链路，输出用户流程、信息优先级、原型方案和验收标准。",
      "主动提出兼容 Codex 宠物生态与 UGC 资产的产品方向，将高成本的从零生成转化为资产复用、个性化改造和社区传播玩法。",
      "使用 AI coding 搭建可交互前后端原型，并用 Agent 搭建自动化资产生产工作流；相关项目获小红书 5k+ 点赞、GitHub 50+ stars、开源平台 8k+ 浏览。"
    ]
  },
  baidu: {
    kicker: "Baidu / Wenxin",
    title: "大模型策略产品经理 · 百度",
    meta: "文心一言 | 2025/5 - 2025/9",
    points: [
      "基于日志分析、用户研究、代表性多轮 case、竞品与外部 benchmark，梳理闲聊/陪伴场景的用户动机、高频话题与失败样本。",
      "参与设计聊天扮演评测方案，覆盖评估目标、能力拆解、数据来源、构建方式、评分标准、问题标签体系和校验方案。",
      "构建 300+ 单轮 query、80+ 多轮 session 评估集，结合人工评估、GSB 排序、问题标签与多结果排序支撑策略优化。",
      "针对俚语/网络用语理解不足，构建 500+ 条 query SFT 数据与 100+ 条 response 数据，联合算法送训并完成训练前后盲评。",
      "设计“小言陪聊”Web 端从入口曝光、话题触发、多轮承接到互动反馈的链路，形成数据采集与持续优化闭环。"
    ]
  },
  buding: {
    kicker: "AIGC Startup / Buding AI",
    title: "AIGC 产品经理 · 扩散未来",
    meta: "北京扩散未来科技有限公司 | 2024/12 - 2025/3",
    points: [
      "全权负责“布叮 AI”从立项、产品方案、PRD/原型、技术路线到上线验收的闭环，推动 C 端 AIGC 应用在 1 个月内春节前上线。",
      "在未充分运营情况下获得 200+ 新增用户、97% 激活率、8.8% 留存和 13 位首次付费用户。",
      "输出竞品分析、低保真原型、PRD，调研表情包场景并按优先级拆解 70+ 设计需求。",
      "对接 UI/品牌外包、前后端与算法团队，每日同步进度并完成设计/开发验收，推动 P0 缺陷率从 8% 降至 1.2%。",
      "正式研发前先上线落地页验证需求，设计“小红书内容投放 - 微信落地页 - 照片提交/客服沟通”转化漏斗。"
    ]
  }
};

const experienceModal = document.querySelector("#experienceModal");
const closeExperience = document.querySelector("#closeExperience");
const modalKicker = document.querySelector("#modalKicker");
const modalTitle = document.querySelector("#modalTitle");
const modalMeta = document.querySelector("#modalMeta");
const modalBody = document.querySelector("#modalBody");

function openExperience(key) {
  const data = experiences[key];
  if (!data) return;
  modalKicker.textContent = data.kicker;
  modalTitle.textContent = data.title;
  modalMeta.textContent = data.meta;
  modalBody.innerHTML = `<ul>${data.points.map((point) => `<li>${point}</li>`).join("")}</ul>`;
  experienceModal.showModal();
  document.body.classList.add("modal-open");
}

function closeExperienceModal() {
  experienceModal.close();
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-experience]").forEach((button) => {
  button.addEventListener("click", () => openExperience(button.dataset.experience));
});
closeExperience.addEventListener("click", closeExperienceModal);
experienceModal.addEventListener("click", (event) => {
  if (event.target === experienceModal) closeExperienceModal();
});
experienceModal.addEventListener("close", () => document.body.classList.remove("modal-open"));

const controls = [...document.querySelectorAll("[data-control]")];
const scoreEl = document.querySelector("#score");
const moodEl = document.querySelector("#mood");
function updateTuner() {
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

const command = document.querySelector("#command");
const commandInput = document.querySelector("#commandInput");
function openCommand() {
  command.showModal();
  requestAnimationFrame(() => commandInput.focus());
}
document.querySelector("#openCommand").addEventListener("click", openCommand);
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommand();
  }
  if (event.key === "Escape") {
    if (experienceModal.open) closeExperienceModal();
    if (command.open) command.close();
  }
});
command.addEventListener("click", (event) => {
  if (event.target === command || event.target.tagName === "A") command.close();
});
commandInput.addEventListener("input", () => {
  const query = commandInput.value.trim().toLowerCase();
  document.querySelectorAll(".command a").forEach((link) => {
    link.hidden = query && !link.textContent.toLowerCase().includes(query);
  });
});

function tickClock() {
  document.querySelector("#clock").textContent = new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
  });
}
tickClock();
setInterval(tickClock, 1000);
