import dotenv from 'dotenv';
import express from 'express'
import { initTwitter, parse } from './twitter';
const app = express();


dotenv.config();

initTwitter().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`server started at http://localhost:${process.env.PORT}`);
  });
})

app.get("/twitter/tweets/:twitter", async (req, res) => {
  const { twitter } = req.params;
  if (twitter == undefined) return res.send('must send username')
  if (typeof (twitter) == "string") {
    const tweets = await parse(twitter);
    res.json(tweets);
  }
});

