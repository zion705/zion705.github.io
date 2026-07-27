const screens = {
  home: {
    name: "定制表情包",
    title: "从模板选择进入做同款",
    description:
      "首页保留了当时真实上线界面。点击模板卡片或“做同款”按钮进入确认页，也可从底部直接查看制作记录。",
  },
  custom: {
    name: "聊天日常 · 做同款",
    title: "确认风格后立即生成",
    description:
      "用户在做同款页预览一组表情包效果，点击底部主按钮发起制作；返回按钮可回到模板首页。",
  },
  records: {
    name: "制作记录",
    title: "查看历史生成结果",
    description:
      "制作记录承接生成后的结果回看。点击记录卡片可再次进入做同款，左上角返回键回到首页。",
  },
};

const order = ["home", "custom", "records"];
const params = new URLSearchParams(window.location.search);
const embedded = params.get("embed") === "1";
const requestedScreen = params.get("screen");

document.body.classList.toggle("is-embedded", embedded);

const panels = [...document.querySelectorAll("[data-screen-panel]")];
const triggers = [...document.querySelectorAll("[data-screen-target]")];
const railButtons = [...document.querySelectorAll(".screen-rail [data-screen-target]")];
const screenCounter = document.querySelector("#screenCounter");
const screenName = document.querySelector("#screenName");
const screenTitle = document.querySelector("#screenTitle");
const screenDescription = document.querySelector("#screenDescription");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
let activeScreen = screens[requestedScreen] ? requestedScreen : "home";

function updateUrl(screen) {
  const url = new URL(window.location.href);
  url.searchParams.set("screen", screen);
  if (embedded) url.searchParams.set("embed", "1");
  history.replaceState(null, "", url);
}

function showScreen(screen) {
  if (!screens[screen]) return;
  activeScreen = screen;
  const index = order.indexOf(screen);

  panels.forEach((panel) => {
    const active = panel.dataset.screenPanel === screen;
    panel.hidden = false;
    panel.classList.toggle("is-active", active);
    panel.setAttribute("aria-hidden", String(!active));
    if (!active) {
      window.setTimeout(() => {
        if (!panel.classList.contains("is-active")) panel.hidden = true;
      }, 380);
    }
  });

  railButtons.forEach((button) => {
    const active = button.dataset.screenTarget === screen;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "step" : "false");
  });

  screenCounter.textContent = `${String(index + 1).padStart(2, "0")} / 03`;
  screenName.textContent = screens[screen].name;
  screenTitle.textContent = screens[screen].title;
  screenDescription.textContent = screens[screen].description;
  previousButton.disabled = index === 0;
  nextButton.textContent = index === order.length - 1 ? "回到首页" : "下一步";
  updateUrl(screen);
}

triggers.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screenTarget));
});

previousButton.addEventListener("click", () => {
  const index = order.indexOf(activeScreen);
  showScreen(order[Math.max(0, index - 1)]);
});

nextButton.addEventListener("click", () => {
  const index = order.indexOf(activeScreen);
  showScreen(order[(index + 1) % order.length]);
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const index = order.indexOf(activeScreen);
  const offset = event.key === "ArrowRight" ? 1 : -1;
  showScreen(order[(index + offset + order.length) % order.length]);
});

showScreen(activeScreen);
