const express = require("express");
const router = express.Router();

router.get("/:pin", async (req, res) => {
  const pin = req.params.pin;
  console.log("Requested pin:", pin);

  const imageUrl = await redisClient.get(pin);
  if (imageUrl) {
    console.log("Image URL:", imageUrl);
    res.redirect(imageUrl);
  } else {
    console.log("Pin does not exist");
  }
});

module.exports = router;
