import { getCurrentTab } from "../utils/utils.js";

const allowedPaths = ["youtube.com/watch", "twitch.tv/videos"];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log({ tabId, changeInfo, tab });

  const checkPath = allowedPaths.find((value) => {
    return tab.url.includes(value) ? value : undefined;
  });

  if (checkPath && changeInfo.status === "complete") {
    const activeURL = new URL(tab.url);
    const queryParams = activeURL.searchParams;

    const videoId = queryParams.get("v") ?? activeURL.pathname.split("/")[2];

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      value: checkPath.split(".")[0],
      videoId: videoId,
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
