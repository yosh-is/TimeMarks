import { BookmarkItem } from "./BookmarkItme.js";

export class App {
  #config = { youtube: ".html5-video-player", twitch: ".video-player__container" };

  constructor() {
    this.bookmarkItem = new BookmarkItem();
    /**
     *
     */
    this.videoPlayer; // HTMLMediaElement <video>
    this.cuurentVideo = ""; // BookmarkItem へ変更する

    this.addNewBookmarkEventHandler = this.addNewBookmarkEventHandler.bind(this);
  }

  /**
   * 読み込まれたページにブックマークボタンを作成
   *
   * name = | youtube | twitch |
   * @param {string} name 動画サービスの名称
   */
  newVideoLoaded(name) {
    const bookmarkBtnExists = document.getElementsByClassName("timemark-btn")[0];

    // ブックマークボタンの作成、配置
    if (!bookmarkBtnExists) {
      console.log("ボタンを作るよ。");
      this.videoPlayer = document.querySelector("video");

      // videoにホバーしたらボタンを表示したい;
      const bookmarkControl = document.querySelector(this.#config[name]);

      const html = `
      <div class="timemark-btn">
        <div class="timemark-btn-icon" title="Click to bookmark current timestamp">
          <svg viewBox="0 0 128 128">
            <path
              d="m 34,14 c -0.690625,0 -1.360595,0.07195 -2.01172,0.2051 C 27.43042,15.13716 24,19.165625 24,24 v 90 l 40,-15 40,15 V 24 c 0,-0.6875 -0.0713,-1.362305 -0.2051,-2.01172 -0.79892,-3.906735 -3.876468,-6.984275 -7.783204,-7.7832 C 95.360592,14.071925 94.690624,14 94,14 Z m 30,15 c 3.131544,-5e-6 5.712888,2.58135 5.712888,5.71289 V 48.28711 H 83.287112 C 86.418648,48.287115 89,50.868464 89,54 c 8e-6,3.131536 -2.581344,5.712888 -5.712888,5.712888 H 69.712888 V 73.287112 C 69.712888,76.418648 67.131544,79 64,79 60.868464,79 58.287115,76.418648 58.28711,73.287112 V 59.712888 H 44.71289 C 41.581345,59.712888 38.999995,57.131544 39,54 c 0,-3.131536 2.58135,-5.71289 5.71289,-5.71289 H 58.28711 V 34.71289 C 58.28711,31.581355 60.868464,29.000005 64,29 Z"
              style="fill: #ffffff; fill-opacity: 1"
            />
          </svg>
        </div>
      </div>
      `;

      bookmarkControl.insertAdjacentHTML("beforeend", html);
      const bookmarkBtn = bookmarkControl.querySelector(".timemark-btn");

      bookmarkControl.addEventListener("mouseover", () => {
        bookmarkBtn.style.opacity = "1";
      });
      bookmarkControl.addEventListener("mouseout", () => {
        bookmarkBtn.style.opacity = "0";
      });

      bookmarkBtn.addEventListener("click", this.addNewBookmarkEventHandler);
    }
  }

  /**
   * ブックマークの追加
   */
  addNewBookmarkEventHandler() {
    const title = document.querySelector("title");
    this.bookmarkItem.title = title.innerText;

    const currentTime = this.videoPlayer.currentTime;

    // ToDo newBookmark を class BookmarkIteme へ持っていきたい。かモデルクラスにする？
    const newBookmark = {
      id: 1,
      time: currentTime,
      desc: "Timestamp at " + getTime(currentTime),
    };

    this.bookmarkItem.addBookmark(this.cuurentVideo, newBookmark);
  }

  mount() {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      const { type, value, videoId } = msg;
      console.log({ type, value, videoId });

      switch (type) {
        case "NEW":
          this.cuurentVideo = videoId;
          this.newVideoLoaded(value);
          break;

        case "UPDATE":
          this.bookmarkItem.updateBookmark(videoId, value);
          break;

        case "PLAY":
          this.videoPlayer.currentTime = value;
          // this.videoPlayer.play();
          break;

        case "DELETE":
          this.bookmarkItem.deleteBookmark(videoId, value);
          response();
          break;

        case "EXPORT":
          this.bookmarkItem.exportBookmark();
          break;

        default:
          break;
      }
    });
  }
}

const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substring(11, 19);
};
