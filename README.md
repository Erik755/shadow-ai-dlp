# Shadow AI DLP

Extensión de Chrome (Manifest V3) que intercepta el texto **antes** de que una IA web lo reciba, sustituye algunos datos personales por tokens en ciertos cuerpos de petición y restaura los tokens visibles en la página. No garantiza que el sitio no reciba los datos originales por otras rutas.

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

En Network, revisa el cuerpo de la petición que transporta el mensaje: debe llevar `{{DLP_EMAIL_...}}`. Comprueba también que ninguna otra petición lleve el valor original. La restauración visual usa un recuadro verde.

## Desarrollo

```bash
node scripts/test-engine.mjs
node scripts/test-transport.mjs
```

Arquitectura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).  
Cómo sumar una IA: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Límites

- Solo chats **web**. No cubre apps de escritorio, IDEs ni tu backend llamando a una API.
- Gemini a veces usa service workers o protobuf; esos caminos pueden escapar.
- Si el modelo reescribe el token, no se puede desenmascarar.
- El sitio puede leer el texto antes del envío desde el editor y observar o modificar el código ejecutado en la página. No introduzcas secretos reales confiando únicamente en esta extensión.
- No cubre todas las rutas de red: cuerpos binarios, parámetros de URL, datos codificados, `fetch` con ciertos tipos de cuerpo, service workers e iframes pueden escapar.
- Cualquier extensión con permisos sobre un chat **puede** leer ese chat. Revisa el código antes de instalarlo.

## Licencia

MIT.
