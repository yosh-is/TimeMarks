/**
 * アクティブ状態のタブを取得
 * @returns
 */
export async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * HTML文字列からHTML要素を作成して返す
 * @param {string} html
 */
export function htmlToElement(html) {
  const template = document.createElement("template");
  template.insertAdjacentHTML("beforeend", html);
  return template.firstElementChild;
}

/**
 * 秒をdateに変換する。
 * @param {number} t
 * @returns
 */
export const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substring(11, 19);
};
