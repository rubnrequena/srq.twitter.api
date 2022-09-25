import dotenv from "dotenv";
import express from "express";
import { getLotto as getLotto, initTwitter, parse, Twitter } from "./twitter";
const app = express();
dotenv.config();

initTwitter().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`server started at http://localhost:${process.env.PORT}`);
  });
});

const cacheTweets: Map<string, Twitter> = new Map();

app.get("/twitter/tweets/:twitter", async (req, res) => {
  const { twitter } = req.params;
  if (twitter == undefined) return res.send("must send username");
  if (typeof twitter == "string") {
    let tweets = cacheTweets.get(twitter);
    const now = Date.now();
    if (tweets && now - tweets.time < parseInt(process.env.CACHE_TIME || "0")) {
      res.json(tweets.tweets);
    } else {
      cacheTweets.set(twitter, { time: Date.now(), tweets: [] });
      const tweetsResult = await parse(twitter).catch((error) => {
        console.error("ERROR:", error);
        res.json("");
        return { time: Date.now(), tweets: [] };
      });
      cacheTweets.set(twitter, tweetsResult);
      res.json(tweetsResult.tweets);
      return tweets;
    }
  }
});

app.get("/lottord", async (req, res) => {
  getLotto(true)
    .then((results: any) => {
      res.json(results);
    })
    .catch((e: Error) => {
      console.log("ERROR /lottord");
      res.json();
    });
});

app.get("/lotto", async (req, res) => {
  getLotto()
    .then((results: any) => {
      res.json(results);
    })
    .catch((e: Error) => {
      console.log("ERROR /lotto");
      res.json();
    });
});
