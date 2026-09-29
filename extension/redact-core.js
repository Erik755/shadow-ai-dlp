/**
 * Motor de detección y tokenización. Sin DOM. Testeable en Node.
 */
(function (root) {
  const TOKEN_RE = /\{\{DLP_([A-Z0-9]+)_([A-Z0-9]{6,})\}\}/g;

  function randomId() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(36).toUpperCase().padStart(2, "0"))
        .join("")
        .slice(0, 8);
    }
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function luhnOk(digits) {
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = digits.charCodeAt(i) - 48;
      if (n < 0 || n > 9) return false;
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function validIPv4(raw) {
    const parts = raw.split(".");
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      if (!/^\d{1,3}$/.test(p)) return false;
      const n = Number(p);
      return n >= 0 && n <= 255 && String(n) === p;
    });
  }

  function looksLikeApiKey(s) {
    return (
      /^sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{16,}$/.test(s) ||
      /^sk-ant-[A-Za-z0-9_-]{16,}$/.test(s) ||
      /^xai-[A-Za-z0-9_-]{16,}$/.test(s) ||
      /^ghp_[A-Za-z0-9]{20,}$/.test(s) ||
      /^github_pat_[A-Za-z0-9_]{20,}$/.test(s) ||
      /^xox[baprs]-[A-Za-z0-9-]{10,}$/.test(s) ||
      /^AKIA[0-9A-Z]{16}$/.test(s) ||
      /^AIza[0-9A-Za-z\-_]{20,}$/.test(s)
    );
  }

  const RULES = [
    {
      id: "EMAIL",
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    },
    {
      id: "APIKEY",
      regex:
        /\b(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|xai-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{20,})\b/g,
      validate: looksLikeApiKey,
    },
    {
      id: "CURP",
      regex: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi,
    },
    {
      id: "RFC",
      regex: /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/gi,
    },
    {
      id: "TARJETA",
      regex: /\b(?:\d[ -]?){13,19}\b/g,
      validate: (match) => {
        const digits = match.replace(/\D/g, "");
        if (digits.length < 13 || digits.length > 19) return false;
        if (/^0+$/.test(digits)) return false;
        return luhnOk(digits);
      },
    },
    {
      id: "TELEFONO",
      regex:
        /(?:\+52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)?\d{3,4}[\s.-]\d{4}\b|\+\d{1,3}[\s.-]\d{2,4}[\s.-]\d{3,4}[\s.-]\d{3,4}\b/g,
    },
    {
      id: "IP",
      regex: /\b\d{1,3}(?:\.\d{1,3}){3}\b/g,
      validate: (m) => validIPv4(m) && m !== "0.0.0.0" && m !== "255.255.255.255",
    },
    {
      id: "DINERO",
      regex: /(?:[$\u20ac\u00a3]|MXN|USD|EUR)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/g,
    },
    {
      id: "NOMBRE",
      regex:
        /(?:mi nombre es|me llamo|soy|llamado|atentamente|sr\.|sra\.|my name is|i am)\s+([A-ZÁÉÍÓÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÑÜ][a-záéíóúñü]+)+)/gi,
      extract: (match, groups) => groups[1] || match,
    },
  ];

  const SKIP_KEYS = new Set([
    "id",
    "conversation_id",
    "parent_message_id",
    "message_id",
    "author",
    "role",
    "model",
    "timezone",
    "action",
    "content_type",
    "type",
    "kind",
    "authorization",
    "uuid",
    "organization_uuid",
    "conversation_uuid",
    "client_id",
    "session_id",
    "request_id",
  ]);

  function createVault(initial) {
    return initial && typeof initial === "object" ? initial : {};
  }

  function tokenize(vault, original, ruleId) {
    const token = `{{DLP_${ruleId}_${randomId()}}}`;
    vault[token] = original;
    return token;
  }

  function redactText(text, vault) {
    if (typeof text !== "string" || text.length < 3) {
      return { text, hits: 0, types: [] };
    }
    let out = text;
    let hits = 0;
    const types = [];
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      out = out.replace(rule.regex, (...args) => {
        const match = args[0];
        const groups = args.slice(1, -2);
        if (rule.validate && !rule.validate(match)) return match;
        const value = rule.extract ? rule.extract(match, groups) : match;
        if (!value || value.length < 2) return match;
        hits += 1;
        types.push(rule.id);
        if (rule.extract && value !== match) {
          return match.replace(value, tokenize(vault, value, rule.id));
        }
        return tokenize(vault, match, rule.id);
      });
    }
    return { text: out, hits, types };
  }

  function redactTree(node, vault, acc) {
    if (!acc) acc = { hits: 0, types: [] };
    if (typeof node === "string") {
      const result = redactText(node, vault);
      acc.hits += result.hits;
      acc.types.push(...result.types);
      return result.text;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) node[i] = redactTree(node[i], vault, acc);
      return node;
    }
    if (node && typeof node === "object") {
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (typeof val === "string") {
          if (!SKIP_KEYS.has(key.toLowerCase()) && val.length >= 4) {
            const result = redactText(val, vault);
            if (result.hits) {
              node[key] = result.text;
              acc.hits += result.hits;
              acc.types.push(...result.types);
            }
          }
        } else if (val && typeof val === "object") {
          redactTree(val, vault, acc);
        }
      }
    }
    return node;
  }

  function tryRedactJsonString(raw, vault) {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
    try {
      const parsed = JSON.parse(raw);
      const acc = { hits: 0, types: [] };
      redactTree(parsed, vault, acc);
      if (!acc.hits) return null;
      return { body: JSON.stringify(parsed), hits: acc.hits, types: acc.types, parsed };
    } catch {
      return null;
    }
  }

  function tryRedactFormBody(raw, vault) {
    if (typeof raw !== "string" || raw.indexOf("=") === -1) return null;
    if (raw.trim().startsWith("{")) return null;
    try {
      const params = new URLSearchParams(raw);
      let hits = 0;
      const types = [];
      let changed = false;
      for (const [key, value] of params.entries()) {
        if (!value) continue;
        let next = value;
        if (key === "f.req" || value.trim().startsWith("[") || value.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(value);
            const acc = { hits: 0, types: [] };
            redactTree(parsed, vault, acc);
            if (acc.hits) {
              next = JSON.stringify(parsed);
              hits += acc.hits;
              types.push(...acc.types);
            }
          } catch {
            const result = redactText(value, vault);
            if (result.hits) {
              next = result.text;
              hits += result.hits;
              types.push(...result.types);
            }
          }
        } else {
          const result = redactText(value, vault);
          if (result.hits) {
            next = result.text;
            hits += result.hits;
            types.push(...result.types);
          }
        }
        if (next !== value) {
          params.set(key, next);
          changed = true;
        }
      }
      if (!changed) return null;
      return { body: params.toString(), hits, types };
    } catch {
      return null;
    }
  }

  function redactAnyBody(raw, vault) {
    if (typeof raw !== "string" || raw.length < 4) return null;
    return tryRedactJsonString(raw, vault) || tryRedactFormBody(raw, vault);
  }

  root.ShadowDLPCore = {
    TOKEN_RE,
    RULES,
    createVault,
    redactText,
    redactTree,
    tryRedactJsonString,
    tryRedactFormBody,
    redactAnyBody,
    luhnOk,
  };
})(typeof window !== "undefined" ? window : globalThis);
