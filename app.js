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
  const verticalOffset = width > 840 ? height * 0.075 : 0;
  return {
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2 + verticalOffset,
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

const ambientCanvas = document.querySelector("#ambientScene");
const ambientCtx = ambientCanvas?.getContext("2d");
if (ambientCanvas && ambientCtx) {
  const ambientMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ambientPointer = { x: 0.5, y: 0.42, targetX: 0.5, targetY: 0.42, strength: 0.18 };
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
    if (!ambientMotion.matches && time - lastAmbientFrame < 34) {
      requestAnimationFrame(drawAmbient);
      return;
    }
    lastAmbientFrame = time;
    ambientPointer.x += (ambientPointer.targetX - ambientPointer.x) * 0.04;
    ambientPointer.y += (ambientPointer.targetY - ambientPointer.y) * 0.04;
    ambientPointer.strength += (0.18 - ambientPointer.strength) * 0.022;

    const phase = time * 0.00072;
    const pixels = ambientPixels.data;
    for (let y = 0; y < ambientHeight; y += 1) {
      const v = y / Math.max(ambientHeight - 1, 1);
      for (let x = 0; x < ambientWidth; x += 1) {
        const u = x / Math.max(ambientWidth - 1, 1);
        const dx = u - ambientPointer.x;
        const dy = v - ambientPointer.y;
        const pointerShift = Math.exp(-(dx * dx + dy * dy) * 15) * ambientPointer.strength;
        const waterU = u + Math.sin(v * 8.2 + phase * 1.3) * 0.055 + dx * pointerShift * 0.07;
        const waterV = v + Math.cos(u * 7.4 - phase) * 0.05 + dy * pointerShift * 0.07;
        const swell =
          Math.sin(waterU * 9.5 + phase * 1.2) * 0.34 +
          Math.cos(waterV * 8.6 - phase * 0.82) * 0.31 +
          Math.sin((waterU + waterV) * 6.8 + phase * 0.55) * 0.23 +
          Math.cos((waterU - waterV) * 5.4 - phase * 0.7) * 0.12;
        const ripple = Math.sin(waterU * 18 + phase * 2.1) * Math.cos(waterV * 15 - phase * 1.65);
        const caustic = Math.pow(Math.max(0, 1 - Math.abs(ripple)), 3);
        const light = Math.min(1, Math.max(0, 0.48 + swell * 0.48 + caustic * 0.42));
        const warmth = 0.5 + 0.5 * Math.sin(waterU * 4.2 - waterV * 3.1 + phase * 0.35);
        const index = (y * ambientWidth + x) * 4;
        pixels[index] = Math.round(93 + warmth * 43 + light * 34 + caustic * 30);
        pixels[index + 1] = Math.round(128 + (1 - warmth) * 30 + light * 42 + caustic * 26);
        pixels[index + 2] = Math.round(83 + (1 - warmth) * 34 + light * 28 + caustic * 18);
        pixels[index + 3] = Math.round(68 + light * 94 + caustic * 52);
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
      ambientPointer.targetX = Math.min(1, Math.max(0, x));
      ambientPointer.targetY = Math.min(1, Math.max(0, y));
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) ambientPointer.strength = 0.9;
    },
    { passive: true }
  );
  window.addEventListener("pointerleave", () => {
    ambientPointer.targetX = 0.5;
    ambientPointer.targetY = 0.42;
  });
  resizeAmbient();
  if (ambientMotion.matches) drawAmbient();
  else requestAnimationFrame(drawAmbient);
}

const heroScene = document.querySelector(".scene-section");
const heroCopy = document.querySelector(".hero-copy");
const viewfinder = document.querySelector(".viewfinder");
const pageWaterField = document.querySelector(".page-water-field");
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
  if (pageWaterField) {
    const travel = Math.min(window.scrollY, window.innerHeight * 0.82);
    const shift = Math.max(0, window.innerHeight * 0.58 - travel);
    pageWaterField.style.setProperty("--water-shift", `${shift.toFixed(1)}px`);
  }
}
window.addEventListener("scroll", updateHeroFade, { passive: true });
window.addEventListener("resize", updateHeroFade);
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
      "【产品定义】参与 AI 创新项目 0-1，面向 Agent 多任务场景，拆解用户在等待任务执行过程中的失控感等问题，定义低打扰的任务反馈体验。",
      "【方案设计】参与用户配置入口与核心功能体验设计，围绕首次配置、设备连接、Agent 选择、状态反馈、用量信息展示等链路，输出用户流程、信息优先级、原型方案和验收标准，沉淀配置型功能设计方法。",
      "【内容策略】主动提出兼容 Codex 宠物生态与 UGC 资产的方向，将“从零生成形象”的高成本方案转化为更低门槛的资产复用和个性化玩法，降低用户创作成本并增强传播潜力。",
      "【AI-native】通过 AI coding 快速搭建可交互前后端原型；用 Agent 搭建自动化资产生产工作流；深度使用 AI 提效并在项目早期跨设计、前端、运营等角色加速推动 MVP 上线。项目获得小红书 5k+ 点赞、GitHub 50+ stars、开源平台 8k+ 浏览，并基于反馈持续验证迭代。"
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
      "【理想态调研 · 闲聊】基于日志分析、用户研究、数十条代表性多轮 case、竞品与外部 benchmark，梳理闲聊/陪伴场景的用户动机、高频话题与失败样本；引入 Kano 模型区分基础、期望与惊喜需求，将“聊得好”拆解为多轮连贯性、主动性、吸引力、人设稳定等能力框架。",
      "【模型评测】参与设计聊天扮演评测方案，覆盖评估目标设定、能力拆解、数据来源与分布、构建方式、评分标准、问题标签体系和校验方案；构建 300+ 单轮 query、80+ 多轮 session 评估集，结合人工评估、GSB 排序、问题标签与多结果排序支撑结果解读和策略优化。",
      "【模型能力优化 · 俚语】针对 LMArena 与线上日志中“俚语/网络用语理解不足”导致的高频意图误解，拆分输入理解与输出表达问题；结合 Bad Case、开源数据集和互联网热梗构建 500+ 条 query SFT 数据与 100+ 条 response 数据，联合算法送训并完成训练前后盲评，推动俚语理解、文化适配与首轮体验提升。",
      "【端功能产品设计 · 小言陪聊】为解决聊天扮演数据量小、缺少后验反馈的问题，设计“小言陪聊”Web 端从入口曝光、话题触发、多轮承接到互动反馈的链路；定义主链路、智能体广场、CMS 后台需求，并设计人设 Prompt、预置话题、推荐回复策略及多轮、基础、话题评估集，形成数据采集与持续优化闭环。"
    ]
  },
  buding: {
    kicker: "AIGC Startup / Buding AI",
    title: "AIGC 产品经理 · 扩散未来",
    meta: "北京扩散未来科技有限公司 | 2024/12 - 2025/3",
    points: [
      "【产品负责人】全权负责“布叮 AI”从立项、产品方案、PRD/原型、技术路线到上线验收的闭环，推动公司 C 端 AIGC 应用在 1 个月内春节前上线；在未充分运营情况下获得 200+ 新增用户、97% 激活率、8.8% 留存和 13 位首次付费用户。",
      "【项目管理】输出竞品分析、低保真原型、PRD，调研表情包场景并按优先级拆解 70+ 设计需求；对接 UI/品牌外包、前后端与算法团队，每日同步进度并完成设计/开发验收，推动 P0 缺陷率从 8% 降至 1.2%。",
      "【MVP 实验】正式研发前先上线落地页验证需求，设计“小红书内容投放 - 微信落地页 - 照片提交/客服沟通”转化漏斗，验证用户兴趣、风格偏好和基础付费可能性，并据此调整风格重点与收费策略。"
    ]
  },
  nearu: {
    kicker: "AI Companion / nearU",
    title: "在旁 nearU · 睡前 AI 陪伴",
    meta: "产品定位、功能架构与商业验证 | 2025/12 - 更新中",
    intro:
      "专为睡前场景设计的声音 AI 陪伴产品。它不替用户完成睡眠，而是在夜间孤独、反刍思维和入睡前的低刺激时间里，提供一段可持续的陪伴关系。",
    tags: ["场景化 AI", "声音交互", "长期记忆", "关系留存", "商业验证"],
    highlights: [
      {
        label: "场景定位",
        title: "睡前，而不是泛陪伴",
        text: "以夜晚为共同语境，围绕助眠、疗愈和生活管理控制刺激强度。"
      },
      {
        label: "核心路径",
        title: "声音吸引 → 有话聊 → 关系维护",
        text: "把一次通话组织为能被记住、被召回并逐步加深的关系体验。"
      },
      {
        label: "验证目标",
        title: "付费意愿 × 夜间留存",
        text: "MVP 优先验证用户是否愿意为这一刻的陪伴付费，并在夜晚持续回来。"
      }
    ],
    points: [
      "从泛 AI 陪伴收敛到睡前场景：夜间孤独、焦虑与反刍思维更容易被激活，而高刺激屏幕内容又会进一步损害睡眠，产品机会是用低刺激声音交互承接这段时间。",
      "搭建“发现旁友 - 话题畅聊 - 关系维护”的完整链路。体验前用声音滑选与人格化角色建立吸引力；体验中提供哄睡、故事、白噪音、冥想和语聊；体验后通过长期记忆、动态事件、主动来电与待办维持关系。",
      "明确产品边界：所有能力服务于睡前场景，面向长期稳定的陪伴需求，而不是通过强刺激剧情制造短期多巴胺反馈。AI 是关系与服务的载体，不包装为真人或医疗方案。",
      "早期信号包括：讲故事智能体已有 4000+ 人互动，真人陪聊平台中的哄睡服务订单占比约 10%。这些只能证明需求存在，下一步仍需通过 Trial→Paid、通话完成率和 D7/D30 夜间留存验证产品价值。",
      "MVP 聚焦声音滑选、单次连麦和主打角色，暂不一次性建设完整角色宇宙；增长实验围绕免费完整通话与试听片段的转化差异、种子用户留存、KOL 渠道 CAC 展开。"
    ],
    document: {
      src: "./assets/documents/nearu-bp.pdf",
      title: "在旁 nearU 完整商业计划书"
    }
  },
  telestudio: {
    kicker: "China Telecom / TeleStudio",
    title: "Tele AI 产品经理 · 中国电信人工智能研究院",
    meta: "TeleStudio 实时交互数字人 | 2026/03",
    intro:
      "负责 TeleStudio 实时交互数字人需求设计，把平台已有的图片、视频与音频生成能力延伸为可创建、可配置、可实时交流的数字人体验。",
    tags: ["数字人", "实时交互", "AIGC 平台", "信息架构", "合规策略"],
    highlights: [
      {
        label: "产品目标",
        title: "补全 AIGC 创作链路",
        text: "从图片、视频、音频生成延伸到可配置、可实时交流的数字人体验。"
      },
      {
        label: "核心路径",
        title: "首页 → 设置 → 实时交互",
        text: "兼容预设形象直接体验和自定义配置后进入两条不同使用路径。"
      },
      {
        label: "产品边界",
        title: "P0 主链路，P1 合规",
        text: "优先保证配置与对话闭环，再补齐全链路双重 AI 合规校验。"
      }
    ],
    points: [
      "【需求链路拆解】拆解实时交互数字人的产品目标、用户路径、页面结构与优先级，设计“首页 - 设置 - 实时交互”三类页面和预设直达、自定义配置两档路径，输出 PRD、原型、状态流转与验收口径。",
      "【AI 数字人设计】围绕形象、音色、人设与 system prompt 四维配置，定义候选生成、试听、编辑和留存规则；同步设计对话上下文、特定 query 触发与全链路合规校验。",
      "【交互与异常治理】以低门槛、低延迟为体验目标，设计主动开场、音画同步、逐字回复与 500 字多行输入，并补齐加载失败、网络卡顿、任务重启、违规拦截和临时对话清空等 corner case。"
    ],
    document: {
      src: "./assets/documents/telestudio-digital-human-prd.pdf",
      title: "TeleStudio 数字人完整产品需求文档"
    }
  },
  wakeargue: {
    kicker: "AI Wake-up / Behavioral Intervention",
    title: "老己 · AI 对话式起床干预",
    meta: "产品定位、交互机制与真实使用验证 | 独立产品实验",
    intro:
      "一款面向反复赖床用户的 AI 起床干预 App。它不试图把闹钟做得更响，而是用必须回应的实时对话，把用户从“听见闹钟”推进到“进入认知活跃并确认清醒”。",
    tags: ["行为干预", "语音交互", "主动式 AI", "人格化体验", "独立产品"],
    highlights: [
      {
        label: "问题重构",
        title: "不是没醒，是没进入清醒状态",
        text: "传统闹钟完成声音触达，却无法阻止用户在低认知状态下自动关闭。"
      },
      {
        label: "核心机制",
        title: "对话义务 × 沉默追问",
        text: "AI 主动发起争辩，用户停止回应时继续追问，直到显式确认清醒。"
      },
      {
        label: "验证重点",
        title: "起床完成率，而不是打开率",
        text: "用清醒确认、对话时长、重复赖床和晨间留存判断是否真的促成行为。"
      }
    ],
    points: [
      "从用户真实失败路径定义机会：闹钟能叫醒身体，但关掉闹钟、多睡十分钟几乎不需要思考；产品要解决的是从睡眠惯性进入认知活跃的过渡。",
      "把“明早一定起”设计为一个有承诺感的夜间契约：设置唤醒时间、预期起床时间、起床理由与互动方式，在睡前先完成一次行为承诺。",
      "晨间由 AI 主动发起实时对话，不允许用户只完成一次点击；争辩、语音或文字回应和沉默后的连续追问共同制造认知负荷，最终以“确认已清醒”结束流程。",
      "人格化不是装饰，而是干预强度控制。用户需要预先同意语气和互动边界，系统必须提供停止条件、敏感内容保护、降级闹钟和通知、语音权限兜底。",
      "小红书内容记录了真实自用场景与早期反馈，但当前互动量只能视为需求共鸣信号。下一步应跟踪起床完成率、平均唤醒对话轮次、重复赖床率、D7 晨间留存与负反馈率。"
    ],
    links: [
      {
        label: "查看小红书发布",
        url: "https://www.xiaohongshu.com/discovery/item/695ce8e9000000000d00b66b"
      }
    ],
    gallery: [
      {
        src: "./assets/lazywake/morning-dialogue.webp",
        alt: "老己 App 晨间 AI 对话干预界面",
        caption: "晨间干预：用户提出“再睡十分钟”，AI 不接受一次点击式跳过，而是继续要求回应。"
      },
      {
        src: "./assets/lazywake/active-pursuit.webp",
        alt: "老己 App 连续追问界面",
        caption: "沉默追问：当用户停止回复时，AI 主动延续对话，避免重新滑回睡眠。"
      },
      {
        src: "./assets/lazywake/sleep-contract.webp",
        alt: "老己 App 睡前契约设置界面",
        caption: "睡前契约：提前设置唤醒时间、目标时间、起床方式与真实理由。"
      },
      {
        src: "./assets/lazywake/persona-consent.webp",
        alt: "老己 App 人格互动授权界面",
        caption: "边界授权：在启用高强度人格互动前明确授权，并保留取消和停止条件。"
      },
      {
        src: "./assets/lazywake/sleep-mode.webp",
        alt: "老己 App 睡眠待机界面",
        caption: "睡眠待机：用低信息密度的等待页保持状态明确，把注意力留给第二天的唤醒任务。"
      }
    ]
  },
  design: {
    kicker: "Early Works / Product Design",
    title: "本科产品设计课程作品集",
    meta: "北京理工大学 · 产品设计 | 2022 - 2024",
    intro:
      "本科阶段的产品设计训练，覆盖从社会问题与用户研究，到工业产品、智能硬件、交互原型和真实项目落地。它也是我后来进入 AI 产品工作的能力底座。",
    tags: ["设计研究", "可持续设计", "智能硬件", "工业设计", "AI 辅助设计"],
    highlights: [
      {
        label: "Research",
        title: "从真实问题出发",
        text: "将社会议题、用户行为和数据分析转化为明确的设计机会。"
      },
      {
        label: "Prototype",
        title: "让概念能够被验证",
        text: "通过建模、电子原型、交互流程与实体制作验证方案。"
      },
      {
        label: "Delivery",
        title: "走向工程与真实场景",
        text: "参与企业项目、工程装备、竞赛展示和社会服务，理解落地约束。"
      }
    ],
    points: [
      "以真实问题为起点：从贫困家庭的蛋白质获取、视障人群出行，到青年金融健康和工厂火灾预警，把设计对象从单一造型扩展为完整系统。",
      "能力跨度覆盖可持续产品、无障碍交互、工程装备、健康数据实体化、设计调研与 AI 辅助迭代，并持续练习如何在技术、用户和商业约束之间做取舍。",
      "形成“研究 - 定义 - 概念 - 原型 - 验证 - 表达”的工作方法，为之后承担产品定位、信息架构和端到端体验设计奠定基础。"
    ],
    document: {
      src: "./assets/documents/early-product-design.pdf",
      title: "本科产品设计课程完整作品集"
    }
  }
};

document.querySelectorAll("[data-work-points]").forEach((list) => {
  const experience = experiences[list.dataset.workPoints];
  if (!experience?.points?.length) return;
  list.innerHTML = experience.points
    .map((point, index) => {
      const match = point.match(/^【([^】]+)】\s*(.*)$/);
      const label = match?.[1] || "核心职责";
      const detail = match?.[2] || point;
      return `<li>
        <span>${String(index + 1).padStart(2, "0")}</span>
        <div>
          <strong>${label}</strong>
          <p>${detail}</p>
        </div>
      </li>`;
    })
    .join("");
});

const portalPages = {
  work: {
    kicker: "Internship / Work",
    title: "实习工作",
    summary: "四段经历共同指向一个问题：怎样把 AI 能力做成用户能理解、能信任、能持续使用的产品系统。",
    items: [
      {
        title: "AI 创新产品经理 · 小米",
        meta: "智能硬件与 AI 生态 | 2026/4 - 2026/7",
        action: "xiaomi"
      },
      {
        title: "Tele AI 产品经理 · 中国电信人工智能研究院",
        meta: "TeleStudio 实时交互数字人 | 2026/3",
        action: "telestudio"
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
    summary: "更偏向可被试用和复盘的产品原型：Agent 反馈、AI 游戏、陪伴产品与行为干预实验。",
    items: [
      {
        title: "AI Agent 多任务执行体验",
        meta: "低打扰、可感知、可恢复的任务反馈系统。"
      },
      {
        title: "《我不是股神》AI 股票派对游戏",
        meta: "清华黑客松最佳创意奖，游戏化学习 + 熟人社交 + AI 复盘。",
        case: "stock-party"
      },
      {
        title: "在旁 nearU · 睡前 AI 陪伴",
        meta: "以声音心动为入口，用场景绑定与长期记忆建立低刺激陪伴关系。",
        action: "nearu"
      },
      {
        title: "老己 · AI 对骂起床 App",
        meta: "用主动对话和沉默追问，把“闹钟响了”推进到“用户真正清醒”。",
        action: "wakeargue"
      }
    ]
  },
  early: {
    kicker: "Early path",
    title: "早期经历",
    summary: "从产品设计训练到 AI 产品实践，早期经历更多是在建立审美、结构化表达和把想法做成原型的能力。",
    items: [
      {
        title: "本科产品设计课程作品集",
        meta: "从设计研究、智能硬件到真实项目，形成产品方法的早期训练。",
        action: "design"
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
const experienceTabs = document.querySelector("#experienceTabs");
const experienceButtons = [...document.querySelectorAll(".experience-tab[data-panel]")];
const portalSection = document.querySelector("#portal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activePortalKey = null;
let lastPortalTrigger = null;

const revealElements = [...document.querySelectorAll("[data-reveal]")];
document.documentElement.classList.add("has-reveal");
if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -9%", threshold: 0.12 }
  );
  revealElements.forEach((element) => revealObserver.observe(element));
}

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const tiltCards = [...document.querySelectorAll("[data-tilt-card]")];
const heroWaterActions = [...document.querySelectorAll(".hero-water-action")];
if (finePointer.matches && !reducedMotion.matches) {
  tiltCards.forEach((card) => {
    let tiltFrame = 0;
    card.addEventListener("pointermove", (event) => {
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      tiltFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
        const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
        const tiltX = -((y / rect.height - 0.5) * 5.5);
        const tiltY = (x / rect.width - 0.5) * 7;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        tiltFrame = 0;
      });
    });
    card.addEventListener("pointerleave", () => {
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      tiltFrame = 0;
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });

  heroWaterActions.forEach((action) => {
    let bubbleFrame = 0;
    action.addEventListener("pointermove", (event) => {
      if (bubbleFrame) cancelAnimationFrame(bubbleFrame);
      bubbleFrame = requestAnimationFrame(() => {
        const rect = action.getBoundingClientRect();
        const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
        const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
        const tiltX = -((y / rect.height - 0.5) * 7);
        const tiltY = (x / rect.width - 0.5) * 9;
        action.style.setProperty("--bubble-x", `${x}px`);
        action.style.setProperty("--bubble-y", `${y}px`);
        action.style.setProperty("--bubble-tilt-x", `${tiltX.toFixed(2)}deg`);
        action.style.setProperty("--bubble-tilt-y", `${tiltY.toFixed(2)}deg`);
        bubbleFrame = 0;
      });
    });
    action.addEventListener("pointerleave", () => {
      if (bubbleFrame) cancelAnimationFrame(bubbleFrame);
      bubbleFrame = 0;
      action.style.setProperty("--bubble-x", "50%");
      action.style.setProperty("--bubble-y", "50%");
      action.style.setProperty("--bubble-tilt-x", "0deg");
      action.style.setProperty("--bubble-tilt-y", "0deg");
    });
  });

}

function renderPortalPanel(key, { focus = false, scroll = false } = {}) {
  const page = portalPages[key];
  if (!page) return;
  activePortalKey = key;
  portalPanel.innerHTML = `
    <header class="portal-panel-head">
      <button class="portal-back ui-back" type="button" data-portal-back>
        <span aria-hidden="true">←</span>
        <span>返回水滴入口</span>
      </button>
      <div class="portal-panel-copy">
        <span class="eyebrow">${page.kicker}</span>
        <h3>${page.title}</h3>
        <p>${page.summary}</p>
      </div>
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
              ${
                item.action
                  ? `<button type="button" data-experience="${item.action}">查看详情</button>`
                  : item.case
                    ? `<button type="button" data-project-case="${item.case}">查看案例</button>`
                    : ""
              }
            </div>
          `
        )
        .join("")}
    </div>
  `;
  experienceTabs.hidden = true;
  portalPanel.hidden = false;
  portalSection.classList.add("has-panel");
  experienceButtons.forEach((button) => {
    button.setAttribute("aria-expanded", String(button.dataset.panel === key));
  });

  if (focus || scroll) {
    requestAnimationFrame(() => {
      if (scroll) {
        portalSection.scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start",
        });
      }
      if (focus) portalPanel.focus({ preventScroll: true });
    });
  }
}

function clearPortalPanel({ focus = false } = {}) {
  const trigger = lastPortalTrigger;
  activePortalKey = null;
  portalSection.classList.remove("has-panel");
  experienceTabs.hidden = false;
  portalPanel.hidden = true;
  portalPanel.innerHTML = "";
  experienceButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));

  if (focus && trigger) {
    requestAnimationFrame(() => {
      trigger.focus({ preventScroll: true });
      portalSection.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }
}

function openPortalCategory(key, trigger) {
  if (!portalPages[key]) return;
  lastPortalTrigger = trigger || experienceButtons.find((button) => button.dataset.panel === key);
  if (window.location.hash !== "#portal") history.replaceState(null, "", "#portal");
  history.pushState({ portalKey: key }, "", `#experience-${key}`);
  renderPortalPanel(key, { focus: true, scroll: true });
}

function syncPortalFromLocation({ focus = false } = {}) {
  const categoryMatch = window.location.hash.match(/^#experience-(work|projects|thinking|early)$/);
  const detailMatch = window.location.hash.match(/^#detail-(xiaomi|baidu|buding|nearu|telestudio|wakeargue|design)$/);
  const projectCaseMatch = window.location.hash.match(/^#project-(stock-party)$/);
  const detailPortalKey = detailMatch
    ? history.state?.portalKey ||
      (["nearu", "wakeargue"].includes(detailMatch[1]) ? "projects" : detailMatch[1] === "design" ? "early" : "work")
    : null;
  const key = categoryMatch?.[1] || detailPortalKey || (projectCaseMatch ? "projects" : null);
  if (key && portalPages[key]) {
    lastPortalTrigger ||= experienceButtons.find((button) => button.dataset.panel === key);
    if (activePortalKey !== key || portalPanel.hidden) renderPortalPanel(key);
  } else {
    const hadActivePanel = Boolean(activePortalKey);
    clearPortalPanel({ focus: focus && hadActivePanel });
  }
}

function requestPortalBack() {
  if (history.state?.portalKey && window.location.hash === `#experience-${activePortalKey}`) {
    history.back();
    return;
  }
  history.replaceState(null, "", "#portal");
  clearPortalPanel({ focus: true });
}

experienceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPortalCategory(button.dataset.panel, button);
  });
});

portalPanel.addEventListener("click", (event) => {
  if (event.target.closest("[data-portal-back]")) requestPortalBack();
});

const stockPartyCase = document.querySelector("#stockPartyCase");
const siteHeader = document.querySelector(".header");
const portfolioMain = document.querySelector(".grid-shell");
const stockPartyDemo = document.querySelector("#stockPartyDemo");
const stockPartyDemoSection = document.querySelector("#case-demo");
const resetStockDemo = document.querySelector("#resetStockDemo");
const loopDetail = document.querySelector("#loopDetail");
const loopButtons = [...document.querySelectorAll("[data-loop-step]")];
const caseLightbox = document.querySelector("#caseLightbox");
const closeCaseLightbox = document.querySelector("#closeCaseLightbox");
const caseLightboxImage = document.querySelector("#caseLightboxImage");
const caseLightboxCaption = document.querySelector("#caseLightboxCaption");
let lastProjectCaseTrigger = null;
let caseProgressFrame = 0;

const loopCopy = {
  input: {
    title: "信息输入",
    detail: "真实新闻、市场传闻和卧底消息共同形成不完全信息环境。",
  },
  judge: {
    title: "独立判断",
    detail: "玩家需要在信息可信度、风险偏好和朋友言论之间形成自己的判断。",
  },
  trade: {
    title: "模拟交易",
    detail: "用模拟资金把判断变成可观察的仓位、时点、成本和收益结果。",
  },
  social: {
    title: "熟人讨论",
    detail: "发言、操作痕迹与嫌疑投票，让交易行为成为有关系张力的话题。",
  },
  review: {
    title: "AI 复盘",
    detail: "AI 结合收益、交易与信息链组织战报，把一次输赢沉淀为下一轮经验。",
  },
};

function ensureStockPartyDemo() {
  if (stockPartyDemo && !stockPartyDemo.getAttribute("src")) {
    stockPartyDemo.setAttribute("src", stockPartyDemo.dataset.src);
  }
}

function updateCaseProgress() {
  caseProgressFrame = 0;
  if (!stockPartyCase || stockPartyCase.hidden) return;
  const scrollable = stockPartyCase.scrollHeight - stockPartyCase.clientHeight;
  const progress = scrollable > 0 ? Math.min(1, stockPartyCase.scrollTop / scrollable) : 0;
  stockPartyCase.style.setProperty("--case-progress", `${progress * 100}%`);
  if (
    stockPartyDemoSection &&
    !stockPartyDemo?.getAttribute("src") &&
    stockPartyCase.scrollTop + stockPartyCase.clientHeight * 1.4 >= stockPartyDemoSection.offsetTop
  ) {
    ensureStockPartyDemo();
  }
}

function showProjectCase({ focus = false } = {}) {
  if (!stockPartyCase) return;
  const wasHidden = stockPartyCase.hidden;
  stockPartyCase.hidden = false;
  document.documentElement.classList.add("case-open");
  document.body.classList.add("case-open");
  siteHeader.inert = true;
  portfolioMain.inert = true;
  requestAnimationFrame(() => {
    if (wasHidden) {
      stockPartyCase.scrollTop = 0;
      const defaultLoopButton = loopButtons.find((button) => button.dataset.loopStep === "input");
      loopButtons.forEach((button) => button.classList.toggle("is-active", button === defaultLoopButton));
      if (loopDetail) {
        loopDetail.querySelector("strong").textContent = loopCopy.input.title;
        loopDetail.querySelector("span").textContent = loopCopy.input.detail;
      }
    }
    updateCaseProgress();
    if (focus) stockPartyCase.querySelector("[data-case-close]")?.focus({ preventScroll: true });
  });
}

function hideProjectCase({ restoreFocus = false } = {}) {
  if (!stockPartyCase || stockPartyCase.hidden) return;
  stockPartyCase.hidden = true;
  document.documentElement.classList.remove("case-open");
  document.body.classList.remove("case-open");
  siteHeader.inert = false;
  portfolioMain.inert = false;
  if (caseLightbox?.open) caseLightbox.close();
  if (restoreFocus && lastProjectCaseTrigger?.isConnected) {
    requestAnimationFrame(() => lastProjectCaseTrigger.focus({ preventScroll: true }));
  }
}

function openProjectCase(key, trigger) {
  if (key !== "stock-party") return;
  lastProjectCaseTrigger = trigger || lastProjectCaseTrigger;
  const portalKey = activePortalKey || history.state?.portalKey || "projects";
  if (window.location.hash !== "#experience-projects") {
    history.replaceState({ portalKey: "projects" }, "", "#experience-projects");
  }
  history.pushState({ portalKey, projectCase: key }, "", `#project-${key}`);
  showProjectCase({ focus: true });
}

function requestProjectCaseClose() {
  const caseHash = window.location.hash;
  if (history.state?.projectCase) {
    history.back();
    window.setTimeout(() => {
      if (window.location.hash === caseHash) returnToProjectList();
    }, 180);
    return;
  }
  returnToProjectList();
}

function returnToProjectList() {
  history.replaceState({ portalKey: "projects" }, "", "#experience-projects");
  hideProjectCase({ restoreFocus: true });
  renderPortalPanel("projects", { focus: true, scroll: true });
}

function syncProjectCaseFromLocation() {
  if (window.location.hash === "#project-stock-party") {
    showProjectCase();
  } else {
    hideProjectCase({ restoreFocus: true });
  }
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-project-case]");
  if (trigger) openProjectCase(trigger.dataset.projectCase, trigger);
});

stockPartyCase?.addEventListener("click", (event) => {
  if (event.target.closest("[data-case-close]")) requestProjectCaseClose();
});

stockPartyCase?.querySelectorAll("[data-case-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.caseTarget);
    target?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    if (target === stockPartyDemoSection) requestAnimationFrame(ensureStockPartyDemo);
  });
});

loopButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const copy = loopCopy[button.dataset.loopStep];
    if (!copy || !loopDetail) return;
    loopButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    loopDetail.querySelector("strong").textContent = copy.title;
    loopDetail.querySelector("span").textContent = copy.detail;
  });
});

stockPartyCase?.addEventListener("scroll", () => {
  if (caseProgressFrame) return;
  caseProgressFrame = requestAnimationFrame(updateCaseProgress);
}, { passive: true });

resetStockDemo?.addEventListener("click", () => {
  if (!stockPartyDemo) return;
  ensureStockPartyDemo();
  stockPartyDemo.src = `${stockPartyDemo.dataset.src}?reset=${Date.now()}`;
});

document.addEventListener("click", (event) => {
  const imageButton = event.target.closest("[data-case-image]");
  if (!imageButton || !caseLightbox) return;
  const sourceImage = imageButton.querySelector("img");
  caseLightboxImage.src = imageButton.dataset.caseImage;
  caseLightboxImage.alt = sourceImage?.alt || "项目界面大图";
  caseLightboxCaption.textContent = imageButton.dataset.caseCaption || "";
  if (!caseLightbox.open) caseLightbox.showModal();
});

closeCaseLightbox?.addEventListener("click", () => caseLightbox.close());
caseLightbox?.addEventListener("click", (event) => {
  if (event.target === caseLightbox) caseLightbox.close();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && stockPartyCase && !stockPartyCase.hidden && !caseLightbox?.open) {
    event.preventDefault();
    requestProjectCaseClose();
  }
});

const experienceModal = document.querySelector("#experienceModal");
const closeExperience = document.querySelector("#closeExperience");
const modalKicker = document.querySelector("#modalKicker");
const modalTitle = document.querySelector("#modalTitle");
const modalMeta = document.querySelector("#modalMeta");
const modalBody = document.querySelector("#modalBody");
const experienceBackLabel = document.querySelector("#experienceBackLabel");
let lastExperienceTrigger = null;
let pdfJsPromise = null;
let pdfPreviewVersion = 0;
let activePdfLoadingTask = null;
let activePdfRenderTask = null;

function syncDialogState() {
  const hasOpenDialog = [...document.querySelectorAll("dialog")].some((dialog) => dialog.open);
  document.documentElement.classList.toggle("dialog-open", hasOpenDialog);
  document.body.classList.toggle("dialog-open", hasOpenDialog);
}

function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("./vendor/pdfjs/pdf.min.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "./vendor/pdfjs/pdf.worker.min.mjs",
        document.baseURI
      ).href;
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

function stopPdfPreview() {
  pdfPreviewVersion += 1;
  activePdfRenderTask?.cancel();
  activePdfRenderTask = null;
  activePdfLoadingTask?.destroy().catch(() => undefined);
  activePdfLoadingTask = null;
}

async function renderPdfPreview(reader) {
  const source = reader.dataset.pdfSrc;
  const status = reader.closest(".modal-document")?.querySelector("[data-pdf-status]");
  const loading = reader.querySelector("[data-pdf-loading]");
  const pages = reader.querySelector("[data-pdf-pages]");
  if (!source || !pages) return;

  const renderVersion = ++pdfPreviewVersion;
  try {
    const pdfjs = await getPdfJs();
    if (renderVersion !== pdfPreviewVersion) return;
    const loadingTask = pdfjs.getDocument({ url: source });
    activePdfLoadingTask = loadingTask;
    const pdf = await loadingTask.promise;
    if (renderVersion !== pdfPreviewVersion) {
      loadingTask.destroy().catch(() => undefined);
      return;
    }
    loading?.remove();
    if (status) status.textContent = `0 / ${pdf.numPages} 页`;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (renderVersion !== pdfPreviewVersion) return;
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(1100, Math.max(720, reader.clientWidth || 720));
      const outputScale = Math.min(window.devicePixelRatio || 1, 1.5);
      const viewport = page.getViewport({ scale: (targetWidth / baseViewport.width) * outputScale });
      const figure = document.createElement("figure");
      const canvas = document.createElement("canvas");
      const caption = document.createElement("figcaption");
      const context = canvas.getContext("2d", { alpha: false });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.setAttribute("aria-label", `第 ${pageNumber} 页，共 ${pdf.numPages} 页`);
      caption.textContent = `${String(pageNumber).padStart(2, "0")} / ${String(pdf.numPages).padStart(2, "0")}`;
      figure.append(canvas, caption);
      pages.append(figure);

      activePdfRenderTask = page.render({ canvasContext: context, viewport });
      await activePdfRenderTask.promise;
      activePdfRenderTask = null;
      canvas.classList.add("is-rendered");
      page.cleanup();
      if (status) status.textContent = `${pageNumber} / ${pdf.numPages} 页`;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    if (status) status.textContent = `共 ${pdf.numPages} 页 · 向下滚动阅读`;
  } catch (error) {
    if (renderVersion !== pdfPreviewVersion || error?.name === "RenderingCancelledException") return;
    loading?.classList.add("is-error");
    if (loading) loading.innerHTML = "<strong>文档预览加载失败</strong><span>请刷新页面后重试。</span>";
    if (status) status.textContent = "加载失败";
    console.warn("PDF preview failed", error);
  }
}

function showExperience(key) {
  const data = experiences[key];
  if (!data) return;
  stopPdfPreview();
  experienceModal.classList.toggle("is-visual", Boolean(data.gallery?.length || data.document));
  experienceModal.classList.toggle("is-document", Boolean(data.document));
  modalKicker.textContent = data.kicker;
  modalTitle.textContent = data.title;
  modalMeta.textContent = data.meta;
  const parentKey = ["nearu", "wakeargue"].includes(key) ? "projects" : key === "design" ? "early" : "work";
  const backLabels = { work: "返回工作经历", projects: "返回项目", early: "返回早期经历" };
  const backLabel = backLabels[parentKey] || "返回上一层";
  if (experienceBackLabel) experienceBackLabel.textContent = backLabel;
  closeExperience?.setAttribute("aria-label", backLabel);
  const intro = data.intro ? `<p class="modal-lead">${data.intro}</p>` : "";
  const tags = data.tags?.length
    ? `<div class="modal-tags" aria-label="能力标签">${data.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
    : "";
  const highlights = data.highlights?.length
    ? `<div class="modal-highlights">${data.highlights
        .map(
          (item) => `<article>
            <span>${item.label}</span>
            <strong>${item.title}</strong>
            <p>${item.text}</p>
          </article>`
        )
        .join("")}</div>`
    : "";
  const points = data.points?.length ? `<ul>${data.points.map((point) => `<li>${point}</li>`).join("")}</ul>` : "";
  const gallery = data.gallery?.length
    ? `<div class="modal-gallery">${data.gallery
        .map(
          (item) => `<figure>
            <button
              type="button"
              data-case-image="${item.src}"
              data-case-caption="${item.caption}"
              aria-label="放大查看：${item.caption}"
            >
              <img src="${item.src}" alt="${item.alt}" loading="lazy" />
            </button>
            <figcaption>${item.caption}</figcaption>
          </figure>`
        )
        .join("")}</div>`
    : "";
  const documentViewer = data.document
    ? `<section class="modal-document" aria-label="${data.document.title}">
        <header>
          <div>
            <span>Full document</span>
            <strong>${data.document.title}</strong>
          </div>
          <span class="pdf-status" data-pdf-status role="status">准备文档…</span>
        </header>
        <div class="pdf-reader" data-pdf-reader data-pdf-src="${data.document.src}">
          <div class="pdf-reader-state" data-pdf-loading>
            <i aria-hidden="true"></i>
            <span>正在解析完整 PDF…</span>
          </div>
          <div class="pdf-pages" data-pdf-pages></div>
        </div>
      </section>`
    : "";
  const links = data.links?.length
    ? `<div class="modal-links">${data.links
        .map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`)
        .join("")}</div>`
    : "";
  modalBody.innerHTML = `${intro}${tags}${highlights}${links}${points}${documentViewer}${gallery}`;
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
