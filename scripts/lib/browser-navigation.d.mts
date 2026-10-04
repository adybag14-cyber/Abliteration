import type { HTTPResponse, Page } from "puppeteer";

export function navigateBrowser(
  page: Page,
  destination: string,
  concurrency?: number,
): Promise<HTTPResponse | null>;

export function dismissBrowserDialog(page: Page, selector: string): Promise<void>;
