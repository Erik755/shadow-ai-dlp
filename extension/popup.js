function render(state) {
  document.getElementById("count").textContent = state.blockedCount || 0;
  document.getElementById("enabled").checked = state.enabled !== false;
  document.getElementById("status").textContent =
    state.enabled === false ? "DLP pausado" : "DLP local activo";
  const bits = [];
  if (state.lastPlatform) bits.push(state.lastPlatform);
  if (Array.isArray(state.lastTypes) && state.lastTypes.length) {
    bits.push([...new Set(state.lastTypes)].join(" · "));
  }
  document.getElementById("meta").textContent = bits.length ? "Último: " + bits.join(" / ") : "";
}

chrome.storage.local.get(
  { blockedCount: 0, lastTypes: [], lastPlatform: "", enabled: true },
  render
);

chrome.storage.onChanged.addListener(() => {
  chrome.storage.local.get(
    { blockedCount: 0, lastTypes: [], lastPlatform: "", enabled: true },
    render
  );
});

document.getElementById("enabled").addEventListener("change", async (ev) => {
  const enabled = ev.target.checked;
  const state = await chrome.storage.local.get({
    blockedCount: 0,
    lastTypes: [],
    lastPlatform: "",
    enabled: true,
  });
  state.enabled = enabled;
  await chrome.storage.local.set(state);
  await chrome.action.setBadgeText({
    text: enabled ? (state.blockedCount ? String(Math.min(state.blockedCount, 999)) : "") : "OFF",
  });
  await chrome.action.setBadgeBackgroundColor({ color: enabled ? "#2E7D32" : "#757575" });
  render(state);
});

document.getElementById("reset").addEventListener("click", async () => {
  const enabled = document.getElementById("enabled").checked;
  await chrome.storage.local.set({
    blockedCount: 0,
    lastTypes: [],
    lastPlatform: "",
    enabled,
  });
  await chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
  render({ blockedCount: 0, lastTypes: [], lastPlatform: "", enabled });
});
