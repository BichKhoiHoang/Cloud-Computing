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
        const newFileName = `${Date.now()}-${file.originalname}`;
        console.log(file);
        let processedImage;

        if (params.original_metadata) {
          processedImage = await sharp(file.buffer)
            .withMetadata()
            .resize({
              width: params.width,
              height: params.height,
              fit: params.crop_type,
            })
            .toFormat(params.file_type)
            .toBuffer();
        } else {
          processedImage = await sharp(file.buffer)
            .resize({
              width: params.width,
              height: params.height,
              fit: params.crop_type,
            })
            .toFormat(params.file_type)
            .toBuffer();
        }

        const processedParams = {
          Bucket: process.env.bucketName,
          Key: `processed/${newFileName}`,
          Body: processedImage,
        };

        const s3 = await s3Client();
        await s3.upload(processedParams).promise();

        images.push({
          processed: processedImage,
          uploaded: file.buffer,
        });

        const imageUrl = `https://${process.env.bucketName}.s3.${process.env.region}.amazonaws.com/processed/${newFileName}`;

        const pin = generateUniquePin();
        console.log("Caching Images");
        redisClient.set(pin, imageUrl);
        console.log("Saved in redis");
      })
    );
    // console.log(images);
    res.render("result", { images });
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

module.exports = router;
