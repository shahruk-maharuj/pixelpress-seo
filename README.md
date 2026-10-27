# PixelPress SEO

**Bulk image compressor with built-in image SEO.** Drop in a folder of images and get back small, sharp, properly named files with alt text, ready for Google. Everything runs in your browser; nothing is uploaded.

Most compressors only shrink files. PixelPress also does the SEO work you'd otherwise do by hand for every image: file names, alt text, metadata, schema and sitemaps.

## Why it's different

- **Private.** Images never leave your device. There's no server to upload to.
- **No limits.** No 20-image cap, no 5 MB limit, no sign-up.
- **Pro codecs, in the browser.** MozJPEG, libwebp, libavif, OxiPNG and libimagequant compiled to WebAssembly, running in parallel workers.
- **Smart quality.** For each image it searches for the smallest file that still looks identical, measured with SSIM, instead of using one fixed quality for everything.
- **Starts instantly.** Compression begins with the browser's built-in encoder while the pro engine loads in the background.

## Features

**Compression**
- JPEG, PNG, WebP, AVIF, GIF, SVG and iPhone HEIC in; WebP, AVIF, JPEG or PNG out
- Auto format picks the best format per image (photos vs screenshots and graphics)
- Target size mode: "max 100 KB each" and similar
- Resize presets, including product photos on a white square for Amazon, Shopify and Etsy
- Animated GIF compression and GIF → MP4
- Folder and ZIP input, with folder structure kept in the output
- Bulk text or logo watermarks, smart crop, `<picture>` sets (AVIF + WebP + JPEG)

**Image SEO**
- SEO file names from your page keyword and location, or **AI auto-naming** from what's actually in the image
- Alt text, titles and captions, with an SEO score per image and one-click **Auto-fix** for anything under 80
- IPTC and XMP metadata (so WordPress picks up titles and captions), or strip camera data with one toggle
- Ready-to-paste `<img>` and `srcset` code, ImageObject schema, `og:image` versions and an image sitemap
- CSV report of everything

**AI, bring your own key**
Works with Google Gemini (free tier), Groq (free tier), OpenRouter, OpenAI, Anthropic, local Ollama or any OpenAI-compatible endpoint. The app has a step-by-step setup guide for each. Keys stay in your browser.

**Works offline** as an installable app (PWA).

## Run it

It's a static site, so there's no build step.

```bash
git clone https://github.com/shahruk-maharuj/pixelpress-seo
cd pixelpress-seo
npm start          # http://localhost:4173
```

Or put the folder on any static host (GitHub Pages, Netlify, Vercel, your own server). Serve `.wasm` files as `application/wasm`.

## Tests

End-to-end tests run the real app in Chromium: they compress real images, download the ZIP and check the files inside.

```bash
npm install
npx playwright install chromium
npm test
```

## Project layout

```
index.html            the whole app (UI + logic)
engine/               WebAssembly codecs and their loaders
sw.js                 offline cache
manifest.webmanifest  installable app metadata
tests/                Playwright tests and fixtures
```

## Contributing

Issues and pull requests are welcome. Pick something from [ROADMAP.md](ROADMAP.md), add a test in `tests/`, and make sure `npm test` passes.

## License

The app code is MIT licensed. The codecs in `engine/` keep their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Made by [Shahruk Maharuj](https://github.com/shahruk-maharuj).
