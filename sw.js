// Offline support: cache the app shell and the compression engines.
// Bump VERSION whenever index.html or engine files change.
const VERSION = "pixelpress-v2";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "engine/engine.js",
  "engine/engine-chunk-TSZOAAQU.js",
  "engine/mozjpeg_enc.wasm",
  "engine/webp_enc.wasm",
  "engine/webp_enc_simd.wasm",
  "engine/squoosh_oxipng_bg.wasm",
  "engine/libimagequant_wasm_bg.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Pages: network first so updates show up, cache as the offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("index.html"))),
    );
    return;
  }

  // Engine and assets: cache first, then fill the cache on demand
  // (AVIF, HEIC, SVG and GIF engines load only when first needed).
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
