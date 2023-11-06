const express = require("express");
const router = express.Router();

const redisClient = require("../helpers/redis");

router.post("/", async (req, res) => {
  const pin = req.body.pin;
  console.log("Requested pin:", pin);

  const imageUrl = await redisClient.get(pin);
  if (imageUrl) {
    console.log("Image URL:", imageUrl);
    res.redirect(imageUrl);
  } else {
    console.log("Pin does not exist");
    res.redirect("/?error=true&msg=Pin does not exist");
  }
});

module.exports = router;
