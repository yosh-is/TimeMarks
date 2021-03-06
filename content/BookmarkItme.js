export class BookmarkItem {
  constructor() {
    this.title = "";
  }

  /**
   * ブックマークのリストを取得
   * @param {string} videoId
   * @returns
   */
  fetchBookmarks(videoId) {
    if (!videoId) {
      return undefined;
    }
    return new Promise((resolve) => {
      chrome.storage.sync.get([videoId], (items) => {
        resolve(items[videoId] ? JSON.parse(items[videoId]) : undefined);
      });
    });
  }

  /**
   * ブックマークの追加
   * @param {string} videoId
   * @param {object} newBookmark
   */
  async addBookmark(videoId, newBookmark) {
    let bookmarks = [];
    const item = await this.fetchBookmarks(videoId);

    if (item !== undefined) {
      const ids = Object.values(item["bookmarks"].map((item) => item.id));
      newBookmark["id"] = Math.max(...ids) + 1;

      bookmarks = [...item["bookmarks"], newBookmark].sort((a, b) => a.time - b.time);
    } else {
      newBookmark["id"] = 1;
      bookmarks = [newBookmark];
    }

    const updateItem = {
      title: this.title,
      bookmarks: bookmarks,
    };

    chrome.storage.sync.set({ [videoId]: JSON.stringify(updateItem) });
  }

  /**
   * ブックマークの更新
   * @param {string} videoId
   * @param {string} id
   * @param {string} desc
   */
  async updateBookmark(videoId, { id, desc }) {
    const item = await this.fetchBookmarks(videoId);
    const bookmark = item["bookmarks"].find((b) => b.id == id);
    const bookmarks = item["bookmarks"].filter((b) => b.id != id);

    bookmark["desc"] = desc;
    item["bookmarks"] = [...bookmarks, bookmark].sort((a, b) => a.time - b.time);

    chrome.storage.sync.set({ [videoId]: JSON.stringify(item) });
  }

  /**
   * ブックマークの削除
   * @param {string} videoId
   * @param {stirng} id id
   */
  async deleteBookmark(videoId, id) {
    if (!videoId && !id) {
      chrome.storage.sync.clear();
    } else if (videoId !== id) {
      const item = await this.fetchBookmarks(videoId);
      const bookmarks = item["bookmarks"].filter((b) => {
        return b.id != id;
      });

      if (bookmarks.length === 0) {
        chrome.storage.sync.remove(videoId);
      } else {
        item["bookmarks"] = bookmarks;
        chrome.storage.sync.set({ [videoId]: JSON.stringify(item) });
      }
    } else if (videoId === id) {
      chrome.storage.sync.remove(videoId);
    }
  }

  /**
   * 書き出し
   */
  async exportBookmark() {
    const items = await chrome.storage.sync.get(null);

    let temp = {};
    for (const [key, value] of Object.entries(items)) {
      const obj = JSON.parse(value);
      temp[key] = obj;
    }

    const contents = JSON.stringify(temp, null, 2);

    // File System Access API
    const options = {
      types: [
        {
          description: ".json",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
      suggestedName: "bookmarks.json",
      excludeAcceptAllOption: true,
    };

    const fileHandle = await window.showSaveFilePicker(options);

    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }
}
