"use strict";

const MENU_ID = "google-ai-search-towa";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "「%s」とは で Google AI 検索",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const selectedText = (info.selectionText || "").trim();
  if (selectedText.length === 0) {
    return;
  }

  // 選択テキストの長さを制限（悪用防止）
  const MAX_QUERY_LENGTH = 200;
  const query = selectedText.length > MAX_QUERY_LENGTH
    ? selectedText.substring(0, MAX_QUERY_LENGTH)
    : selectedText;

  // 「とは」を付けてGoogle検索URLを構築
  const searchQuery = query + "とは";
  const searchUrl = new URL("https://www.google.com/search");
  searchUrl.searchParams.set("q", searchQuery);

  chrome.tabs.create({ url: searchUrl.toString() });
});
