const ALLOWED_ORIGIN = location.origin;

chrome.storage.local.get({ enabled: true }, (res) => {
  window.postMessage(
    {
      source: "shadow-ai-dlp",
      type: "SET_ENABLED",
      enabled: res.enabled !== false,
    },
    ALLOWED_ORIGIN
  );
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.enabled) return;
  window.postMessage(
    {
      source: "shadow-ai-dlp",
      type: "SET_ENABLED",
      enabled: changes.enabled.newValue !== false,
    },
    ALLOWED_ORIGIN
  );
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.origin !== ALLOWED_ORIGIN) return;
  const data = event.data;
  if (!data || data.source !== "shadow-ai-dlp" || data.type !== "LOG_BLOCK") return;

  try {
    chrome.runtime.sendMessage({
      type: "DATA_BLOCKED",
      hits: Number(data.hits) || 1,
      types: Array.isArray(data.types) ? data.types.slice(0, 20) : [],
      platform: data.platform || "generic",
    });
  } catch {
    /* extension recargada */
  }
});
