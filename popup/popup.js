import { getCurrentTab, htmlToElement, getTime } from "../utils/utils.js";
import { ActiveItem } from "../src/ActiveItem.js";
import { allowedUrls } from "../config/allowedUrls.js";

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
      <div class="bookmark-controls"></div>
    </div>
  </summary>
  `;

  const bookmarkVideoTitleElement = htmlToElement(html);

  setBookmarkAttributes("delete", bookmarkVideoTitleElement);

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

  const sortedbks = bookmarks.sort((a, b) => a.time - b.time);

  for (const { id, time, desc } of sortedbks) {
    const html = `
      <div id="${id}" class="bookmark" timestamp="${time}">
        <div class="bookmark-desc">
          <input type="text" value="${desc}" disabled />
          <label>${getTime(time)}</label>
        </div>
        <div class="bookmark-controls"></div>
      </div>
    `;

    const bookmarkElement = htmlToElement(html);

    setBookmarkAttributes(["edit", "delete"], bookmarkElement);
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
const setBookmarkAttributes = (src, element) => {
  const controlsElement = element.querySelector(".bookmark-controls");

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
    let action = e.target.closest("[data-action]").dataset.action ?? undefined;
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
  const container = document.querySelector(".container");

  const currentBookmarksElement = document.querySelector("#current-bookmarks");
  const otherBookmarksElement = document.querySelector("#other-bookmarks");
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

/**
 * setBookmarkAttributes の eventListhener
 * @param {Event} e
 */
const onPlay = async (e) => {
  if (e.defaultPrevented) return;

  const bookmarkElement = e.currentTarget;
  const bookmarkTime = bookmarkElement.getAttribute("timestamp");
  const videoId = bookmarkElement.parentElement.parentElement.id;

  const activeTab = await getCurrentTab();
  const activeItem = new ActiveItem(activeTab.url);

  if (activeItem.tmId === videoId) {
    chrome.tabs.sendMessage(activeTab.id, {
      type: "PLAY",
      value: bookmarkTime,
      videoId: videoId,
    });
  } else {
    await chrome.tabs.create({
      url: ActiveItem.createUrl(videoId),
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

const resTest = (removeElement) => {
  removeElement.remove();
};

/**
 * 削除
 */
const onDelete = async (e) => {
  const removeElement = e.target.closest(".bookmark") ?? e.target.closest("details");
  const videoId = e.target.closest("details").id;

  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(
    activeTab.id,
    {
      type: "DELETE",
      value: removeElement.id,
      videoId: videoId,
    },
    resTest.bind(null, removeElement)
  );
};

const onDeleteAll = async () => {
  viewBookmarks({});
  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
  });
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
  const activeTab = await getCurrentTab();
  const activeItem = new ActiveItem(activeTab.url);

  if (allowedUrls.includes(activeItem.origin)) {
    chrome.storage.sync.get(null, (allBookmarks) => {
      if (!(Object.keys(allBookmarks).length === 0)) {
        viewBookmarks(allBookmarks, activeItem.tmId);
      }
    });
    // popup.html header section
    document.querySelector(".bookmark-control-save").addEventListener("click", toExport);
    document.querySelector(".bookmark-control-trash").addEventListener("click", onDeleteAll);
  } else {
    document.querySelector("body").textContent = `This page is not supported.`;
  }
});

// iframe でのメッセージのやりとり
window.addEventListener("message", async (event) => {
  // IMPORTANT: check the origin of the data!
  const tmId = event.data.id;
  if (allowedUrls.includes(event.origin)) {
    const db = await chrome.storage.sync.get(tmId);
    const currentBookmarksElement = document.querySelector("#current-bookmarks");
    currentBookmarksElement.innerHTML = "";

    const element = createBookmarkItemElement(JSON.parse(db[tmId]), tmId);
    element.open = true;

    currentBookmarksElement.insertAdjacentElement("afterbegin", element);
  }
});
