/** Navigate through the browser, then wait for a settled document.
 * Keeping navigation and the idle check separate avoids depending on the
 * combined DevTools Page.navigate/lifecycle timing of a Chromium version.
 */
export async function navigateBrowser(page, destination, concurrency = 0) {
  const url = new URL(destination);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Audit navigation requires an HTTP(S) URL");
  const [response] = await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 45_000 }),
    page.evaluate((href) => {
      window.location.assign(href);
    }, url.href),
  ]);
  await page.waitForNetworkIdle({
    idleTime: 500,
    concurrency,
    timeout: 45_000,
  });
  return response;
}
