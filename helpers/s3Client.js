require("dotenv").config();
const AWS = require("aws-sdk");

async function s3Client() {
  const s3 = new AWS.S3({
    // AWS credentials and region configuration
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    sessionToken: process.env.sessionToken,
    region: process.env.region,
    logger: console,
  });

  try {
    await s3.createBucket({ Bucket: process.env.bucketName }).promise();
    console.log(`Created bucket: ${process.env.bucketName}`);
  } catch (err) {
    // We will ignore 409 errors which indicate that the bucket already exists;
    if (err.statusCode !== 409) {
      console.log(`Error creating: ${err}`);
    }
  }

  return s3;
}

module.exports = s3Client;
