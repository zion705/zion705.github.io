const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d");
const pointer = { x: 0.5, y: 0.45 };
let width = 0;
let height = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawScene(time) {
  ctx.clearRect(0, 0, width, height);
  const cell = width < 720 ? 11 : 14;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const cx = width * pointer.x;
  const cy = height * pointer.y;

  ctx.font = `${Math.max(9, cell - 3)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const px = x * cell + cell * 0.5;
      const py = y * cell + cell * 0.5;
      const nx = (px / width - 0.5) * 2;
      const ny = (py / height - 0.5) * 2;
      const wave =
        Math.sin(nx * 8 + time * 0.0012) +
        Math.cos(ny * 7 - time * 0.001) +
        Math.sin((nx + ny) * 6 + time * 0.0008);
      const cursor = Math.max(0, 1 - Math.hypot(px - cx, py - cy) / 260);
      const mask = Math.max(0, 1 - Math.hypot(nx * 0.94, ny * 1.32));
      const alpha = Math.max(0, wave * 0.18 + cursor * 0.9 + mask * 0.5 - 0.34);
      if (alpha <= 0.03) continue;

      const glyphs = ".:+=*#%@";
      const index = Math.min(glyphs.length - 1, Math.floor(alpha * glyphs.length));
      const hue = 230 + wave * 18 + cursor * 56;
      ctx.fillStyle = `hsla(${hue}, 78%, ${38 + cursor * 18}%, ${Math.min(alpha * 0.82, 0.78)})`;
      ctx.fillText(glyphs[index], px, py);
    }
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280);
  grad.addColorStop(0, "rgba(65, 87, 255, 0.11)");
  grad.addColorStop(1, "rgba(65, 87, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  requestAnimationFrame(drawScene);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = event.clientY / window.innerHeight;
  const cursor = document.querySelector("#cursorDot");
  if (cursor) {
    cursor.style.opacity = "1";
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  }
});
resize();
requestAnimationFrame(drawScene);

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
