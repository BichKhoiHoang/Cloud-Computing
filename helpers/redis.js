const redis = require("redis");

// Redis setup
const redisClient = redis.createClient();
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.log(err);
  }
})();

module.exports = redisClient;
