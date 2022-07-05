(async () => {
  const src = chrome.runtime.getURL("../src/content_main.js");
  const contentMain = await import(src);
  contentMain.main();
})();
