# Cobertura por plataforma

La extensión se inyecta en el origen del chat y engancha `fetch`, `XMLHttpRequest`, `WebSocket.send` y `sendBeacon`. Redacta JSON y forms (`f.req` de Gemini) que parecen un prompt.

| Plataforma | Hosts | Transporte típico | Estado |
|---|---|---|---|
| ChatGPT | chatgpt.com, chat.openai.com | fetch JSON + SSE | Cubierto |
| Claude | claude.ai | fetch JSON | Cubierto |
| Gemini / Bard / AI Studio / NotebookLM | gemini.google.com, bard.google.com, aistudio.google.com, notebooklm.google.com | fetch + form `f.req` | Parcial (protobuf / SW pueden escapar) |
| Grok | grok.com, grok.x.ai, x.com/i/grok | fetch JSON | Cubierto en web app |
| Copilot | copilot.microsoft.com, bing.com/chat | WebSocket + fetch | Parcial |
| Perplexity | perplexity.ai | fetch JSON / SSE | Cubierto |
| DeepSeek | chat.deepseek.com | fetch JSON | Cubierto |
| Meta AI | meta.ai | fetch JSON | Parcial |
| Mistral | chat.mistral.ai | fetch JSON | Cubierto |
| HuggingChat | huggingface.co/chat | fetch JSON | Cubierto |
| Poe | poe.com | fetch / WS | Parcial |
| You.com | you.com | fetch JSON | Parcial |
| Qwen | chat.qwen.ai | fetch JSON | Cubierto |
| Kimi | kimi.com | fetch JSON | Parcial |
| Character.AI | character.ai | fetch JSON | Parcial |
| Pi | pi.ai | fetch JSON | Parcial |
| OpenRouter playground | openrouter.ai | fetch JSON | Cubierto |

No cubre (aún):

- Apps de escritorio (ChatGPT, Claude, Copilot nativo)
- Extensiones de IDE (Cursor, Continue, Copilot en VS Code)
- APIs oficiales usadas desde tu backend
- Cuerpo binario / protobuf opaco
- Service workers que no pasan por `window.fetch` (Gemini a veces)

“Todas las IAs” aquí significa **chats web de consumidor conocidos**, no cualquier modelo del planeta.
