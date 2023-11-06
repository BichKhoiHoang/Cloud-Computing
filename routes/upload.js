require("dotenv").config();
const express = require("express");
const router = express.Router();
const sharp = require("sharp");

const uploader = require("../helpers/uploader");
const s3Client = require("../helpers/s3Client");
const redisClient = require("../helpers/redis");

/* GET users listing. */
router.post("/", uploader, async function (req, res, next) {
  let images = [];
  const params = req.body;
  console.log(params);
  try {
    if (
      req.fileValidationError &&
      req.fileValidationError.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.send("Too many images uploaded (limit: 12)");
    }
    await Promise.all(
      req.files.map(async (file) => {
        const newFileName = `${Date.now()}-${file.originalname.split(".")[0]}.${
          params.file_type
        }`;
        console.log(file);
        let processedImage = await convertImage(
          file.buffer,
          params.width,
          params.height,
          params.original_metadata ? true : false,
          params.file_format,
          params.crop_type
        );

        const processedParams = {
          Bucket: process.env.bucketName,
          Key: `processed/${newFileName}`,
          Body: processedImage,
        };

        const s3 = await s3Client();
        await s3.upload(processedParams).promise();

        const imageUrl = `https://${process.env.bucketName}.s3.${process.env.region}.amazonaws.com/processed/${newFileName}`;

        images.push({
          processed: processedImage,
          uploaded: file.buffer,
          url: encodeURI(imageUrl),
        });

        const pin = generateUniquePin();
        console.log("Caching Images", imageUrl);
        redisClient.set(pin, imageUrl);
        console.log("Saved in redis");
      })
    );
    // console.log(images);
    res.render("result", { images: images, title: "Converted Images" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing images",
      reason: error.message,
    });
  }
});

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

async function convertImage(
  buffer,
  height = null,
  width = null,
  metadata = false,
  format = "jpeg",
  fit = "cover"
) {
  const newWidth = width === "" ? null : parseInt(width);
  const newHeight = height === "" ? null : parseInt(height);

  console.log(newWidth, newHeight);

  let processedImage = await sharp(buffer);

  if (metadata) processedImage.withMetadata();

  processedImage
    .resize({
      width: newWidth,
      height: newHeight,
      fit: fit,
    })
    .toFormat(format, { quality: 80 });

  return processedImage;
}

module.exports = router;
