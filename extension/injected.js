/**
 * MAIN world — hooks de red + unmasking visual.
 * Depende de platforms.js y redact-core.js.
 */
(function () {
  if (window.__SHADOW_DLP_INSTALLED__) return;
  window.__SHADOW_DLP_INSTALLED__ = true;

  const core = window.ShadowDLPCore;
  const platforms = window.ShadowDLPPlatforms;
  if (!core || !platforms) return;

  const MARK_ATTR = "data-shadow-dlp";
  const vault = Object.create(null);
  const platform = platforms.matchPlatform(
    typeof location !== "undefined" ? location.hostname : ""
  );

  let enabled = true;

  function notify(hits, types) {
    if (!hits) return;
    window.postMessage(
      {
        source: "shadow-ai-dlp",
        type: "LOG_BLOCK",
        hits,
        types,
        platform: platform.id,
      },
      typeof location !== "undefined" ? location.origin : "*"
    );
  }

  function redactAndNotify(raw, method, url) {
    if (!enabled || typeof raw !== "string") return null;
    let parsed = null;
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    if (!platforms.shouldIntercept(url, method, parsed)) return null;
    const result = core.redactAnyBody(raw, vault);
    if (result) notify(result.hits, result.types);
    return result;
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "shadow-ai-dlp") return;
    if (data.type === "SET_ENABLED") enabled = Boolean(data.enabled);
  });

  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    try {
      const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url || "";
      const method = String(init?.method || input?.method || "GET").toUpperCase();
      if (typeof init?.body === "string" || init?.body instanceof URLSearchParams) {
        const isParams = init.body instanceof URLSearchParams;
        const redacted = redactAndNotify(String(init.body), method, url);
        if (redacted) init = { ...init, body: isParams ? new URLSearchParams(redacted.body) : redacted.body };
      } else if (input instanceof Request && init?.body == null) {
        const raw = await input.clone().text();
        const redacted = redactAndNotify(raw, method, url);
        if (redacted) input = new Request(input, { body: redacted.body });
      }
    } catch {
      /* Redacción no disponible para este transporte. */
    }
    return originalFetch.call(this, input, init);
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__shadowDlp = { method, url };
    return originalXhrOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      const meta = this.__shadowDlp || {};
      if (typeof body === "string" || body instanceof URLSearchParams) {
        const isParams = body instanceof URLSearchParams;
        const redacted = redactAndNotify(String(body), meta.method, String(meta.url || ""));
        if (redacted) body = isParams ? new URLSearchParams(redacted.body) : redacted.body;
      }
    } catch {
      /* ignore */
    }
    return originalXhrSend.call(this, body);
  };

  if (window.WebSocket) {
    const NativeWS = window.WebSocket;
    function WrappedWS(url, protocols) {
      const ws = protocols !== undefined ? new NativeWS(url, protocols) : new NativeWS(url);
      const originalSend = ws.send;
      ws.send = function (data) {
        try {
          if (typeof data === "string") {
            const redacted = redactAndNotify(data, "POST", String(url || ""));
            if (redacted) data = redacted.body;
          }
        } catch {
          /* ignore */
        }
        return originalSend.call(this, data);
      };
      return ws;
    }
    WrappedWS.prototype = NativeWS.prototype;
    WrappedWS.CONNECTING = NativeWS.CONNECTING;
    WrappedWS.OPEN = NativeWS.OPEN;
    WrappedWS.CLOSING = NativeWS.CLOSING;
    WrappedWS.CLOSED = NativeWS.CLOSED;
    window.WebSocket = WrappedWS;
  }

  if (navigator.sendBeacon) {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url, data) {
      try {
        if (typeof data === "string") {
          const redacted = redactAndNotify(data, "POST", String(url || ""));
          if (redacted) data = redacted.body;
        }
      } catch {
        /* ignore */
      }
      return originalBeacon(url, data);
    };
  }

  function wrapToken(label, value) {
    const span = document.createElement("span");
    span.setAttribute(MARK_ATTR, "1");
    span.setAttribute(
      "title",
      "Dato restaurado solo en tu pantalla. No se envió a la IA."
    );
    span.style.cssText =
      "background:rgba(76,175,80,.12);border:1px solid #4CAF50;border-radius:4px;padding:0 4px;color:#2e7d32;font-weight:600;";
    const small = document.createElement("small");
    small.style.cssText = "font-size:9px;margin-right:4px;letter-spacing:.04em;";
    small.textContent = label;
    span.appendChild(small);
    span.appendChild(document.createTextNode(value));
    return span;
  }

  function restoreInRoot(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.hasAttribute && root.hasAttribute(MARK_ATTR)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.includes("{{DLP_")) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent || parent.hasAttribute(MARK_ATTR)) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    for (const textNode of targets) {
      const raw = textNode.nodeValue;
      core.TOKEN_RE.lastIndex = 0;
      if (!core.TOKEN_RE.test(raw)) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      core.TOKEN_RE.lastIndex = 0;
      let m;
      while ((m = core.TOKEN_RE.exec(raw))) {
        if (m.index > last) frag.appendChild(document.createTextNode(raw.slice(last, m.index)));
        const token = m[0];
        const original = vault[token];
        if (original == null) frag.appendChild(document.createTextNode(token));
        else frag.appendChild(wrapToken(m[1], original));
        last = m.index + token.length;
      }
      if (last < raw.length) frag.appendChild(document.createTextNode(raw.slice(last)));
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  let scheduled = false;
  function scheduleRestore() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try {
        if (document.body) restoreInRoot(document.body);
      } catch {
        /* ignore */
      }
    });
  }

  function startObserver() {
    if (!document.documentElement) return;
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", startObserver, { once: true });
      return;
    }
    restoreInRoot(document.body);
    new MutationObserver(scheduleRestore).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  startObserver();
})();
