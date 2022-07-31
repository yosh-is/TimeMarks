const config = { toggle: true };

const sidePanel = document.createElement("div");
sidePanel.className = "tm-side-panel";
const iframe = document.createElement("iframe");

// animation
const anim = sidePanel.animate(
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

//
export function toggle() {
  const exists = document.querySelector(".tm-side-panel");

  if (!exists) {
    document.body.insertAdjacentElement("afterbegin", sidePanel);
  }

  if (config.toggle) {
    iframe.src = chrome.runtime.getURL("popup/popup.html");
    sidePanel.insertAdjacentElement("beforeend", iframe);
    config.toggle = !config.toggle;
    anim.playbackRate = 1;
    anim.play();
  } else {
    anim.reverse();
    iframe.remove();
    config.toggle = !config.toggle;
  }
}
