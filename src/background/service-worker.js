importScripts("../lib/banks.js", "../lib/detect.js", "../lib/storage.js");

const NS = self.NairaShield;
const WARNING_PATH = "src/warning/warning.html";

function isExtensionPage(url) {
  return url.startsWith("chrome") || url.startsWith("edge") || url.startsWith("about:") || url.startsWith("moz-extension") || url.includes(WARNING_PATH);
}

function warningUrl(target) {
  return chrome.runtime.getURL(WARNING_PATH) + "?u=" + encodeURIComponent(target);
}

async function inspectNavigation(details) {
  if (details.frameId !== 0) return;
  const url = details.url;
  if (!url || isExtensionPage(url) || !/^https?:/.test(url)) return;
  if (await NS.isAllowed(url)) return;

  const settings = await NS.getDetectionContext();
  if (!settings.interceptEnabled) return;

  const result = NS.analyzeUrl(url, {}, settings);
  if (result.level === "danger") {
    chrome.tabs.update(details.tabId, { url: warningUrl(url) });
  }

  if (result.host && result.level !== "clear") {
    NS.addRecent({
      host: result.host,
      level: result.level,
      title: result.title,
      at: Date.now()
    });
  }
}

chrome.webNavigation.onCommitted.addListener((details) => {
  inspectNavigation(details).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "NS_LOG_CHECK" && message.result && message.result.host) {
    NS.addRecent({
      host: message.result.host,
      level: message.result.level,
      title: message.result.title,
      at: Date.now()
    }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message && message.type === "NS_REFRESH_FEED") {
    NS.refreshThreatFeed().then((result) => sendResponse(result));
    return true;
  }
  return false;
});

async function updateBadge(tabId, url) {
  if (!url || isExtensionPage(url) || !/^https?:/.test(url)) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  const settings = await NS.getDetectionContext();
  const result = NS.analyzeUrl(url, {}, settings);
  const colors = { safe: "#1FA971", caution: "#F5B942", danger: "#FF5A57" };
  const texts = { safe: "OK", caution: "!", danger: "!" };
  if (!colors[result.level]) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  chrome.action.setBadgeBackgroundColor({ tabId, color: colors[result.level] });
  chrome.action.setBadgeText({ tabId, text: texts[result.level] });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadge(tabId, tab.url).catch(() => {});
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  updateBadge(tab.id, tab.url).catch(() => {});
});

function scheduleFeedRefresh() {
  chrome.alarms.create("ns_threat_refresh", { periodInMinutes: 720 });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#1FA971" });
  scheduleFeedRefresh();
  NS.refreshThreatFeed().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  scheduleFeedRefresh();
  NS.refreshThreatFeed().catch(() => {});
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === "ns_threat_refresh") {
    NS.refreshThreatFeed().catch(() => {});
  }
});
