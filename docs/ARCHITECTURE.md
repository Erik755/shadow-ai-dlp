# Arquitectura

```
popup.js  →  chrome.storage  →  content.js (ISOLATED)
                                      │ postMessage
                                      ▼
platforms.js + redact-core.js + injected.js (MAIN)
                                      │
                    fetch / XHR / WebSocket / sendBeacon
                                      │
                              JSON o form redactado
                                      │
                         tokens de texto {{DLP_TIPO_ID}}
                                      │
                     MutationObserver restaura en el DOM
```

- **MAIN world** ve las mismas primitivas de red que la app de la IA.
- **ISOLATED world** es el único que habla con `chrome.runtime`.
- La bóveda vive en memoria de la pestaña y se pierde al recargar. No se sube a `chrome.storage`.
- El service worker solo guarda contadores y el toggle.
- En los cuerpos interceptados se envía un token, que puede restaurarse visualmente cuando aparece en el DOM. El texto introducido en el editor es accesible para el sitio; esta arquitectura no garantiza aislamiento de secretos.

Principio: si el motor DLP lanza, la petición original sigue. No hay denegación de servicio del chat.
