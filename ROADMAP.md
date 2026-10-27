# Roadmap

Work top to bottom. Each item should be one pull request with a test in `tests/`. Tick the box in the PR that ships it.

## Reliability

- [x] **Keep "Download all" disabled while any image is still working.** The ZIP already waits for busy images (see `tests/app.spec.ts`), but the button should also reflect it: call `refreshAll()` whenever an item's status changes, including when auto-fix re-queues an image.
- [ ] **Self-host the fonts** (Roboto, Roboto Mono, Google Sans Flex) so the app looks right offline and makes no third-party requests.
- [ ] **Precache the lazy engines** (AVIF, HEIC, SVG, GIF) after first idle, so every format works offline, not just the ones already used.
- [ ] **Error-state test:** a corrupt image shows a clear error on its row and doesn't block the rest of the batch.

## Code health

- [ ] **Split `index.html`** into `index.html`, `styles.css` and ES modules under `src/` (UI, queue, SEO, AI, ZIP) with no change in behavior. Do it one module per PR, with the full test suite green after each.
- [ ] **Unit tests** for the pure helpers once they're modules: slugify, SEO scoring, ZIP writer and the CSV report.

## Product

- [ ] **Before/after comparison slider** on each row.
- [ ] **Shareable settings:** encode the current settings in the URL so a team can share one preset.
- [ ] **Rename patterns:** `{keyword}-{location}-{n}` style templates in More settings.
- [ ] **Lighthouse budget check:** paste a page URL's image list and show which images would fail Core Web Vitals.

## Distribution

- [ ] **Publish the WordPress plugin** (Media Library fixer) in `wordpress-plugin/`.
- [ ] **Demo GIF** at the top of the README, recorded from the real app.
- [ ] **Benchmarks** in the README: the same 20 images through PixelPress, TinyPNG and Squoosh, with sizes and SSIM.
