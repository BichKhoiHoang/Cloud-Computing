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

// Cloud Services Set-up
// Create unique bucket name
const bucketName = "khoihoang-19122001";
// const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const s3 = new AWS.S3({
  // AWS credentials and region configuration
  accessKeyId: "ASIA5DYSEEJ4WLA2CWIF",
  secretAccessKey: "UtUz4oxlLKVmd/PxaDZBd4o/WCh78nUDjas4GdWa",
  sessionToken:
    "IQoJb3JpZ2luX2VjEDQaDmFwLXNvdXRoZWFzdC0yIkcwRQIgBWNSOC6/nfBL/rhq1ZwNopVa8LwRzaCPuW1QxcJBJisCIQC/zPe49+8nm65wnGlYCvNnSuEHBSp0QkY3EVHL98N5YCqlAwhtEAMaDDkwMTQ0NDI4MDk1MyIM1MJ2DKYMlFJnxelLKoIDUSN4wQoCW8V4jKurROe0ekZOSkzx1DiGyoij+4jxB7Ks0xOyV2FjX4d8IYVL6m4wj6bL+VUfKU7/x+OVjpUbJqEmPDAtrF65+V+ZxBP7Ugym4y6oGER6gVFLL241FC6WqGFAqodXEVL9xwaDOms8gUU5XngnWyr3MEPViGGkt+GpCTEZ27uZo0Y8QCUBCw7Lf2b4e8YQjIYVf/TKIE/zEVwQNtrivw7X7Hi+1Ob1ukdGawwwYNlToZb5EqXtARaeuzEhaFQNUsvivm3L5lhLf80V2TL0rd/F194Tw6Y72ToTZoB8n9sD2o6jL7l643LpW6rmgj0lCGtP4tx7s5b/+iccL/I37+2CcJaBZN0Q74cl2DNib5II9Fef8yzHesPUHTeR5JNp+2Zb8UaG31HInslZNP0WfOn53SGpvhvTRkSPCRhY9VXs9eV1sSlNZfR0Prgc0+2k9Ya8XxD1N9RUHFmhRAVmR+RGJygkR1ZnMIcEuIbT1mT8+4qZl6HZSeV49jMwxp6cqgY6pgGfGNrjr7YmtVhyTnG7laAPr4DygkQ9g6u/5RcCNrOGKURlFdNErf9G5WIY3x+UxatzS3MMW+H1T4hNwl33dfoLzDMtRNfl3k9drKDUZP7wASG3utqMbIBYoGNG45zIDtUwFDqvIrB5jW9oW+/2Sc5MNInS/+xQrvEUXCYFPQroWwjei3H+ze1b+UmNUTman7u+GHiy6dNcQv5ITx3yl95MJtSXd3Bw",
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

app.post("/upload", upload, async function (req, res, next) {
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

        // const savePath = `public/images/processed/${newFileName}`;
        // await sharp(file.path)
        //   .resize(640, 320)
        //   .toFormat("jpeg")
        //   .jpeg({ quality: 90 })
        //   .toFile(savePath);

        // images.push({
        //   processed: `/images/processed/${newFileName}`,
        //   uploaded: `/images/uploaded/${file.originalname}`,
        // });
        // return `/images/processed/${newFileName}`;

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
      })
    );
    // console.log(images);
    res.render("result", { images });
  } catch (error) {
    res.json({ success: false, message: "Error processing images" });
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
