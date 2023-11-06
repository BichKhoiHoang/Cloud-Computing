const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const redis = require("redis");
require("dotenv").config();
const AWS = require("aws-sdk");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const multer = require("multer");
const sharp = require("sharp");

const app = express();

// TODO: EXPORT TO ENV FILE
// Cloud Services Set-up
// Create unique bucket name and this bucket is public (objects can be accessed).
const bucketName = "khoihoang-19122001";
// const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const s3 = new AWS.S3({
  // AWS credentials and region configuration
  accessKeyId: "ASIA5DYSEEJ42G655SH7",
  secretAccessKey: "sJUmnpSveOVYqOoOqVlcBVW9FmsVidKob49E6n71",
  sessionToken:
    "IQoJb3JpZ2luX2VjEEkaDmFwLXNvdXRoZWFzdC0yIkgwRgIhAJ/5NnyobXPXW1gnNXCdiIM7Vm6ISsRUcZndEAa1E1nuAiEA77jSSncGSViEJn473pr1YfyN2xm7/yPrIRWGLTYAXQ0qrgMIgv//////////ARADGgw5MDE0NDQyODA5NTMiDH0/bYv64mtvWponhyqCA1PYw/CYEdZ7+/pGOopoIcTwao7RJpY0UuY43nD73KYUDu7V32/i8dIMb3XV9e46yWpJV4c1PFxIjZVjHPB2tqCP0UoulVdX2A5vPeGixRHf8qfBFclU8q68vs+wrUihZqOvL3lI44QFQNLON9CdKEaQjZ6DBGeCdgrkYMkYPRJ6hQNLdnfBCoyuACr2XB+wV8Y0W3QJ1tE4UN9KTB2fz+9V0WfOOBgYSdyWzJ5JtFNFFm43/GI1w7XPhwU9zy7Qfx1Vj+z8xf8IHhoK1hGFPL8DFoMZK4HPIGk4jtDMROozum4Wlj8FxrvxxJNmfzd+mWnK3cZ3Bic6h92d901IT2CDZsV289SteSBzvbTRjFuK0vusCtPHBGyCYdWwmG+76hUmoAZH1GZr3+8XdSHpX70VMM8vA2nYikwWtGu/ZpG4SSN/Ja4S+1R2PqVfPLtgc6Il6ajdMCQKQLKfQC0ZnL2ywlSippKTveQGgGD7Z+qoSK4fALSTTT7Or/e3xLb4vPckMI37oKoGOqUBvVylH+oebN9ZGnAJQxgl1DUxA8LufgFTPfLMWi80yl8xCgCpxxAJDkjNahLi30m6wkx9yqcs6ZzDdgvb00i9HhZx231nuo/ipUig0wuJA0SvbAAAmnuK/wkEY0GE0rygRNEybkdm/NjfZD4bhVOv380rjRVMkBVRhrL7DSadjE7ngdaOgWzggCRX7K+kpRHEkDPgQiwtPSJvPSjh2VT/TfObd/0n",
  region: "ap-southeast-2",
});

(async () => {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
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
app.use("/users", usersRouter);

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
const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).array("images", 5);

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  // Check the extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the mimetype
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

function generateUniquePin() {
  var chars = "01234567890abcdefghijklmnopqrstuvwxyz";
  var pinLength = 5;
  var uniquePin = "";
  for (var i = 0; i <= pinLength; i++) {
    var randomNum = Math.floor(Math.random() * chars.length);
    uniquePin += chars.substring(randomNum, randomNum + 1);
  }
  return uniquePin;
}

function checkIfPinExists(generatedPin) {
  redisClient.get(generatedPin, (err, reply) => {
    if (err) {
      console.error("Error occurred:", err);
      // Handle the error case
    } else {
      if (reply === null) {
        console.log(`The PIN '${generatedPin}' does not exist in Redis.`);
      } else {
        console.log(`The PIN '${generatedPin}' already exists in Redis.`);
      }
    }
  });
}

app.post("/upload", upload, async function (req, res, next) {
  console.log(req.body);
  let images = [];
  try {
    if (
      req.fileValidationError &&
      req.fileValidationError.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.send("Too many images uploaded (limit: 12)");
    }
    await Promise.all(
      req.files.map(async (file) => {
        const newFileName = `${Date.now()}-${file.originalname}`;

        const processedImage = await sharp(file.buffer)
          .resize({ width: 640, height: 320 })
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        const processedParams = {
          Bucket: bucketName,
          Key: `processed/${newFileName}`,
          Body: processedImage,
        };

        await s3.upload(processedParams).promise();
        console.log("processed image saved on s3!");

        images.push({
          processed: processedImage,
          uploaded: file.buffer,
        });

        const imageUrl = `https://${bucketName}.s3.ap-southeast-2.amazonaws.com/processed/${newFileName}`;

        var pin = generateUniquePin();
        redisClient.set(pin, imageUrl);
        console.log("Saved in redis");
      })
    );
    // console.log(images);
    res.render("result", { images });
  } catch (error) {
    res.json({ success: false, message: "Error processing images" });
  }
});

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
