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

  requestAnimationFrame(drawScene);
}

window.addEventListener("resize", resize);
const sceneSection = document.querySelector(".scene-section");
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

const heroScene = document.querySelector(".scene-section");
const heroCopy = document.querySelector(".hero-copy");
const viewfinder = document.querySelector(".viewfinder");
function updateHeroFade() {
  const progress = Math.min(window.scrollY / (window.innerHeight * 0.72), 1);
  const opacity = Math.max(0, 1 - progress * 1.25);
  if (heroCopy) {
    const isCompact = window.innerWidth <= 840;
    const xOffset = isCompact ? "0" : "-50%";
    const yBase = isCompact ? -42 : -48;
    heroCopy.style.opacity = opacity.toFixed(3);
    heroCopy.style.transform = `translate(${xOffset}, ${yBase - progress * 24}%) scale(${1 - progress * 0.04})`;
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
    if (articles) articles.dataset.hovering = "";
    groups.forEach((item) => item.toggleAttribute("data-active", item === group));
  });
  group.addEventListener("pointerleave", () => {
    if (articles) articles.removeAttribute("data-hovering");
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
      "参与面向 AI Agent 用户场景的 0-1 开源硬件创新项目，将“桌面陪伴终端”的发散方向收敛为“Agent 长任务状态反馈载体”，明确用户需要感知任务是否顺利、是否异常、是否需要介入。",
      "负责梳理用户首次配置与核心使用链路，覆盖设备连接、Agent 选择、形象选择、任务状态理解、异常处理、用量信息展示、解绑与后台运行等场景，输出用户流程、信息优先级、原型方案与验收标准。",
      "在信息展示上做产品取舍：不把所有字段堆给用户，而是判断哪些状态有决策价值；例如弱化不稳定的费用估算，保留 token 消耗、工具调用次数等更稳定、可解释的信息。",
      "提出复用 Codex 宠物生态和社区 UGC 资产的方向，把高成本的“从零生成形象”转化为资产复用、个性化改造和社区传播玩法，降低创作门槛并增强扩散潜力。",
      "参与 README、装配说明、开源审查、品牌与安全合规、嘉立创/GitHub 展示材料、KOC/KOL 名单和传播路径设计，补齐项目从内部 demo 到外部可理解、可复现、可反馈的发布闭环。",
      "使用 AI coding 快速搭建可交互前后端原型，并用 Agent 搭建自动化资产生产工作流，在设计、前端、运营等角色之间加速 MVP 验证；相关传播获得小红书 5k+ 点赞、GitHub 50+ stars、开源平台 8k+ 浏览。"
    ],
    links: [
      {
        label: "开源硬件项目",
        url: "https://oshwhub.com/eda_gqvzlprk/project_cnbmkbjc"
      },
      {
        label: "HachimoDock GitHub",
        url: "https://github.com/YizhengWw/HachimoDock"
      },
      {
        label: "小红书运营主页",
        url: "https://xhslink.com/m/3HigzaMrUu"
      }
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

const portalPages = {
  work: {
    kicker: "Internship / Work",
    title: "实习工作",
    summary: "三段经历共同指向一个问题：怎样把 AI 能力做成用户能理解、能信任、能持续使用的产品系统。",
    items: [
      {
        title: "AI 创新产品经理 · 小米",
        meta: "智能硬件与 AI 生态 | 2026/4 - 2026/7",
        action: "xiaomi"
      },
      {
        title: "大模型策略产品经理 · 百度",
        meta: "文心一言 | 2025/5 - 2025/9",
        action: "baidu"
      },
      {
        title: "AIGC 产品经理 · 扩散未来",
        meta: "布叮 AI 0-1 | 2024/12 - 2025/3",
        action: "buding"
      }
    ]
  },
  projects: {
    kicker: "Projects",
    title: "项目",
    summary: "更偏向可被试用和复盘的产品原型：Agent 反馈、AI 游戏、数字人交互与自动化资产生产。",
    items: [
      {
        title: "AI Agent 多任务执行体验",
        meta: "低打扰、可感知、可恢复的任务反馈系统。"
      },
      {
        title: "《我不是股神》AI 股票派对游戏",
        meta: "清华黑客松最佳创意奖，游戏化学习 + 熟人社交 + AI 复盘。"
      },
      {
        title: "TeleStudio 实时交互数字人模块",
        meta: "数字人设置、实时交互、状态流转、合规与 corner case。"
      }
    ]
  },
  thinking: {
    kicker: "Writing / Notes",
    title: "个人思考",
    summary: "这里会放一些关于 AI 产品、交互实验、模型评测和个人成长的短文。先把它作为一个可继续扩展的子页面入口。",
    items: [
      {
        title: "AI 产品不是把模型能力翻译成按钮",
        meta: "真正重要的是让用户知道系统在做什么、为什么这样做，以及失败后如何恢复。"
      },
      {
        title: "评测是一种产品语言",
        meta: "评测不是只服务算法迭代，也是在定义用户体验里的边界、优先级和信任感。"
      },
      {
        title: "个人品牌应该像实验笔记本",
        meta: "比起罗列结论，更有价值的是展示问题、假设、试错和方法。"
      }
    ]
  },
  early: {
    kicker: "Early path",
    title: "早期经历",
    summary: "从产品设计训练到 AI 产品实践，早期经历更多是在建立审美、结构化表达和把想法做成原型的能力。",
    items: [
      {
        title: "北京理工大学 · 产品设计",
        meta: "从设计研究、交互表达、原型验证进入产品问题。"
      },
      {
        title: "AIGC 工具与内容实验",
        meta: "用小红书、开源社区和 AI coding 验证创意传播与原型效率。"
      },
      {
        title: "跨学科协作",
        meta: "在 UI、算法、前后端、运营之间做翻译和推进。"
      }
    ]
  }
};

const portalPanel = document.querySelector("#portalPanel");
const bubbleButtons = [...document.querySelectorAll("[data-panel]")];
const portalSection = document.querySelector("#portal");

function renderPortalPanel(key) {
  const page = portalPages[key] || portalPages.work;
  portalPanel.innerHTML = `
    <header>
      <span class="eyebrow">${page.kicker}</span>
      <h3>${page.title}</h3>
      <p>${page.summary}</p>
    </header>
    <div class="portal-items">
      ${page.items
        .map(
          (item) => `
            <div class="portal-item">
              <div>
                <strong>${item.title}</strong>
                <span>${item.meta}</span>
              </div>
              ${item.action ? `<button type="button" data-experience="${item.action}">详情</button>` : ""}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

bubbleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    bubbleButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderPortalPanel(button.dataset.panel);
    portalSection?.classList.add("has-panel");
  });
});

const experienceModal = document.querySelector("#experienceModal");
const closeExperience = document.querySelector("#closeExperience");
const modalKicker = document.querySelector("#modalKicker");
const modalTitle = document.querySelector("#modalTitle");
const modalMeta = document.querySelector("#modalMeta");
const modalBody = document.querySelector("#modalBody");

function syncDialogState() {
  const hasOpenDialog = [...document.querySelectorAll("dialog")].some((dialog) => dialog.open);
  document.documentElement.classList.toggle("dialog-open", hasOpenDialog);
  document.body.classList.toggle("dialog-open", hasOpenDialog);
}

function openExperience(key) {
  const data = experiences[key];
  if (!data) return;
  modalKicker.textContent = data.kicker;
  modalTitle.textContent = data.title;
  modalMeta.textContent = data.meta;
  const points = `<ul>${data.points.map((point) => `<li>${point}</li>`).join("")}</ul>`;
  const links = data.links?.length
    ? `<div class="modal-links">${data.links
        .map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`)
        .join("")}</div>`
    : "";
  modalBody.innerHTML = `${links}${points}`;
  experienceModal.showModal();
  syncDialogState();
}

function closeExperienceModal() {
  experienceModal.close();
  syncDialogState();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-experience]");
  if (button) openExperience(button.dataset.experience);
});
closeExperience.addEventListener("click", closeExperienceModal);
experienceModal.addEventListener("click", (event) => {
  if (event.target === experienceModal) closeExperienceModal();
});
experienceModal.addEventListener("close", syncDialogState);

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

const messageStorageKey = "liuwanzheng-portfolio-messages";
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
    message: "水泡入口很适合继续扩展成文章索引，期待后面看到更多 AI 产品复盘。",
    createdAt: "2026-07-03T08:16:00.000Z"
  }
];
const messageList = document.querySelector("#messageList");
const messageDialog = document.querySelector("#messageDialog");
const messageForm = document.querySelector("#messageForm");
const openMessageDialog = document.querySelector("#openMessageDialog");
const closeMessageDialog = document.querySelector("#closeMessageDialog");
const messageName = document.querySelector("#messageName");
const messageText = document.querySelector("#messageText");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function loadMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(messageStorageKey));
    return Array.isArray(stored) && stored.length ? stored : defaultMessages;
  } catch {
    return defaultMessages;
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(messageStorageKey, JSON.stringify(messages));
  } catch {
    // Some privacy modes block storage; keep rendering the in-memory state for this session.
  }
}

let messageState = loadMessages();

function renderMessages() {
  if (!messageList) return;
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

openMessageDialog?.addEventListener("click", () => {
  messageDialog.showModal();
  syncDialogState();
  requestAnimationFrame(() => messageName.focus());
});
closeMessageDialog?.addEventListener("click", () => messageDialog.close());
messageDialog?.addEventListener("click", (event) => {
  if (event.target === messageDialog) messageDialog.close();
});
messageDialog?.addEventListener("close", syncDialogState);
messageForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = messageName.value.trim();
  const message = messageText.value.trim();
  if (!name || !message) return;
  messageState = [{
    name,
    message,
    createdAt: new Date().toISOString(),
  }, ...messageState].slice(0, 24);
  saveMessages(messageState);
  renderMessages();
  messageForm.reset();
  messageDialog.close();
});
renderMessages();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (experienceModal.open) closeExperienceModal();
    if (messageDialog?.open) messageDialog.close();
  }
});

function tickClock() {
  document.querySelector("#clock").textContent = new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
  });
}
tickClock();
setInterval(tickClock, 1000);
