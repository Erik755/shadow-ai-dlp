# Cómo añadir una IA

1. Agrega hosts en `extension/platforms.js` (`PLATFORMS`).
2. Replica los mismos `matches` y `host_permissions` en `extension/manifest.json`.
3. Si el producto usa un path raro, amplia `CHAT_PATH` o `looksLikeChatPayload`.
4. Si manda protobuf / body binario, documenta la limitación en `docs/PLATFORMS.md`. No finjas cobertura.
5. Corre `node scripts/test-engine.mjs`.
6. Abre un PR contra `main`.

Reglas:

- Nada de telemetría propia. Esta extensión no debe enviar chats a ningún servidor.
- No pidas `<all_urls>`.
- Los tests del motor van en Node, sin Chrome.
