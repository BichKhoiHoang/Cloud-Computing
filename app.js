const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const multer = require("multer");
const sharp = require("sharp");

const app = express();

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/uploaded");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  // fileFilter: function (req, file, cb) {
  //   checkFileType(file, cb);
  // },
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

app.post("/upload", upload.array("images", 5), async function (req, res, next) {
  let images = [];
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

        const savePath = `public/images/processed/${newFileName}`;

        await sharp(file.path)
          .resize(640, 320)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(savePath);

        images.push({
          processed: `/images/processed/${newFileName}`,
          uploaded: `/images/uploaded/${file.originalname}`,
        });

        return `/images/processed/${newFileName}`;
      })
    );
    console.log(images);
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
