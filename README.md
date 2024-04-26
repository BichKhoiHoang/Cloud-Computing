# Cloud-Computing

I have used Multer to upload images.
When click on 'Upload' button, the images is saved on uploadedImages folder (optional)

Processed images are stored in S3 storage.
Processed image urls are store in redis as value with key: generated unqique pin

Image URL:
https://${bucketName}.s3.ap-southeast-2.amazonaws.com/processed/${processedImageName}

<img width="976" alt="Screenshot 2024-04-26 at 8 27 57 PM" src="https://github.com/BichKhoiHoang/Cloud-Computing/assets/96985585/4fd0c473-6a0e-4dbb-8c72-394b7cbc65d5">


Cloud Architect:

<img width="709" alt="Screenshot 2024-04-26 at 8 28 50 PM" src="https://github.com/BichKhoiHoang/Cloud-Computing/assets/96985585/3a4a4ce7-f2b8-42d4-b412-6db4dafae141">


Data flow:
<img width="761" alt="Screenshot 2024-04-26 at 8 31 38 PM" src="https://github.com/BichKhoiHoang/Cloud-Computing/assets/96985585/99b620d1-a7dc-48a4-a09f-350b4d433e55">
