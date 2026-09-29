/**
 * Catálogo de IAs web conocidas.
 * Se carga en MAIN world antes de injected.js.
 */
(function (root) {
  const SKIP_PATH =
    /telemetry|analytics|logging|metrics|csp-report|client-event|rgstr|\/collect|pixel|sentry|bugsnag|crashlytics|doubleclick|pagead/i;

  const CHAT_PATH =
    /conversation|conversations|messages|message|chat|completion|completions|generate|generation|query|prompt|assistant|responses|append_message|stream|sse|perplexity_ask|lamda|bard|grok|copilot|ask|submit|turns|input/i;

  const PLATFORMS = [
    { id: "chatgpt", name: "ChatGPT", hosts: ["chatgpt.com", "chat.openai.com", "openai.com"] },
    { id: "claude", name: "Claude", hosts: ["claude.ai", "anthropic.com"] },
    { id: "gemini", name: "Gemini", hosts: ["gemini.google.com", "bard.google.com", "aistudio.google.com", "notebooklm.google.com"] },
    { id: "grok", name: "Grok", hosts: ["grok.com", "grok.x.ai", "x.ai"] },
    { id: "copilot", name: "Copilot", hosts: ["copilot.microsoft.com", "copilot.cloud.microsoft", "bing.com"] },
    { id: "perplexity", name: "Perplexity", hosts: ["perplexity.ai", "www.perplexity.ai"] },
    { id: "deepseek", name: "DeepSeek", hosts: ["chat.deepseek.com", "deepseek.com"] },
    { id: "meta", name: "Meta AI", hosts: ["meta.ai", "www.meta.ai"] },
    { id: "mistral", name: "Mistral", hosts: ["chat.mistral.ai", "mistral.ai"] },
    { id: "huggingface", name: "Hugging Face", hosts: ["huggingface.co"] },
    { id: "poe", name: "Poe", hosts: ["poe.com"] },
    { id: "you", name: "You.com", hosts: ["you.com"] },
    { id: "qwen", name: "Qwen", hosts: ["chat.qwen.ai"] },
    { id: "kimi", name: "Kimi", hosts: ["kimi.com", "www.kimi.com"] },
    { id: "character", name: "Character.AI", hosts: ["character.ai"] },
    { id: "pi", name: "Pi", hosts: ["pi.ai"] },
    { id: "openrouter", name: "OpenRouter", hosts: ["openrouter.ai"] },
    { id: "x-grok", name: "Grok en X", hosts: ["x.com"] },
  ];

  function hostOf(hostname) {
    return String(hostname || "").replace(/^www\./, "").toLowerCase();
  }

  function matchPlatform(hostname) {
    const h = hostOf(hostname);
    return (
      PLATFORMS.find((p) => p.hosts.some((x) => h === x || h.endsWith("." + x))) || {
        id: "generic",
        name: "IA genérica",
        hosts: [],
      }
    );
  }

  function looksLikeChatPayload(obj) {
    if (!obj || typeof obj !== "object") return false;
    const keys = Object.keys(obj);
    const interesting = [
      "messages",
      "message",
      "prompt",
      "input",
      "query",
      "text",
      "content",
      "parts",
      "conversation",
      "chat",
      "question",
      "user_message",
      "userMessage",
      "new_message",
    ];
    return keys.some((k) => interesting.includes(k));
  }

  function shouldIntercept(url, method, parsedBody) {
    const verb = String(method || "GET").toUpperCase();
    if (verb !== "POST" && verb !== "PUT" && verb !== "PATCH") return false;
    if (!url) return false;
    try {
      const u = new URL(url, (typeof location !== "undefined" && location.href) || "https://localhost/");
      if (SKIP_PATH.test(u.pathname + u.search)) return false;
      if (CHAT_PATH.test(u.pathname + u.search)) return true;
      if (parsedBody && looksLikeChatPayload(parsedBody)) return true;
      return false;
    } catch {
      return CHAT_PATH.test(String(url));
    }
  }

  root.ShadowDLPPlatforms = {
    PLATFORMS,
    SKIP_PATH,
    CHAT_PATH,
    matchPlatform,
    looksLikeChatPayload,
    shouldIntercept,
  };
})(typeof window !== "undefined" ? window : globalThis);
