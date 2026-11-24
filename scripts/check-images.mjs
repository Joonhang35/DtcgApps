
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "database", "v2", "images.json");
const OUTPUT = path.join(ROOT, "database", "v2", "reports", "image-check-report.json");

const CONCURRENCY = 10;
const TIMEOUT = 15000;

const images = JSON.parse(await fs.readFile(INPUT, "utf8"));

let nextIndex = 0;
let accessible = 0;
let failed = 0;
let invalidContentType = 0;

const failures = [];
const invalidImages = [];

async function checkImage(image) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(image.url, {
      method: "GET",
      signal: controller.signal
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      failed++;
      failures.push({
        imageId: image.imageId,
        cardId: image.cardId,
        url: image.url,
        status: response.status
      });
    } else if (!contentType.toLowerCase().startsWith("image/")) {
      invalidContentType++;
      invalidImages.push({
        imageId: image.imageId,
        cardId: image.cardId,
        url: image.url,
        contentType
      });
    } else {
      accessible++;
    }

    if (response.body) {
      await response.body.cancel();
    }
  } catch (error) {
    failed++;
    failures.push({
      imageId: image.imageId,
      cardId: image.cardId,
      url: image.url,
      error: error.message
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function worker() {
  while (nextIndex < images.length) {
    const index = nextIndex++;
    await checkImage(images[index]);

    const completed = accessible + failed + invalidContentType;

    if (completed % 100 === 0 || completed === images.length) {
      console.log(`Checked ${completed}/${images.length}`);
    }
  }
}

await Promise.all(
  Array.from(
    { length: CONCURRENCY },
    () => worker()
  )
);

const report = {
  checkedAt: new Date().toISOString(),
  total: images.length,
  accessible,
  failed,
  invalidContentType,
  failures,
  invalidImages
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, JSON.stringify(report, null, 2));

console.log("\nImage check complete:");
console.log(JSON.stringify({
  total: report.total,
  accessible,
  failed,
  invalidContentType,
  report: OUTPUT
}, null, 2));
