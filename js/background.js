import { getCurrentTab } from "../utils/utils.js";

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log({ tabId, changeInfo, tab });

  if (tab.url && tab.url.includes("youtube.com/watch") && changeInfo.status === "complete") {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.action.enable();

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("onActivated", activeInfo);
  const activeTab = await getCurrentTab();
  if (activeTab.url.includes("https://www.youtube.com/")) {
    console.log(true);
    chrome.action.enable();
  } else {
    console.log(false);
    chrome.action.disable();
  }
});
