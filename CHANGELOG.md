# Changelog

Todos los cambios relevantes del proyecto. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-10-13

Primera versión estable, reescrita sobre Vite + React + TypeScript, con el nombre **Dualhook**.

### Añadido

- Editor **V1 · Clásico**: contenido, hasta 10 embeds (autor, título, descripción, campos, imágenes,
  pie, marca de tiempo) y filas de botones de enlace.
- Editor **V2 · Components V2**: contenedores, secciones (con miniatura o botón), texto, galerías,
  archivos, separadores y filas de botones, como árbol recursivo.
- Dos borradores independientes (V1 y V2) por mensaje y conversión entre modos.
- Interfaz con color de acento por modo: azul para V1 y verde para V2.
- Vista previa estilo Discord con markdown (títulos, subtexto, listas, citas, código, spoilers,
  menciones, emojis y marcas de tiempo).
- Vista JSON editable con el payload exacto que se envía.
- Validación en vivo con los límites de Discord, separada por modo.
- Envío, edición y borrado de mensajes; hilos y posts de foro; mensajes silenciosos; archivos adjuntos.
- Webhooks guardados con comprobación (nombre, avatar, canal y si es de aplicación).
- Backups manuales, automáticos, de envío e importados, con filtros por tipo y por modo.
- Importar/exportar JSON (incluye backups de Discohook y payloads sueltos) y enlaces para compartir.
- Plantillas V1 y V2.
- Atajos `Ctrl+S` (backup) y `Ctrl+Enter` (enviar).
- Build en un único `index.html` que funciona sin servidor.
- Logo propio: dos ganchos entrelazados, azul (V1) y verde (V2).
- Licencia MIT y despliegue automático en GitHub Pages (https://zer0.is-a.dev/dualhook/).
- Migración automática de los datos guardados con el nombre anterior («Hookforge»).

## [0.1.0] — 2026-10-13

- Prototipo inicial en HTML/CSS/JS sin framework, con el nombre provisional «Hookforge» (sustituido por la 1.0.0).

[1.0.0]: #100--2026-10-13
[0.1.0]: #010--2026-10-13
