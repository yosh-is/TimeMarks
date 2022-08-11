export class ActiveItem extends URL {
  static #config = {
    youtube: "https://www.youtube.com/watch?v=",
    twitch: "https://www.twitch.tv",
    unext: "https://video.unext.jp",
  };

  constructor(url) {
    super(url);
  }

  get videoId() {
    // youtube ?? twitch | unext
    return this.searchParams.get("v") ?? this.pathname;
  }

  get siteName() {
    return this.hostname.split(".")[1];
  }

  get tmId() {
    return this.siteName + "-" + this.videoId;
  }

  static createUrl(tmId) {
    return this.#config[tmId.split("-")[0]] + tmId.slice(tmId.indexOf("-") + 1);
  }

  // ビデオのタイトルを取得
  #getTitle = {
    youtube: () => {
      return document.querySelector(".watch-active-metadata h1").innerText;
    },
    twitch: () => {
      return document.querySelector("[data-a-target='stream-title']").title;
    },
    unext: () => {
      const titleElm = document.querySelector("div[class^='Header__TitleContainer-sc-']");
      return titleElm.textContent.replaceAll("\n", "").trim();
    },
  };

  // チャンネルタイトルを取得
  #getChannelTitle = {
    youtube: () => {
      return document.querySelector(".watch-active-metadata .ytd-channel-name").innerText;
    },
    twitch: () => {
      return document.querySelector("#live-channel-stream-information h1").innerText;
    },
    // unext: () => {
    //   const titleElm = document.querySelector("div[class^='Header__TitleContainer-sc-']");
    //   return titleElm.textContent.replaceAll("\n", "").trim();
    // },
  };

  // チャンネルアイコンを取得
  #getChannelIcon = {
    youtube: () => {
      return document.querySelector(".watch-active-metadata #img").getAttribute("src");
    },
    twitch: () => {
      return document.querySelector("#live-channel-stream-information img").getAttribute("src");
    },
    // unext: () => {
    //   const titleElm = document.querySelector("div[class^='Header__TitleContainer-sc-']");
    //   return titleElm.textContent.replaceAll("\n", "").trim();
    // },
  };

  get videoItem() {
    return {
      title: this.#getTitle[this.siteName](),
      channelTitle: this.#getChannelTitle[this.siteName](),
      icon: this.#getChannelIcon[this.siteName](),
    };
  }
}
