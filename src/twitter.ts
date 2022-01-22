import puppeteer, { Browser } from 'puppeteer-core';

let browser: Browser;
const articlePath: string = process.env.ARTICLE || 'article > .css-1dbjc4n';

export async function initTwitter() {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: process.env.CHROME_HEADLESS == 'true',
    args: [
      '--no-default-browser-check',
      '--disable-infobars',
      '--disable-web-security',
      '--disable-site-isolation-trials',
      '--no-experiments',
      '--ignore-gpu-blacklist',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-default-apps',
      '--enable-features=NetworkService',
      '--disable-setuid-sandbox',
      '--no-sandbox',
    ]
  })
}
export async function parse(twitter: string) {
  console.log('Conectando con >> ', twitter)
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image') request.abort();
    else request.continue();
  });
  await page.goto(`https://twitter.com/${twitter}`, { waitUntil: 'domcontentloaded' });
  console.log("articulo", process.env.ARTICLE, " ||||| ", articlePath)
  await page.waitForSelector(articlePath, { timeout: 10000 }).catch(() => {
    page.close()
  })
  const articles = await page.$$eval(articlePath, (spans: Element[]) => {
    return spans.map(span => span.textContent || '')
  })
  await page.close();

  const tweets: Tweet[] = articles.map(article => {
    return { full_text: article.replace(/\n/gi, " ") }
  })
  const result: Twitter = { time: Date.now(), tweets: tweets };
  return result
}

export interface Twitter {
  time: number,
  tweets: Tweet[]
}
export interface Tweet {
  full_text: string
}
