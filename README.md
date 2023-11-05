# Cloud-Computing

I have used Multer to upload images.
When click on 'Upload' button, the images is saved on uploadedImages folder (optional)

Processed images are stored in S3 storage.
Processed image urls are store in redis as value with key: generated unqique pin

Image URL:
https://${bucketName}.s3.ap-southeast-2.amazonaws.com/processed/${processedImageName}
