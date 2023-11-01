const express = require("express");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.static("views"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploadedImages");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  // fileFilter: function (req, file, cb) {
  //   checkFileType(file, cb);
  // },
});

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.array("images", 5), async function (req, res, next) {
  try {
    if (
      req.fileValidationError &&
      req.fileValidationError.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.send("Too many images uploaded (limit: 12)");
    }
    const processedImages = await Promise.all(
      req.files.map(async (file) => {
        const newFileName = `${Date.now()}-${file.originalname}`;

        await sharp(file.path)
          .resize(640, 320)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`processedImages/${newFileName}`);

        return newFileName;
      })
    );

    res.render("result", { processedImages });
  } catch (error) {
    res.json({ success: false, message: "Error processing images" });
  }
});

app.listen(port, () => {
  console.log("listening on port: " + port);
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
