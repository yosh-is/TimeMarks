import { getCurrentTab } from "../utils/utils.js";
import { ActiveItem } from "../src/ActiveItem.js";

const allowedPaths = ["youtube.com/watch", "twitch.tv/videos", "unext.jp/play"];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log({ tabId, changeInfo, tab });

  const checkPath = allowedPaths.find((path) => {
    return tab.url.includes(path);
  });

  if (checkPath && changeInfo.status === "complete") {
    const activeItem = new ActiveItem(tab.url);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      value: activeItem.siteName,
      videoId: activeItem.videoId,
    });
  }
});

// chrome.tabs.onActivated.addListener(async (activeInfo) => {
//   // console.log("onActivated", activeInfo);
//   const activeTab = await getCurrentTab();

//   setPopup(activeTab.url);
// });

/**
 * popup の設定
 * @param {string} url
 */
function setPopup(url) {
  if (url.includes("https://www.youtube.com")) {
    chrome.action.enable();
  } else {
    chrome.action.disable();
  }
}
