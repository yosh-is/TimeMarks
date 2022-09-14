const config = { toggle: false };

const sidebar = document.createElement("div");
sidebar.classList.add("tm-sidebar");
const sidebarBorder = document.createElement("div");
sidebarBorder.classList.add("tm-sidebar-border");
sidebar.insertAdjacentElement("afterbegin", sidebarBorder);
const iframe = document.createElement("iframe");

// リサイズ
let count = 0;
// re : iframe 上でマウスのトラッキングがはずれるのでsidebarをリサイズするさい全面に透明要素を配置（うーん）
const re = document.createElement("div");
re.classList.add("resize");

sidebarBorder.addEventListener("mousedown", (e) => {
  document.addEventListener("mousemove", resize);
  re.classList.add("up");
});

function resize(e) {
  const size = re.clientWidth - e.x;

  if (re.clientWidth > size) {
    sidebar.style.width = `${size}px`;
  }
  if (size === 0) {
    console.log("どうしよう、どこまで小さく");
  }
}

document.addEventListener("mouseup", () => {
  document.removeEventListener("mousemove", resize);
  re.classList.remove("up");
});

// animation
const anim = sidebar.animate(
  [
    { right: "-400px", opacity: 0 },
    { right: "0px", opacity: 1 },
  ],
  {
    duration: 250,
    fill: "forwards",
    easing: "ease-out",
  }
);

// 表示・非表示
export function toggle() {
  const existsSidebar = document.querySelector(".tm-sidebar");

  if (!existsSidebar) {
    document.body.insertAdjacentElement("afterbegin", sidebar);
    document.body.insertAdjacentElement("afterbegin", re);
  }

  if (!config.toggle) {
    iframe.src = chrome.runtime.getURL("popup/popup.html");
    sidebar.insertAdjacentElement("beforeend", iframe);
    config.toggle = !config.toggle;
    anim.playbackRate = 1;
    anim.play();
  } else {
    anim.reverse();
    iframe.remove();
    config.toggle = !config.toggle;
  }
}

export function reload() {
  if (config.toggle) {
    iframe.remove();
    iframe.src = chrome.runtime.getURL("popup/popup.html");
    sidebar.insertAdjacentElement("beforeend", iframe);
  }
}

window.addEventListener("unload", () => {
  console.log("unload");
});
