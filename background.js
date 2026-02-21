"use strict";

/**
 * Google AI検索 - 右クリック「とは」検索
 *
 * セキュリティ方針:
 * - 最小権限の原則（contextMenus のみ）
 * - 入力の厳格なサニタイズ
 * - 許可ドメインのホワイトリスト検証
 * - 安全なURL構築（URL API）
 * - エラーの安全な処理
 */

const MENU_ID = "google-ai-search-towa";
const MAX_QUERY_LENGTH = 200;
const ALLOWED_ORIGIN = "https://www.google.com";

/**
 * 入力テキストをサニタイズする
 * - 制御文字を除去
 * - 先頭・末尾の空白を除去
 * - 長さを制限
 */
function sanitizeInput(text) {
  if (typeof text !== "string") {
    return "";
  }

  // 制御文字（タブ・改行含む）を半角スペースに置換
  // eslint-disable-next-line no-control-regex
  const cleaned = text.replace(/[\x00-\x1F\x7F]/g, " ");

  // 連続する空白を1つに圧縮し、前後の空白を除去
  const trimmed = cleaned.replace(/\s+/g, " ").trim();

  // 長さ制限
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return trimmed.substring(0, MAX_QUERY_LENGTH);
  }

  return trimmed;
}

/**
 * 構築したURLが許可されたオリジンであるか検証する
 */
function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.origin === ALLOWED_ORIGIN &&
      parsed.protocol === "https:" &&
      parsed.pathname === "/search"
    );
  } catch {
    return false;
  }
}

/**
 * 検索URLを安全に構築する
 */
function buildSearchUrl(query) {
  const searchUrl = new URL("/search", ALLOWED_ORIGIN);
  searchUrl.searchParams.set("q", query + "とは");

  const urlString = searchUrl.toString();

  // 構築後に再検証（防御的プログラミング）
  if (!isAllowedUrl(urlString)) {
    return null;
  }

  return urlString;
}

// コンテキストメニュー登録
chrome.runtime.onInstalled.addListener(() => {
  // 既存メニューを一旦全削除してから再作成（重複防止）
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("Failed to remove menus:", chrome.runtime.lastError.message);
    }

    chrome.contextMenus.create(
      {
        id: MENU_ID,
        title: "「%s」とは で Google AI 検索",
        contexts: ["selection"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to create menu:", chrome.runtime.lastError.message);
        }
      }
    );
  });
});

// クリックハンドラ
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const query = sanitizeInput(info.selectionText);
  if (query.length === 0) {
    return;
  }

  const url = buildSearchUrl(query);
  if (url === null) {
    console.error("URL validation failed. Aborting navigation.");
    return;
  }

  chrome.tabs.create({ url }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to create tab:", chrome.runtime.lastError.message);
    }
  });
});
