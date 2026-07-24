const screens = [...document.querySelectorAll("[data-screen]")];
const presetButtons = [...document.querySelectorAll(".preset[data-avatar]")];
const nameOutput = document.querySelector("#selectedAvatarName");
const metaOutput = document.querySelector("#selectedAvatarMeta");
const profileName = document.querySelector("#profileName");
const profileRole = document.querySelector("#profileRole");
const profilePrompt = document.querySelector("#profilePrompt");
const promptCount = document.querySelector("#promptCount");
const profileForm = document.querySelector("#profileForm");
const saveStatus = document.querySelector("#saveStatus");
const liveTitle = document.querySelector("#liveTitle");
const messages = document.querySelector("#messages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const liveSubtitle = document.querySelector("#liveSubtitle");
const voiceButton = document.querySelector("#voiceButton");
const toast = document.querySelector("#toast");
let toastTimer = 0;
let replyTimer = 0;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function showScreen(name) {
  screens.forEach((screen) => {
    const active = screen.dataset.screen === name;
    screen.hidden = !active;
    screen.classList.toggle("is-active", active);
  });
  window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (name === "live") {
    liveTitle.textContent = profileName.value.trim() || nameOutput.textContent;
    window.setTimeout(() => chatInput.focus(), 280);
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-go]");
  if (!target) return;
  showScreen(target.dataset.go);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    presetButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    nameOutput.textContent = button.dataset.avatar;
    metaOutput.textContent = button.dataset.meta;
    profileName.value = button.dataset.avatar;
    profileRole.value = button.dataset.meta.split(" · ")[0];
    showToast(`已选择数字人：${button.dataset.avatar}`);
  });
});

document.querySelectorAll(".mode-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.getAttribute("aria-selected") === "true") return;
    showToast(`${button.textContent}能力不在本次演示范围内`);
  });
});

document.querySelectorAll(".voice-options button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".voice-options button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-checked", String(selected));
    });
    showToast(`正在试听：${button.textContent.replace("▶", "").trim()}`);
  });
});

document.querySelectorAll(".trait-row button").forEach((button) => {
  button.addEventListener("click", () => button.classList.toggle("is-selected"));
});

profilePrompt.addEventListener("input", () => {
  promptCount.textContent = profilePrompt.value.length;
  saveStatus.textContent = "有未保存修改";
});
promptCount.textContent = profilePrompt.value.length;

document.querySelector("#replaceAvatar").addEventListener("click", () => showScreen("home"));

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = profileName.value.trim() || "灵犀";
  profileName.value = name;
  nameOutput.textContent = name;
  liveTitle.textContent = name;
  saveStatus.textContent = "配置已保存";
  showToast("配置已保存，正在进入实时互动");
  window.setTimeout(() => showScreen("live"), 320);
});

const responses = [
  "实时互动数字人会同步处理语音识别、对话生成、语音合成与口型驱动。这个演示重点呈现用户能直接感知的形象、音色、人格和响应状态。",
  "我可以承担展厅讲解、知识介绍和品牌接待等任务。遇到不确定的信息时，我会明确说明边界，而不是编造答案。",
  "低延迟来自整条链路的协同：边听边识别、流式生成回答、提前合成首段语音，并持续同步口型和字幕。网络波动时也要给出明确反馈。",
  "配置人格时，除了写一段介绍，还要同时约束语气、知识范围、行为边界和异常处理，这样多轮对话才会保持一致。"
];

function appendMessage(role, text, typing = false) {
  const article = document.createElement("article");
  article.className = `message message--${role}${typing ? " message--typing" : ""}`;
  article.innerHTML = `<span>${role === "user" ? "你" : liveTitle.textContent}</span><p>${typing ? "" : text}</p>`;
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}

function sendMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  window.clearTimeout(replyTimer);
  appendMessage("user", clean);
  chatInput.value = "";
  const typing = appendMessage("ai", "", true);
  const reply = responses[Math.min(responses.length - 1, messages.querySelectorAll(".message--user").length - 1)];
  liveSubtitle.textContent = "正在思考并组织回答…";
  replyTimer = window.setTimeout(() => {
    typing.classList.remove("message--typing");
    typing.querySelector("p").textContent = reply;
    messages.scrollTop = messages.scrollHeight;
    liveSubtitle.textContent = reply;
  }, 720);
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(chatInput.value);
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

document.querySelectorAll(".quick-queries button").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.textContent));
});

voiceButton.addEventListener("click", () => {
  const active = voiceButton.getAttribute("aria-pressed") !== "true";
  voiceButton.setAttribute("aria-pressed", String(active));
  showToast(active ? "正在模拟聆听，点击可停止" : "语音输入已停止");
  if (active) {
    window.setTimeout(() => {
      if (voiceButton.getAttribute("aria-pressed") !== "true") return;
      voiceButton.setAttribute("aria-pressed", "false");
      chatInput.value = "请介绍一下你能做什么";
      chatInput.focus();
    }, 1400);
  }
});
