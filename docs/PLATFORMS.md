# Cobertura por plataforma

La extensión se inyecta en el origen del chat y engancha `fetch`, `XMLHttpRequest`, `WebSocket.send` y `sendBeacon`. Redacta JSON, texto y forms (`f.req` de Gemini) que parecen un prompt. Estas rutas no se han verificado con sesiones reales de cada plataforma.

| Plataforma | Hosts | Transporte típico | Estado |
|---|---|---|---|
| ChatGPT | chatgpt.com, chat.openai.com | fetch JSON + SSE | Intercepción implementada; sin prueba en sitio |
| Claude | claude.ai | fetch JSON | Intercepción implementada; sin prueba en sitio |
| Gemini / Bard / AI Studio / NotebookLM | gemini.google.com, bard.google.com, aistudio.google.com, notebooklm.google.com | fetch + form `f.req` | Parcial (protobuf / SW pueden escapar) |
| Grok | grok.com, grok.x.ai, x.com/i/grok | fetch JSON | Intercepción implementada; sin prueba en sitio |
| Copilot | copilot.microsoft.com, bing.com/chat | WebSocket + fetch | Parcial; sin prueba en sitio |
| Perplexity | perplexity.ai | fetch JSON / SSE | Intercepción implementada; sin prueba en sitio |
| DeepSeek | chat.deepseek.com | fetch JSON | Intercepción implementada; sin prueba en sitio |
| Meta AI | meta.ai | fetch JSON | Parcial; sin prueba en sitio |
| Mistral | chat.mistral.ai | fetch JSON | Intercepción implementada; sin prueba en sitio |
| HuggingChat | huggingface.co/chat | fetch JSON | Intercepción implementada; sin prueba en sitio |
| Poe | poe.com | fetch / WS | Parcial; sin prueba en sitio |
| You.com | you.com | fetch JSON | Parcial; sin prueba en sitio |
| Qwen | chat.qwen.ai | fetch JSON | Intercepción implementada; sin prueba en sitio |
| Kimi | kimi.com | fetch JSON | Parcial; sin prueba en sitio |
| Character.AI | character.ai | fetch JSON | Parcial; sin prueba en sitio |
| Pi | pi.ai | fetch JSON | Parcial; sin prueba en sitio |
| OpenRouter playground | openrouter.ai | fetch JSON | Intercepción implementada; sin prueba en sitio |

No cubre (aún):

- Apps de escritorio (ChatGPT, Claude, Copilot nativo)
- Extensiones de IDE (Cursor, Continue, Copilot en VS Code)
- APIs oficiales usadas desde tu backend
- Cuerpo binario / protobuf opaco
- Service workers que no pasan por `window.fetch` (Gemini a veces)

“Todas las IAs” aquí significa **chats web de consumidor conocidos**, no cualquier modelo del planeta.
