const assetRoot = "../../assets/telestudio/states/";
const stateOrder = [
  "home-default",
  "home-normal",
  "home-hover",
  "settings-new",
  "generate-prompt",
  "generate-loading",
  "generate-results",
  "generate-complete",
  "settings-existing",
  "identity-open",
  "identity-ready",
  "live-loading",
  "live-ready",
];

const states = {
  "home-default": {
    image: "home-default.jpg",
    alt: "TeleStudio 首页预设数字人状态",
    group: "首页 / 预设直达路径",
    title: "选择预设数字人",
    cause: "用户从前沿探索进入数字人模块。默认展示预设形象；单击缩略图切换形象，选中项高亮并同步上方预览。",
    primary: ["新建数字人 →", "settings-new"],
    secondary: ["编辑已有数字人", "home-hover"],
    hotspots: [
      ["上传 / 新建", 32.5, 70.5, 8.5, 9, "settings-new"],
      ["编辑已有数字人", 41, 69, 28, 11, "home-hover"],
      ["开始对话", 41, 83.5, 18, 7.5, "live-loading"],
    ],
  },
  "home-normal": {
    image: "home-normal.jpg",
    alt: "TeleStudio 首页选择数字人状态",
    group: "首页 / 切换数字人",
    title: "切换并选中数字人",
    cause: "用户单击某个缩略图后，该形象进入选中态；形象、音色与人设作为一套 showcase 配置同时切换。",
    primary: ["开始对话 →", "live-loading"],
    secondary: ["悬停查看设置", "home-hover"],
    hotspots: [
      ["悬停设置", 42, 69, 12, 11, "home-hover"],
      ["开始对话", 41, 83.5, 18, 7.5, "live-loading"],
    ],
  },
  "home-hover": {
    image: "home-hover.jpg",
    alt: "TeleStudio 首页数字人缩略图悬停状态",
    group: "首页 / 缩略图悬停",
    title: "进入已有数字人设置",
    cause: "鼠标悬停在已有数字人缩略图上时出现设置入口。已有数字人只能调整音色和身份，不能重新生成形象。",
    primary: ["打开设置 →", "settings-existing"],
    secondary: ["返回首页", "home-normal"],
    hotspots: [
      ["设置已有数字人", 43, 68, 10, 13, "settings-existing"],
      ["新建数字人", 32.5, 70, 8.5, 9, "settings-new"],
    ],
  },
  "settings-new": {
    image: "settings-new.jpg",
    alt: "TeleStudio 新建数字人设置空态",
    group: "设置 / 新建数字人",
    title: "填写新数字人的初始设置",
    cause: "从首页固定的上传入口进入。新建状态开放形象、音色、身份三部分；左侧形象区尚未产生候选图。",
    primary: ["填写形象 Prompt →", "generate-prompt"],
    secondary: ["返回首页", "home-default"],
    hotspots: [
      ["形象生成区", 29, 37, 16, 28, "generate-prompt"],
      ["形象 Prompt", 50, 28, 33, 22, "generate-prompt"],
    ],
  },
  "generate-prompt": {
    image: "generate-prompt.jpg",
    alt: "TeleStudio 自定义形象 Prompt 编辑状态",
    group: "设置 / 自定义形象",
    title: "选择性别与推荐项，生成 Prompt",
    cause: "常见操作是“选性别 → 选推荐项 → 修改 → 生成”。大模型根据性别和随机推荐项返回文本框内的形象 Prompt。",
    primary: ["生成四张候选图 →", "generate-loading"],
    secondary: ["返回空态", "settings-new"],
    hotspots: [
      ["性别选择", 53, 26, 31, 6, "generate-prompt"],
      ["生成形象", 78, 43, 7, 7, "generate-loading"],
    ],
  },
  "generate-loading": {
    image: "generate-loading.jpg",
    alt: "TeleStudio 自定义形象等待生成状态",
    group: "设置 / 自定义形象",
    title: "等待生成四张候选图",
    cause: "点击生成后进入等待态：左侧出现四个模糊图片框，保存按钮置灰。再次点击生成会终止当前流程并重新发起。",
    primary: ["查看生成结果 →", "generate-results"],
    secondary: ["重新填写 Prompt", "generate-prompt"],
    auto: ["generate-results", 1500],
    hotspots: [["生成中的候选图", 29, 39, 19, 35, "generate-results"]],
  },
  "generate-results": {
    image: "generate-results.jpg",
    alt: "TeleStudio 自定义形象四张候选图状态",
    group: "设置 / 自定义形象",
    title: "从四张候选图中单选",
    cause: "四张图片生成完成后进入选择态。用户必须单选一张作为数字人形象，未选择前不能完成设置。",
    primary: ["选中第一张 →", "generate-complete"],
    secondary: ["重新生成", "generate-loading"],
    hotspots: [["选择候选图", 29, 37, 20, 35, "generate-complete"]],
  },
  "generate-complete": {
    image: "generate-complete.jpg",
    alt: "TeleStudio 自定义形象完成选择状态",
    group: "设置 / 自定义形象",
    title: "确认选中形象",
    cause: "选中图放大展示，下方保留三张落选方案。点击落选方案会回到图片选择状态，确保用户仍可反悔。",
    primary: ["继续设置身份 →", "identity-open"],
    secondary: ["改选其他方案", "generate-results"],
    hotspots: [
      ["改选方案", 32, 70, 18, 11, "generate-results"],
      ["身份设置", 54, 55, 31, 7, "identity-open"],
    ],
  },
  "settings-existing": {
    image: "settings-existing.jpg",
    alt: "TeleStudio 已有数字人设置状态",
    group: "设置 / 已有数字人",
    title: "编辑已有数字人的音色与身份",
    cause: "从首页缩略图的设置入口进入。已有数字人的形象锁定，只允许切换音色、编辑身份；同时提供删除数字人入口。",
    primary: ["编辑身份 →", "identity-open"],
    secondary: ["保存并返回", "home-normal"],
    hotspots: [
      ["试听 / 切换音色", 50, 38, 35, 8, "settings-existing"],
      ["打开身份列表", 50, 50, 35, 8, "identity-open"],
      ["删除数字人", 78, 82, 9, 8, "home-default"],
    ],
  },
  "identity-open": {
    image: "identity-open.jpg",
    alt: "TeleStudio 身份下拉列表展开状态",
    group: "设置 / 身份设定",
    title: "选择、新建或删除身份",
    cause: "点击身份下拉按钮后显示 4 个预设身份与自定义身份。列表支持新建、删除；双击身份名称可进入重命名。",
    primary: ["选中“讲解员” →", "identity-ready"],
    secondary: ["关闭下拉", "settings-existing"],
    hotspots: [["选择身份", 51, 46, 34, 27, "identity-ready"]],
  },
  "identity-ready": {
    image: "identity-ready.jpg",
    alt: "TeleStudio 身份详细设定状态",
    group: "设置 / 身份设定",
    title: "编辑开场白与详细设定",
    cause: "开场白为不超过 50 字的单行输入；详细设定不超过 2000 字，并以“语言风格、任务情景”提示用户补全约束。",
    primary: ["保存设置 →", "home-normal"],
    secondary: ["重新选择身份", "identity-open"],
    hotspots: [
      ["开场白", 51, 53, 34, 7, "identity-ready"],
      ["详细设定", 51, 61, 34, 22, "identity-ready"],
      ["保存设置", 42, 84, 24, 8, "home-normal"],
    ],
  },
  "live-loading": {
    image: "live-loading.jpg",
    alt: "TeleStudio 数字人实时交互加载状态",
    group: "实时交互 / 加载",
    title: "识别角色并初始化实时渲染",
    cause: "进入交互页后先加载数字人。成功时触发开场白；加载失败展示默认占位并提示重试，网络卡顿则定格画面并提示稍候。",
    primary: ["加载完成 →", "live-ready"],
    secondary: ["返回首页", "home-normal"],
    auto: ["live-ready", 1800],
    hotspots: [["加载完成", 24, 20, 31, 66, "live-ready"]],
  },
  "live-ready": {
    image: "live-ready.jpg",
    alt: "TeleStudio 数字人实时对话完成状态",
    group: "实时交互 / 对话",
    title: "开始实时对话",
    cause: "用户气泡居右、数字人气泡居左；回复逐字渲染并匹配语音进度。输入支持 500 字、回车发送、Shift+回车换行，刷新后清空临时记录。",
    primary: ["清空并重新加载", "live-loading"],
    secondary: ["返回首页", "home-normal"],
    hotspots: [
      ["预设话题", 58, 80, 24, 6, "live-ready"],
      ["发送消息", 79, 86, 8, 7, "live-ready"],
      ["返回", 8, 12, 8, 8, "home-normal"],
    ],
  },
};

const params = new URLSearchParams(window.location.search);
const embedded = params.get("embed") === "1";
const requestedState = params.get("state");
document.body.classList.toggle("is-embedded", embedded);

const stateImage = document.querySelector("#stateImage");
const hotspotLayer = document.querySelector("#hotspotLayer");
const stateGroup = document.querySelector("#stateGroup");
const stateTitle = document.querySelector("#stateTitle");
const stateCause = document.querySelector("#stateCause");
const topbarState = document.querySelector("#topbarState");
const stateCounter = document.querySelector("#stateCounter");
const primaryButton = document.querySelector("#primaryButton");
const secondaryButton = document.querySelector("#secondaryButton");
const previousButton = document.querySelector("#previousButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const stateRail = document.querySelector("#stateRail");
const demoToast = document.querySelector("#demoToast");
let activeState = states[requestedState] ? requestedState : "home-default";
let autoTimer = 0;
let toastTimer = 0;
const stateHistory = [];

function showToast(message) {
  demoToast.textContent = message;
  demoToast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => demoToast.classList.remove("is-visible"), 1600);
}

function renderHotspots(hotspots = []) {
  hotspotLayer.innerHTML = "";
  hotspots.forEach(([label, x, y, width, height, target]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hotspot";
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.style.width = `${width}%`;
    button.style.height = `${height}%`;
    button.setAttribute("aria-label", label);
    button.innerHTML = `<span>${label}</span>`;
    button.addEventListener("click", () => goToState(target));
    hotspotLayer.append(button);
  });
}

function renderRail() {
  stateRail.innerHTML = stateOrder
    .map((key, index) => `<li>
      <button type="button" data-state="${key}" class="${key === activeState ? "is-active" : ""}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${states[key].title}</strong>
      </button>
    </li>`)
    .join("");
}

function updateUrl(key) {
  const url = new URL(window.location.href);
  url.searchParams.set("state", key);
  if (embedded) url.searchParams.set("embed", "1");
  history.replaceState(null, "", url);
}

function goToState(key, { remember = true } = {}) {
  if (!states[key]) return;
  window.clearTimeout(autoTimer);
  if (remember && key !== activeState) stateHistory.push(activeState);
  activeState = key;
  const state = states[key];
  const index = stateOrder.indexOf(key);

  stateImage.classList.add("is-changing");
  const preload = new Image();
  preload.onload = () => {
    stateImage.src = `${assetRoot}${state.image}`;
    stateImage.alt = state.alt;
    requestAnimationFrame(() => stateImage.classList.remove("is-changing"));
  };
  preload.src = `${assetRoot}${state.image}`;

  stateGroup.textContent = state.group;
  stateTitle.textContent = state.title;
  stateCause.textContent = state.cause;
  topbarState.textContent = state.title;
  stateCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(stateOrder.length).padStart(2, "0")}`;
  primaryButton.textContent = state.primary[0];
  primaryButton.dataset.target = state.primary[1];
  secondaryButton.textContent = state.secondary[0];
  secondaryButton.dataset.target = state.secondary[1];
  previousButton.disabled = stateHistory.length === 0;
  renderHotspots(state.hotspots);
  renderRail();
  updateUrl(key);
  window.parent?.postMessage({ type: "telestudio-state", state: key, title: state.title }, "*");

  if (state.auto) {
    autoTimer = window.setTimeout(() => {
      showToast("状态条件满足，进入下一页面");
      goToState(state.auto[0]);
    }, state.auto[1]);
  }
}

primaryButton.addEventListener("click", () => goToState(primaryButton.dataset.target));
secondaryButton.addEventListener("click", () => goToState(secondaryButton.dataset.target));
previousButton.addEventListener("click", () => {
  const previous = stateHistory.pop();
  if (previous) goToState(previous, { remember: false });
});
stateRail.addEventListener("click", (event) => {
  const button = event.target.closest("[data-state]");
  if (button) goToState(button.dataset.state);
});
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showToast("浏览器未允许全屏，可点击“独立打开”");
  }
});
document.addEventListener("fullscreenchange", () => {
  fullscreenButton.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
});
window.addEventListener("message", (event) => {
  if (event.data?.type === "telestudio-go" && states[event.data.state]) goToState(event.data.state);
});

goToState(activeState, { remember: false });
