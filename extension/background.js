const DEFAULT_STATE = {
  enabled: true,
  blockedCount: 0,
  lastTypes: [],
  lastPlatform: "",
};

async function loadState() {
  const stored = await chrome.storage.local.get(DEFAULT_STATE);
  return {
    enabled: stored.enabled !== false,
    blockedCount: Number(stored.blockedCount) || 0,
    lastTypes: Array.isArray(stored.lastTypes) ? stored.lastTypes : [],
    lastPlatform: stored.lastPlatform || "",
  };
}

async function paintBadge(state) {
  if (!state.enabled) {
    await chrome.action.setBadgeText({ text: "OFF" });
    await chrome.action.setBadgeBackgroundColor({ color: "#757575" });
    return;
  }
  const text = state.blockedCount > 0 ? String(Math.min(state.blockedCount, 999)) : "";
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: "#2E7D32" });
}

async function refreshBadge() {
  await paintBadge(await loadState());
}

chrome.runtime.onInstalled.addListener(refreshBadge);
chrome.runtime.onStartup.addListener(refreshBadge);
refreshBadge();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!request || request.type !== "DATA_BLOCKED") return;
  (async () => {
    const state = await loadState();
    if (!state.enabled) {
      sendResponse({ ok: false, disabled: true });
      return;
    }
    state.blockedCount += Math.max(1, Number(request.hits) || 1);
    if (Array.isArray(request.types) && request.types.length) {
      state.lastTypes = request.types.slice(-8);
    }
    if (request.platform) state.lastPlatform = request.platform;
    await chrome.storage.local.set(state);
    await paintBadge(state);
    sendResponse({ ok: true, blockedCount: state.blockedCount });
  })();
  return true;
});
