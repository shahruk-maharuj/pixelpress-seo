import { expect, test, type Page } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";
import { unzipSync } from "fflate";

const PHOTO = "tests/fixtures/photo.jpg";
const GRAPHIC = "tests/fixtures/graphic.png";

/** Errors that come from the network (fonts, AI hosts), not from the app. */
const isNetworkNoise = (msg: string) => /Failed to load resource|ERR_|fonts\.g/.test(msg);

async function addImages(page: Page, files: string[]) {
  await page.setInputFiles("#file", files);
  await expect(page.locator("#zip")).toBeEnabled({ timeout: 45_000 });
}

/** Click "Download all" and return the files inside the ZIP. */
async function downloadAll(page: Page): Promise<Record<string, Uint8Array>> {
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#zip")]);
  const path = await download.path();
  return unzipSync(new Uint8Array(readFileSync(path)));
}

/** Optimized images in the ZIP, leaving out the extra social-share (og:image) copy. */
const images = (zip: Record<string, Uint8Array>) =>
  Object.entries(zip).filter(([name]) => /\.(webp|avif|jpe?g|png)$/i.test(name) && !/-og\.\w+$/.test(name));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("loads with no app errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !isNetworkNoise(m.text()) && errors.push(m.text()));
  await page.reload();
  await expect(page.getByText("Drop images here")).toBeVisible();
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test("compresses a photo and a graphic and both get smaller", async ({ page }) => {
  await addImages(page, [PHOTO, GRAPHIC]);
  const files = images(await downloadAll(page));
  expect(files).toHaveLength(2);

  const originalTotal = statSync(PHOTO).size + statSync(GRAPHIC).size;
  const outputTotal = files.reduce((n, [, data]) => n + data.length, 0);
  expect(outputTotal).toBeLessThan(originalTotal * 0.5);
});

test("default output is WebP with SEO-friendly file names", async ({ page }) => {
  await addImages(page, [PHOTO]);
  const [[name, data]] = images(await downloadAll(page));
  expect(name).toMatch(/^[a-z0-9-/]+\.webp$/);
  // RIFF....WEBP magic bytes
  expect(String.fromCharCode(...data.slice(0, 4))).toBe("RIFF");
  expect(String.fromCharCode(...data.slice(8, 12))).toBe("WEBP");
});

test("JPG output format produces real JPEGs", async ({ page }) => {
  await page.selectOption("#q-format", "jpeg");
  await addImages(page, [PHOTO]);
  const [[name, data]] = images(await downloadAll(page));
  expect(name).toMatch(/\.jpe?g$/);
  expect([data[0], data[1]]).toEqual([0xff, 0xd8]);
});

test("Max 100 KB mode keeps every file under 100 KB", async ({ page }) => {
  await page.selectOption("#q-quality", "kb100");
  await addImages(page, [PHOTO]);
  for (const [, data] of images(await downloadAll(page))) {
    expect(data.length).toBeLessThanOrEqual(100 * 1024);
  }
});

for (const [label, delay] of [["immediately", 0], ["after the demo images load", 3000]] as const) {
  test(`your files never get the demo keyword when added ${label}`, async ({ page }) => {
    await page.waitForTimeout(delay);
    await addImages(page, [PHOTO, GRAPHIC]);
    const names = Object.keys(await downloadAll(page));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name).not.toMatch(/lake|cabin|duluth/);
  });
}

test("works offline after the first visit", async ({ page, context }) => {
  await page.waitForFunction(async () => !!(await navigator.serviceWorker?.ready), null, { timeout: 15_000 });
  await page.reload(); // let the service worker take control
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Drop images here")).toBeVisible();
  await context.setOffline(false);
});

/**
 * Samples the page every few milliseconds and records any moment where a row is still
 * queued or compressing (it shows the "working" bar) while "Download all" is clickable.
 */
async function watchDownloadButton(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__zip = { violations: [] as string[], sawBusy: false, sawFixing: false };
    setInterval(() => {
      const zip = document.querySelector<HTMLButtonElement>("#zip")!;
      const busy = document.querySelectorAll("#list .row.working");
      if ([...document.querySelectorAll("#list .aitag")].some((t) => /Fixing/.test(t.textContent || ""))) w.__zip.sawFixing = true;
      if (!busy.length) return;
      w.__zip.sawBusy = true;
      if (!zip.disabled) w.__zip.violations.push(`${busy.length} busy at ${Math.round(performance.now())} ms`);
    }, 5);
  });
}

const zipWatch = (page: Page) =>
  page.evaluate(() => (window as any).__zip as { violations: string[]; sawBusy: boolean; sawFixing: boolean });

/** Waits until no row is queued or compressing. */
const allSettled = (page: Page) =>
  page.waitForFunction(() => document.querySelectorAll("#list .row").length > 0 && !document.querySelector("#list .row.working"), null, { timeout: 45_000 });

test("Download all stays disabled while auto-fix re-encodes an image", async ({ page }) => {
  // A JPEG kept in its original format scores low on "Modern format",
  // so auto-fix (on by default) re-queues it as WebP right after it finishes.
  await page.selectOption("#q-format", "keep");
  await watchDownloadButton(page);
  await page.setInputFiles("#file", [PHOTO]);
  await page.waitForFunction(() => (window as any).__zip.sawFixing, null, { timeout: 45_000 });
  await allSettled(page);
  await expect(page.locator("#zip")).toBeEnabled();
  expect((await zipWatch(page)).violations).toEqual([]);
});

test("Download all is disabled while a single image is re-optimized", async ({ page }) => {
  await addImages(page, [PHOTO]);
  await allSettled(page);
  await watchDownloadButton(page);
  // Give the image its own quality: only that row is re-queued, not the whole batch.
  await page.locator("#list .row .f-qon").first().evaluate((box: HTMLInputElement) => {
    box.checked = true;
    box.dispatchEvent(new Event("change"));
  });
  await expect(page.locator("#zip")).toBeDisabled();
  await allSettled(page);
  await expect(page.locator("#zip")).toBeEnabled();
  const watch = await zipWatch(page);
  expect(watch.sawBusy).toBe(true);
  expect(watch.violations).toEqual([]);
});
