"use strict";

import { getCurrentTab, htmlToElement, getTime } from "../utils/utils.js";
import { ActiveItem } from "../src/ActiveItem.js";
import { allowedUrls } from "../config/allowedUrls.js";

/**
 * ブックマークタイトルの作成
 * @param {string} title
 * @returns
 */
const createBookmarkVideoTitle = (db) => {
  const { title, channelTitle, icon } = db;

  const html = `
  <summary class="bk-title-container">
    <div class="bk-title">
      ${icon.startsWith("https") ? `<img src=${icon} alt="" class="channel-icon"/>` : icon}
      <div class="channel-title">${channelTitle}</div>
      <div class="bookmark-controls">
        ${createbkControlElement(["delete"])}
      </div>
      <div class="bk-video-title">
        ${title}
      </div>
    </div>
  </summary>
  `;

  const bookmarkVideoTitleElement = htmlToElement(html);

  setBookmarkAttributes(bookmarkVideoTitleElement);

  return bookmarkVideoTitleElement;
};

// -------------------------------------------------------------------------
/**
 * ブックマークリストを作成
 * @param {Object} bookmarks
 * @returns
 */
const createBookmarkTimeList = (bookmarks) => {
  const bookmarkTimeListElement = document.createElement("div");
  bookmarkTimeListElement.className = "bk-time-list";

  const sortedbks = bookmarks.sort((a, b) => a.time - b.time);

  for (const { id, time, desc } of sortedbks) {
    const html = `
      <div id="${id}" class="bookmark" data-timestamp="${time}" data-action="play">
        <div class="bookmark-desc">
          <input type="text" value="${desc}" disabled />
          <div class="bk-time">
            <span class="time">${getTime(time)}</span>
          </div>
        </div>
        <div class="bookmark-controls">
          ${createbkControlElement(["edit", "delete"])}
        </div>
      </div>
    `;

    const bookmarkElement = htmlToElement(html);

    setBookmarkAttributes(bookmarkElement);

    bookmarkTimeListElement.appendChild(bookmarkElement);
  }

  return bookmarkTimeListElement;
};

const setBookmarkAttributes = (element) => {
  element.addEventListener("click", (e) => {
    console.log(e.target);
    e.stopImmediatePropagation();

    const onAction = {
      play: onPlay,
      edit: onEdit,
      delete: onDelete,
      timeBack: changeTime,
      timeForward: changeTime,
    };

    const action = e.target.closest("[data-action]");
    if (action) {
      onAction[action.dataset.action](e);
    }
  });
};

/**
 *
 * @param {string | string[]} acts
 * @returns
 */
const createbkControlElement = (acts) => {
  acts = [].concat(acts);

  let html = "";
  acts.forEach((value) => {
    html += `
    <button class="tm-icon-s" data-action="${value}">
      <svg viewBox="0 0 100 100">
        <use href="#icon-${value}" />
      </svg>
    </button>
    `;
  });

  return html;
};
// -------------------------------------------------------------------------

/**
 * videoId ごとの要素を作成
 * @param {object} db
 * @param {string} videoId
 * @returns
 */
const createBookmarkItemElement = (db, videoId) => {
  const bookmarkItemElement = document.createElement("details");
  bookmarkItemElement.id = videoId;
  bookmarkItemElement.classList.add("bk-container");

  const bookmarkVideoTitleElement = createBookmarkVideoTitle(db);

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
const viewBookmarks = (allBookmarks = {}, currentTmId) => {
  const container = document.querySelector(".container");

  const videoIds = Object.keys(allBookmarks);
  if (videoIds.length === 0 || !(allBookmarks.constructor === Object)) {
    container.innerHTML = "";
    return;
  }

  videoIds.forEach((videoId) => {
    const bookmark = JSON.parse(allBookmarks[videoId]);

    const bookmarkItemElement = createBookmarkItemElement(bookmark, videoId);

    if (videoId === currentTmId) {
      bookmarkItemElement.open = true;
      container.insertAdjacentElement("afterbegin", bookmarkItemElement);
    } else {
      container.insertAdjacentElement("beforeend", bookmarkItemElement);
    }
  });
};

/**
 * setBookmarkAttributes の eventListhener
 * @param {Event} e
 */
const onPlay = async (e) => {
  console.log("play");
  if (e.defaultPrevented) return;

  const bookmarkElement = e.currentTarget;
  const bookmarkTime = bookmarkElement.dataset.timestamp;
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
  e.target.closest("button").blur();

  const parentElement = e.target.closest(".bookmark");
  const input = parentElement.querySelector("input");

  const videoId = e.target.closest("details").id;
  const bookmarkId = parentElement.id;

  const activeTab = await getCurrentTab();

  toggleEdit();

  // edit mode
  function toggleEdit() {
    const time = parentElement.querySelector(".time").textContent;
    const editable = `
    <div class="bk-time">
      <button class="tm-icon-s step" data-action="timeBack">
        <svg id="icon-time" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" />
          <rect width="60" height="10" x="20" y="45" ry="5" style="fill:white;"/>
        </svg>
      </button>
      <span class="time">${time}</span>
      <button class="tm-icon-s step" data-action="timeForward">
        <svg id="icon-time" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" />
          <rect width="60" height="10" x="20" y="45" ry="5" style="fill:white;" />
          <rect width="10" height="60" x="45" y="20" ry="5" style="fill:white;" />
        </svg>
      </button>
    </div>
    `;
    const uneditable = `
      <div class="bk-time">
        <span class="time">${time}</span>
      </div>
      `;

    const editElement = parentElement.querySelector(".bk-time");
    const isEdit = parentElement.hasAttribute("edit");
    if (isEdit) {
      // uneditable
      console.log("uneditable");
      editElement.replaceWith(htmlToElement(uneditable));
      parentElement.removeAttribute("edit");
      input.setAttribute("disabled", "true");
      input.removeEventListener("click", inputClick);
      input.removeEventListener("keydown", inputKeydown);
      document.getSelection().removeAllRanges();
    } else {
      // editable
      console.log("editable");
      editElement.replaceWith(htmlToElement(editable));
      parentElement.setAttribute("edit", "true");
      input.removeAttribute("disabled");
      input.focus();
      input.select();
      input.addEventListener("click", inputClick);
      input.addEventListener("keydown", inputKeydown);
    }
  }

  // input event listener
  function inputClick(e) {
    e.stopImmediatePropagation();
  }
  function inputKeydown(e) {
    if (e.key === "Enter") {
      toggleEdit();

      chrome.tabs.sendMessage(activeTab.id, {
        type: "UPDATE",
        value: { id: bookmarkId, desc: input.value },
        videoId: videoId,
      });
    }
  }
};

/**
 * 削除
 */
const resTest = (removeElement) => {
  removeElement.remove();
};
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
 * タイムスタンプの時間調整
 */
const changeTime = async (e) => {
  const timeElement = e.target.closest(".bk-time");
  const bkElement = e.target.closest(".bookmark");

  const videoId = e.target.closest("details").id;
  const bkId = bkElement.id;

  const time = Number.parseFloat(bkElement.dataset.timestamp);
  const step = e.target.closest(".step").dataset.action;

  let chengedTime;
  switch (step) {
    case "timeBack":
      chengedTime = time - 1;
      break;

    case "timeForward":
      chengedTime = time + 1;
      break;

    default:
      break;
  }

  timeElement.querySelector(".time").textContent = getTime(chengedTime);
  bkElement.dataset.timestamp = chengedTime;

  const activeTab = await getCurrentTab();
  chrome.tabs.sendMessage(activeTab.id, {
    type: "UPDATE",
    value: { id: bkId, time: chengedTime },
    videoId: videoId,
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
      console.log(allBookmarks);
      viewBookmarks(allBookmarks, activeItem.tmId);
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
  const { tmId } = event.data;

  if (allowedUrls.includes(event.origin)) {
    const db = await chrome.storage.sync.get(tmId);

    const addedId = JSON.parse(db[tmId])["bookmarks"].at(-1)["id"];

    const container = document.querySelector(".container");

    // const removeElement = document.querySelector(`#${tmId}`);
    const removeElement = document.getElementById(tmId);
    if (removeElement) {
      removeElement.remove();
    }

    const element = createBookmarkItemElement(JSON.parse(db[tmId]), tmId);
    element.open = true;

    container.insertAdjacentElement("afterbegin", element);

    // イベントを発生させる
    const newBkElement = element.querySelector(`.bookmark[id='${addedId}']`);
    const edit = newBkElement.querySelector(`[data-action='edit']`);
    const evt = new Event("click", { bubbles: true, cancelable: false });
    edit.dispatchEvent(evt);
    setTimeout(() => {
      newBkElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }
});
