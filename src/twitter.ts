import puppeteer, { Browser } from 'puppeteer-core';

let browser: Browser;
const articlePath: string = 'article > div > div > div > div.css-1dbjc4n.r-18u37iz > div.css-1dbjc4n.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu > div:nth-child(2) > div:nth-child(1) > div > span';

export async function initTwitter() {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: process.env.CHROME_HEADLESS == 'true'
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

  await page.waitForSelector(articlePath);
  const articles = await page.$$eval(articlePath, (spans: Element[]) => {
    return spans.map(span => span.innerHTML)
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
