import dotenv from 'dotenv';
import express from 'express'
import { getLotto as getLotto, initTwitter, parse, Twitter } from './twitter';
const app = express();
dotenv.config();

initTwitter().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`server started at http://localhost:${process.env.PORT}`);
  });
})

const cacheTweets: Map<string, Twitter> = new Map();

app.get("/twitter/tweets/:twitter", async (req, res) => {
  const { twitter } = req.params;
  if (twitter == undefined) return res.send('must send username')
  if (typeof (twitter) == "string") {
    let tweets = cacheTweets.get(twitter);
    const now = Date.now();
    if (tweets && (now - tweets.time) < parseInt(process.env.CACHE_TIME || "0")) {
      res.json(tweets);
    } else {
      cacheTweets.set(twitter, { time: Date.now(), tweets: [] });
      const tweetsResult = await parse(twitter).catch((error) => {
        console.error("ERROR:", error)
        res.json("");
        return { time: Date.now(), tweets: [] }
      })
      cacheTweets.set(twitter, tweetsResult);
      res.json(tweetsResult);
      return tweets
    }
  }
});

let cacherd: any;
let cacherdtime: number;
app.get("/lottord", async (req, res) => {
  const now = new Date().getTime();
  console.log("time", now - cacherdtime)
  if (now - cacherdtime < 60000) {
    console.log('GET /lottord cache')
    res.json(cacherd);
  } else {
    console.log('GET /lottord')
    cacherdtime = now;
    getLotto(true).then(results => {
      cacherd = results;
      res.json(results);
    }).catch(e => {
      cacherdtime = 0;
      console.log('ERROR /lottord')
      res.json(cacherd);
    })
  }
})

app.get("/lotto", async (req, res) => {
  getLotto().then(results => {
    res.json(results);
  }).catch(e => {
    console.log('ERROR /lottord')
    res.json(cacherd);
  })
})