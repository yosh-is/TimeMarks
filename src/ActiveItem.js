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
    unext: () => {
      return "";
    },
  };

  // チャンネルアイコンを取得
  #getChannelIcon = {
    youtube: () => {
      return document.querySelector(".watch-active-metadata #img").getAttribute("src");
    },
    twitch: () => {
      return document.querySelector("#live-channel-stream-information img").getAttribute("src");
    },
    unext: () => {
      return `
        <div class="channel-icon">
          <svg viewBox="0 0 100 100">
            <path d="m 16.312483,57.891561 c 0,18.604676 15.08213,33.687179 33.687156,33.687179 18.605409,0 33.687538,-15.082503 33.687538,-33.687179 V 17.988364 c 0,-1.744861 -1.326463,-3.179978 -3.026154,-3.351428 L 20.024811,8.5729593 c -0.11263,-0.011339 -0.226772,-0.017386 -0.342047,-0.017386 -1.860926,0 -3.368731,1.5084967 -3.368731,3.3690707 z M 17.996641,4.1666666e-7 c 0.339401,0 0.674872,0.0185196633333 1.00543,0.0511369833333 0,0 64.005283,6.399825 64.005283,6.4001765 5.109354,0.505183 9.100724,4.8140671 9.100724,10.0557051 V 57.891912 C 92.108078,81.148019 73.255076,100 49.999979,100 26.744962,100 7.8919222,81.146968 7.8919222,57.891912 V 10.107561 c 0,-5.5817199 4.5247748,-10.1065061 10.1061548,-10.1065061 M 32.315041,21.19092 c 0.114898,0 0.227906,0.0057 0.339402,0.01701 l 35.362888,3.536288 c 1.704983,0.166149 3.037455,1.603749 3.037455,3.352491 V 57.8934 c 0,11.628053 -9.426334,21.054747 -21.054769,21.054747 -11.62802,0 -21.054387,-9.426694 -21.054387,-21.054747 V 24.559711 c 0,-1.860574 1.508145,-3.368715 3.368391,-3.368715" />
          </svg>
        </div>`;
    },
  };

  get videoItem() {
    return {
      title: this.#getTitle[this.siteName](),
      channelTitle: this.#getChannelTitle[this.siteName](),
      icon: this.#getChannelIcon[this.siteName](),
    };
  }
}
