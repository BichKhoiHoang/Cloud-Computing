const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const redis = require("redis");
require("dotenv").config();
const AWS = require("aws-sdk");

const indexRouter = require("./routes/index");
const uploadRouter = require("./routes/upload");

const app = express();

// TODO: EXPORT TO ENV FILE
// Cloud Services Set-up
// Create unique bucket name and this bucket is public (objects can be accessed).
const bucketName = process.env.bucketName;
// const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const s3 = new AWS.S3({
  // AWS credentials and region configuration
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  sessionToken: process.env.sessionToken,
  region: process.env.region,
});

(async () => {
  try {
    await s3.createBucket({ Bucket: process.env.bucketName }).promise();
    console.log(`Created bucket: ${process.env.bucketName}`);
  } catch (err) {
    // We will ignore 409 errors which indicate that the bucket already exists;
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    }
  }
})();

// Redis setup
const redisClient = redis.createClient();
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.log(err);
  }
})();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/upload", uploadRouter);

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images/uploaded");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({
//   storage: storage,
//   // fileFilter: function (req, file, cb) {
//   //   checkFileType(file, cb);
//   // },
// });

app.get("/image/:pin", async (req, res) => {
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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
