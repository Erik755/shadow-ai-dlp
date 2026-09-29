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
assert("manda correo sintético", /@/.test(redacted.text) && !redacted.text.includes("{{DLP_EMAIL"));
const fakeMail = Object.keys(vault).find((k) => String(vault[k]) === "juan@perez.com");
assert("restaura correo en la respuesta", fakeMail && core.restoreText("cuenta " + fakeMail, vault).includes("juan@perez.com"));
const fakeCard = Object.keys(vault).find((k) => String(vault[k]).includes("4111111111111111"));
assert(
  "restaura last4 de tarjeta",
  fakeCard &&
    core.restoreText("pagada con tarjeta *" + fakeCard.replace(/\D/g, "").slice(-4), vault).includes("1111")
);
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
assert("plataforma chatgpt", platforms.matchPlatform("chatgpt.com").id === "chatgpt");
assert("plataforma claude", platforms.matchPlatform("claude.ai").id === "claude");
assert("plataforma grok", platforms.matchPlatform("grok.com").id === "grok");

if (failed) {
  console.error("\n" + failed + " tests failed");
  process.exit(1);
}
console.log("\nall tests passed");
