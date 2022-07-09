import { getCurrentTab, htmlToElement } from "../utils/utils.js";
import { allowedUrls } from "../config/allowedUrls.js";

class ActiveItem {
  #config = {
    youtube: "https://www.youtube.com/watch?v=",
    twitch: "https://www.twitch.tv/videos/",
  };

  constructor() {
    return this.#init();
  }

  async #init() {
    this.activeTab = await getCurrentTab();
    this.activeURL = new URL(this.activeTab.url);
    return this;
  }

  get currentVideoId() {
    // youtube ?? twitch
    return this.activeURL.searchParams.get("v") ?? this.activeURL.pathname.split("/")[2];
  }

  get siteName() {
    return this.activeURL.hostname.split(".")[1];
  }
}

let activeItem;

/**
 * ブックマークタイトルの作成
 * @param {string} title
 * @returns
 */
const createBookmarkVideoTitle = (title) => {
  const html = `
  <summary>
    <div class="bookmark-title">
      <div class="bookmark-video-title">
        ${title}
      </div>
      <div class="bookmark-controls">
      </div>
    </div>
  </summary>
  `;

  const bookmarkVideoTitleElement = htmlToElement(html);

  setBookmarkAttributes("delete", bookmarkVideoTitleElement.querySelector(".bookmark-controls"));

  return bookmarkVideoTitleElement;
};

/**
 * ブックマークリストを作成
 * @param {Object} bookmarks
 * @returns
 */
const createBookmarkTimeList = (bookmarks) => {
  const bookmarkTimeListElement = document.createElement("div");
  bookmarkTimeListElement.className = "bookmark-time-list";

  for (let i = 0; i < bookmarks.length; i++) {
    const html = `
      <div id="${bookmarks[i].id}" class="bookmark" timestamp="${bookmarks[i].time}">
        <div class="bookmark-desc">
          <input type="text" value="${bookmarks[i].desc}" disabled />
          <label>${getTime(bookmarks[i].time)}</label>
        </div>
        <div class="bookmark-controls"></div>
      </div>
    `;

    const bookmarkElement = htmlToElement(html);

    const controlsElement = bookmarkElement.querySelector(".bookmark-controls");

    setBookmarkAttributes(["edit", "delete"], controlsElement);

    bookmarkElement.addEventListener("click", onPlay);

    bookmarkTimeListElement.appendChild(bookmarkElement);
  }

  return bookmarkTimeListElement;
};

/**
 * ボタンの追加
 * src = ["edit", "delete", "play"]
 * @param {string | string[]} src
 * @param {HTMLElement} controlsElement
 */
const setBookmarkAttributes = (src, controlsElement) => {
  if (!Array.isArray(src)) {
    src = [src];
  }

  src.forEach((value) => {
    const html = `
    <button class="tm-icon-s" data-action="${value}">
      <svg viewBox="0 0 100 100">
        <use href="#icon-${value}" />
      </svg>
    </button>
    `;

    controlsElement.insertAdjacentHTML("beforeend", html);
  });

  controlsElement.addEventListener("click", (e) => {
    e.stopImmediatePropagation();

    const onAction = { edit: onEdit, delete: onDelete };
    let action = e.target?.closest("button")?.dataset?.action ?? undefined;
    if (action) {
      onAction[action](e);
    }
  });
};

/**
 * videoId ごとの要素を作成
 * @param {object} db
 * @param {string} videoId
 * @returns
 */
const createBookmarkItemElement = (db, videoId) => {
  if (!(db?.["bookmarks"]?.length > 0)) {
    return;
  }

  const bookmarkItemElement = document.createElement("details");
  bookmarkItemElement.id = videoId;

  const bookmarkVideoTitleElement = createBookmarkVideoTitle(db["title"]);

  const bookmarkListElement = createBookmarkTimeList(db["bookmarks"]);

  bookmarkItemElement.insertAdjacentElement("afterbegin", bookmarkVideoTitleElement);
  bookmarkItemElement.insertAdjacentElement("beforeend", bookmarkListElement);

  return bookmarkItemElement;
};

/**
 *
 * @param {Object} allBookmarks
 * @param {string} currentVideo
 * @returns
 */
const viewBookmarks = (allBookmarks = {}, currentVideo) => {
  const currentBookmarksElement = document.getElementById("current-bookmarks");
  const otherBookmarksElement = document.getElementById("other-bookmarks");
  currentBookmarksElement.innerHTML = "";
  otherBookmarksElement.innerHTML = "";

  const videoIds = Object.keys(allBookmarks);

  if (videoIds.length === 0 || !(allBookmarks.constructor === Object)) {
    return;
  }

  videoIds.forEach((videoId) => {
    const bookmark = JSON.parse(allBookmarks[videoId]);

    const bookmarkItemElement = createBookmarkItemElement(bookmark, videoId);

    if (videoId === currentVideo) {
      bookmarkItemElement.open = true;
      currentBookmarksElement.appendChild(bookmarkItemElement);
    } else {
      otherBookmarksElement.appendChild(bookmarkItemElement);
    }
  });
};

const resTest = () => {
  console.log("_");
};

/**
 * setBookmarkAttributes の eventListhener
 * @param {Event} e
 */
const onPlay = async (e) => {
  if (e.defaultPrevented) return;

  const bookmarkElement = e.currentTarget;
  const bookmarkTime = bookmarkElement.getAttribute("timestamp");
  const videoId = bookmarkElement.parentElement.parentElement.id;

  if (activeItem.currentVideoId === videoId) {
    chrome.tabs.sendMessage(activeItem.activeTab.id, {
      type: "PLAY",
      value: bookmarkTime,
    });
  } else {
    await chrome.tabs.create({
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
};

/**
 * 説明の編集
 * @param {Event} e
 */
const onEdit = async (e) => {
  const targetElement = e.target.closest(".bookmark");

  const videoId = e.target.closest("details").id;
  const bookmarkId = targetElement.id;

  const input = targetElement.querySelector("input");

  const controlsElement = targetElement.querySelector(".bookmark-controls");
  controlsElement.classList.add("hidden");

  input.toggleAttribute("disabled");
  input.focus();

  const activeTab = await getCurrentTab();

  const inputClick = (e) => {
    e.stopImmediatePropagation();
  };
  const inputKeydown = (e) => {
    if (e.key === "Enter") {
      controlsElement.classList.remove("hidden");

      input.blur();
      input.toggleAttribute("disabled");

      input.removeEventListener("click", inputClick);
      input.removeEventListener("keydown", inputKeydown);

      chrome.tabs.sendMessage(activeTab.id, {
        type: "UPDATE",
        value: { id: bookmarkId, desc: input.value },
        videoId: videoId,
      });
    }
  };
  input.addEventListener("click", inputClick);
  input.addEventListener("keydown", inputKeydown);
};

/**
 * 削除
 */
const onDelete = async (e) => {
  const removeElement = e.target.closest(".bookmark") ?? e.target.closest("details");
  const videoId = e.target.closest("details").id;
  const bookmarkId = removeElement.id;

  removeElement.remove();

  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(
    activeTab.id,
    {
      type: "DELETE",
      value: bookmarkId !== videoId ? bookmarkId : undefined,
      videoId: videoId,
    },
    resTest
  );
};

const onDeleteAll = async () => {
  viewBookmarks({});
  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(
    activeTab.id,
    {
      type: "DELETE",
    },
    resTest
  );
};

/**
 * 書き出し
 */
const toExport = async () => {
  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "EXPORT",
  });
};

// popup
document.addEventListener("DOMContentLoaded", async () => {
  activeItem = await new ActiveItem();

  if (allowedUrls.includes(activeItem.activeURL.hostname)) {
    chrome.storage.sync.get(null, (allBookmarks) => {
      if (!(Object.keys(allBookmarks).length === 0)) {
        viewBookmarks(allBookmarks, activeItem.currentVideoId);
      }
    });
    // popup.html header section
    document.querySelector(".bookmark-control-save").addEventListener("click", toExport);
    document.querySelector(".bookmark-control-trash").addEventListener("click", onDeleteAll);
  } else {
    document.querySelector("body").textContent = `This page is not supported.`;
  }
});

/**
 * 秒をdateに変換する。
 * @param {number} t
 * @returns
 */
const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substring(11, 19);
};
