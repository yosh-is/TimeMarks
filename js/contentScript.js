(async () => {
  const src = chrome.runtime.getURL("../content/content_main.js");
  const contentMain = await import(src);
  contentMain.main();
})();
