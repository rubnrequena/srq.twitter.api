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
  const pages = await browser.pages()
  console.log('Conectando con >> ', twitter, pages.length)
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image') request.abort();
    else request.continue();
  });
  await page.goto(`https://twitter.com/${twitter}`, { waitUntil: 'domcontentloaded' });
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

export async function getLotto() {
  const page = await browser.newPage()
  await page.goto("https://lottoactivo.com", { waitUntil: "networkidle2" })
  await page.click('#grupo_2');
  await page.waitForTimeout(3000);
  const elementos = await page.$$('.art-layout-cell.layout-item-2')
  const results = [];
  for (const el of elementos) {
    const h5 = await el.$('h5');
    const hora: string = await h5?.evaluate(node => node.innerText);
    const img = await el.$('img');
    const src: string = await img?.evaluate(img => img.src);
    const patron = /\d+/;
    const numeroGanador = patron.exec(src);
    if (numeroGanador) {
      results.push({
        hora: hora.slice(0, 5),
        ganador: numeroGanador[0]
      })
    }
  }
  page.close();
  log(`${new Date().getTime() - time}ms`, 'RD:', rd, 'results:', JSON.stringify(results.pop()))
  return results;
}

function log(...params: any[]) {
  if (DEBUG === 'true') {
    console.log(params)
  }
}

export interface Twitter {
  time: number,
  tweets: Tweet[]
}
export interface Tweet {
  full_text: string
}
