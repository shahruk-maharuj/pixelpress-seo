// Offline support: cache the app shell and the compression engines.
// Bump VERSION whenever index.html or engine files change.
const VERSION = "pixelpress-v4";
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

// Engines that load only when a format needs them. They're big (about 6 MB),
// so they aren't part of the install. The page asks for them once it's idle,
// so every format works offline, not just the ones already used.
const LAZY = [
  "engine/engine-avif_enc-LMBWQXB7.js",
  "engine/avif_enc.wasm",
  "engine/engine-libheif-bundle-72LQLQ72.js",
  "engine/engine-svgo.browser-ZXHO3R3P.js",
  "engine/engine-gifsicle.min-6YFEKZDP.js",
];

async function precacheLazy() {
  const cache = await caches.open(VERSION);
  for (const url of LAZY) {
    if (await cache.match(url)) continue;
    try {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    } catch {
      // Offline or flaky network: try again on the next visit.
    }
  }
}

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

self.addEventListener("message", (event) => {
  if (event.data === "precache-engines") event.waitUntil(precacheLazy());
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
