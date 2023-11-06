require("dotenv").config();
const express = require("express");
const router = express.Router();
const sharp = require("sharp");

const uploader = require("../helpers/uploader");
const s3Client = require("../helpers/s3Client");
const redisClient = require("../helpers/redis");

/*

POST /upload

Upload images, process them and save to s3 and redis

*/
router.post("/", uploader, async function (req, res, next) {
  let images = [];
  const params = req.body;

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

        const pin = generateUniquePin();

        redisClient.set(pin, imageUrl);

        images.push({
          processed: processedImage,
          uploaded: file.buffer,
          url: encodeURI(imageUrl),
          image_data: {
            width: params.width,
            height: params.height,
          },
          pin: pin,
        });
      })
    );
    res.render("processed", { images: images, title: "Converted Images" });
  } catch (error) {
    next(createError(500));
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
