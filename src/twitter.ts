import puppeteer, { Browser } from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

const { DEBUG = "false" } = process.env;
let browser: Browser;
const articlePath: string =
  process.env.ARTICLE || "article > [data-testid=tweetText]";

export async function initTwitter() {
  browser = await puppeteer.launch({
    headless: process.env.CHROME_HEADLESS == "true",
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ["--no-sandbox", `--window-size=1920,1080`],
  });
}
export async function parse(twitter: string) {
  const pages = await browser.pages();
  console.log("Conectando con >> ", twitter, pages.length);
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.resourceType() === "image") request.abort();
    else request.continue();
  });
  await page.goto(`https://twitter.com/${twitter}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(articlePath, { timeout: 10000 }).catch(() => {
    page.close();
  });
  const articles = await page.$$eval(articlePath, (spans: Element[]) => {
    return spans.map((span) => span.textContent || "");
  });
  await page.close();

  const tweets: Tweet[] = articles.map((article) => {
    return { full_text: article.replace(/\n/gi, " ") };
  });
  const result: Twitter = { time: Date.now(), tweets: tweets };
  return result;
}

export async function getLotto(rd = false) {
  const time = new Date().getTime();
  const page = await browser.newPage();
  await page
    .goto("https://lottoactivo.com", {
      waitUntil: "networkidle2",
      timeout: 60000,
    })
    .catch((e) => {
      console.error(e);
      Promise.resolve(null);
      page.close();
    });
  if (rd) await page.click("#grupo_2");
  await page.waitForTimeout(3000);
  const elementos = await page.$$(".art-layout-cell.layout-item-2");
  const results = [];
  for (const el of elementos) {
    const h5 = await el.$("h5");
    const hora: string = (await h5?.evaluate((node) => node.innerText)) || "";
    const horaCorta: string = hora.slice(0, 5);
    if (rd && horaCorta.split(":").pop() == "00") continue;
    if (!rd && horaCorta.split(":").pop() == "30") continue;
    const img = await el.$("img");
    const src: string = (await img?.evaluate((img) => img.src)) || "";
    const patron = /\d+/;
    const numeroGanador = patron.exec(src);
    if (numeroGanador) {
      results.push({
        hora: horaCorta,
        ganador: numeroGanador[0],
      });
    }
  }
  page.close();
  log(
    `${new Date().getTime() - time}ms`,
    "RD:",
    rd,
    "results:",
    JSON.stringify(results[results.length - 1])
  );
  return results;
}

function log(...params: any[]) {
  if (DEBUG === "true") {
    console.log(params);
  }
}

export interface Twitter {
  time: number;
  tweets: Tweet[];
}
export interface Tweet {
  full_text: string;
}
