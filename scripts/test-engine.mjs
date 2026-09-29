import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { console, URL, URLSearchParams };
vm.createContext(context);
for (const file of ["extension/platforms.js", "extension/redact-core.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const { ShadowDLPCore: core, ShadowDLPPlatforms: platforms } = context;
let failed = 0;

function assert(name, cond) {
  if (!cond) {
    failed += 1;
    console.error("FAIL", name);
  } else {
    console.log("ok  ", name);
  }
}

const vault = {};
const sample =
  "Hola, soy Juan Perez, mi tarjeta es 4111111111111111, mi correo es juan@perez.com, tel +52 442 123 4567 y RFC XAXX010101000. sk-ant-abcdefghijklmnopqrstuvwxyz";
const redacted = core.redactText(sample, vault);
assert("detecta email", redacted.types.includes("EMAIL"));
assert("detecta tarjeta Luhn", redacted.types.includes("TARJETA"));
assert("detecta nombre", redacted.types.includes("NOMBRE"));
assert("detecta telefono", redacted.types.includes("TELEFONO"));
assert("detecta rfc", redacted.types.includes("RFC"));
assert("detecta api key", redacted.types.includes("APIKEY"));
assert("no deja el correo en claro", !redacted.text.includes("juan@perez.com"));
assert("no deja la tarjeta en claro", !redacted.text.includes("4111111111111111"));
assert("token de correo en body", /\{\{DLP_EMAIL_[A-Z0-9]+\}\}/.test(redacted.text));
const fakeMail = Object.keys(vault).find((k) => String(vault[k]) === "juan@perez.com");
assert("bóveda conserva correo", fakeMail && redacted.text.includes(fakeMail));
const fakeCard = Object.keys(vault).find((k) => String(vault[k]).includes("4111111111111111"));
assert("bóveda conserva tarjeta", fakeCard && redacted.text.includes(fakeCard));
assert("rechaza tarjeta invalida", !core.redactText("4540123456789012", {}).types.includes("TARJETA"));
assert("luhn demo visa", core.luhnOk("4111111111111111"));

const chatBody = JSON.stringify({
  messages: [{ role: "user", content: { parts: ["escribe a ana@empresa.com"] } }],
});
const jsonHit = core.tryRedactJsonString(chatBody, {});
assert("redacta JSON anidado", jsonHit && jsonHit.hits >= 1);

assert(
  "chatgpt conversation",
  platforms.shouldIntercept("https://chatgpt.com/backend-api/f/conversation", "POST", { messages: [] })
);
assert(
  "claude append",
  platforms.shouldIntercept("https://claude.ai/api/organizations/x/chat_conversations/y/completion", "POST", { prompt: "hi" })
);
assert(
  "grok rest",
  platforms.shouldIntercept("https://grok.com/rest/app-chat/conversations/new", "POST", { message: "hi" })
);
assert(
  "ignora telemetry",
  !platforms.shouldIntercept("https://chatgpt.com/backend-api/conversation/telemetry", "POST", { messages: [] })
);
assert("consulta telemetry no desactiva chat", platforms.shouldIntercept("https://chatgpt.com/backend-api/f/conversation?note=telemetry", "POST", {messages:[]}));
assert("texto plano protegido", core.redactAnyBody("ana@empresa.com", {})?.body.includes("DLP_EMAIL"));
assert("URL codificada protegida", !core.redactText("mailto%3Aana%40empresa.com", {}).text.includes("ana%40empresa.com"));
assert("plataforma chatgpt", platforms.matchPlatform("chatgpt.com").id === "chatgpt");
assert("plataforma claude", platforms.matchPlatform("claude.ai").id === "claude");
assert("plataforma grok", platforms.matchPlatform("grok.com").id === "grok");

const cases = [
  ["correo en Markdown", "[Juan](mailto:juan@empresa.com)", "juan@empresa.com", "EMAIL"],
  ["correo en enlace codificado", "https://x.test/?q=mailto%3Aana%40empresa.com", "ana%40empresa.com", "EMAIL"],
  ["tarjeta con espacios", "tarjeta 4111 1111 1111 1111", "4111 1111 1111 1111", "TARJETA"],
  ["CURP", "CURP GODE561231HDFRRN09", "GODE561231HDFRRN09", "CURP"],
  ["IPv4 válida", "IP 192.168.1.50", "192.168.1.50", "IP"],
  ["IPv4 inválida", "IP 999.168.1.50", null, "IP"],
  ["número telefónico", "+52 442 123 4567", "+52 442 123 4567", "TELEFONO"],
  ["token ya redactado", "{{DLP_EMAIL_ABCDEF12}}", null, null],
];
for (const [name, input, secret, type] of cases) {
  const result = core.redactText(input, {});
  assert(name, secret ? result.types.includes(type) && !result.text.includes(secret) : !result.types.includes(type));
}
const form = core.tryRedactFormBody("f.req=" + encodeURIComponent(JSON.stringify([["ana@empresa.com"]])), {});
assert("Gemini f.req", form && !form.body.includes("ana%40empresa.com"));
const nested = { role: "user", content: "ana@empresa.com", metadata: { id: "ana@empresa.com" } };
const acc = { hits: 0, types: [] };
core.redactTree(nested, {}, acc);
assert("omite identificadores y redacta contenido", acc.hits === 1 && nested.metadata.id === "ana@empresa.com" && !nested.content.includes("ana@empresa.com"));
if (failed) {
  console.error("\n" + failed + " tests failed");
  process.exit(1);
}
console.log("\nall tests passed");
