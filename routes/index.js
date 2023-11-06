const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "FileConvert" });
});

/* GET About page. */
router.get("/about", function (req, res, next) {
  res.render("index", { title: "About" });
});

module.exports = router;
