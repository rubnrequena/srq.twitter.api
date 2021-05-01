module.exports = {
  apps: [{
    script: './build/index.js',
    name: "srq.twitter",
    env: {
      PORT: 3003,
      CHROME_PATH: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      CHROME_HEADLESS: "true",
      CACHE_TIME: 60000
    }
  }],
};
