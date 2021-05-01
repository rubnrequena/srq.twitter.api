import dotenv from 'dotenv';
import express from 'express'
import { initTwitter, parse, Twitter } from './twitter';
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
      console.log("cache time", twitter, (now - tweets.time), parseInt(process.env.CACHE_TIME || "0"));
      res.json(tweets.tweets);
    } else {
      tweets = await parse(twitter);
      cacheTweets.set(twitter, tweets);
      res.json(tweets.tweets);
    }
  }
});