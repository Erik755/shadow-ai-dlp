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
                         tokens sintéticos (Ana López, user99@test.com)
                                      │
                     MutationObserver restaura en el DOM
```

- **MAIN world** ve las mismas primitivas de red que la app de la IA.
- **ISOLATED world** es el único que habla con `chrome.runtime`.
- La bóveda vive en `sessionStorage` del origen del chat. No se sube a `chrome.storage`.
- El service worker solo guarda contadores y el toggle.
- Sale un dato falso del mismo formato. El original no viaja. Al volver, se reescribe en pantalla.

Principio: si el motor DLP lanza, la petición original sigue. No hay denegación de servicio del chat.
