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
