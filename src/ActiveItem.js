export class ActiveItem extends URL {
  static #config = {
    youtube: "https://www.youtube.com/watch?v=",
    twitch: "https://www.twitch.tv/videos/",
  };

  constructor(url) {
    super(url);
  }

  get videoId() {
    // youtube ?? twitch
    return this.searchParams.get("v") ?? this.pathname.split("/")[2];
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
}
