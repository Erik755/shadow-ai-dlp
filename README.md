# Shadow AI DLP

Extensión de Chrome (Manifest V3) que intercepta el texto **antes** de que una IA web lo reciba, sustituye PII por tokens y lo vuelve a mostrar solo en tu pantalla.

Repo de trabajo: [github.com/Erik755/shadow-ai-dlp](https://github.com/Erik755/shadow-ai-dlp)

Esto es una herramienta local de investigación. No es un DLP empresarial. No envía tus chats a ningún servidor nuestro: no hay backend.

## Qué cubre

ChatGPT, Claude, Gemini, Grok, Copilot, Perplexity, DeepSeek, Meta AI, Mistral, HuggingChat, Poe, You.com, Qwen, Kimi, Character.AI, Pi y OpenRouter.

Detalle honesto por producto: [`docs/PLATFORMS.md`](docs/PLATFORMS.md).

Detecta correo, tarjetas (Luhn), teléfonos, IPv4, dinero, nombres con contexto, RFC, CURP y API keys (`sk-`, `sk-ant-`, `xai-`, `ghp_`, `AKIA`, `AIza`).

## Instalar (load unpacked)

1. Clona el repo.
2. Abre `chrome://extensions/`.
3. Activa **Modo desarrollador**.
4. **Cargar descomprimida** → carpeta `extension/`.
5. Recarga por completo la pestaña del chat.

## Probar

Usa un número que pase Luhn:

```
Hola, soy Juan Perez, mi tarjeta es 4111111111111111,
mi correo es juan@perez.com, mi teléfono es +52 442 123 4567
y mi RFC es XAXX010101000.
¿Qué datos tienes de mí?
```

En Network el body debe llevar `{{DLP_EMAIL_...}}`. En pantalla, el valor original con recuadro verde.

## Desarrollo

```bash
node scripts/test-engine.mjs
```

Arquitectura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).  
Cómo sumar una IA: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Límites

- Solo chats **web**. No cubre apps de escritorio, IDEs ni tu backend llamando a una API.
- Gemini a veces usa service workers o protobuf; esos caminos pueden escapar.
- Si el modelo reescribe el token, no se puede desenmascarar.
- Cualquier extensión con host permissions sobre un chat **puede** leer ese chat. Revisa el código antes de instalarlo.

## Licencia

MIT.
