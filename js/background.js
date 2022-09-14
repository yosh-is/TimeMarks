const allowedPaths = ["youtube.com/watch", "twitch.tv/videos", "unext.jp/play"];
const allowedUrls = ["www.youtube.com", "www.twitch.tv", "video.unext.jp"];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const checkPath = allowedPaths.find((path) => {
    return tab.url.includes(path);
  });

  if (checkPath && changeInfo.status === "complete") {
    const activeItem = new URL(tab.url);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      value: activeItem.hostname.split(".")[1],
      videoId: activeItem.searchParams.get("v") ?? activeItem.pathname,
    });
  }
});

// shortcuts command
chrome.commands.onCommand.addListener((command, tab) => {
  const checkPath = allowedPaths.find((path) => {
    return tab.url.includes(path);
  });

  if (checkPath) {
    chrome.tabs.sendMessage(tab.id, {
      type: command,
    });
  }
});

// view sidepanel
chrome.action.onClicked.addListener((tab) => {
  const checkUrl = allowedUrls.find((path) => {
    return tab.url.includes(path);
  });

  if (checkUrl) {
    chrome.tabs.sendMessage(tab.id, { type: "sidepanel" });
  }
});

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

chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log(changes, areaName);
});
