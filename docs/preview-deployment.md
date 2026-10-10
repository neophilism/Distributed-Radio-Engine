# Render development preview

Build command: `npm run check`.

Start command: `npm start`.

Runtime: Node.js >=22; default process listens on `0.0.0.0:$PORT`. No database, media keys, paid cloud tier or sensitive environment variables are needed for the preview.

- `/healthz` returns 200 when this **preview server** is reachable. It does **not** mean radio broadcasting is active.
- `/readyz` and `/api/readiness` return 503 until actual secure live-station prerequisites are met and independently verified.
- `/api/status` returns development and release-gate states; it must never be interpreted as live audio or speaker verification.
- `/` is an explicit disclosure-oriented development-status page.

When a real radio backend is available, replace the readiness handler with real checks for authorized station program, ciphertext delivery, key channels, required rights, and qualified device support. Do not turn readiness green merely to satisfy health dashboards. Engine Room can monitor the health and separate readiness indicators.
