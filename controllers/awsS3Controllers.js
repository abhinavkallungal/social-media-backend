var S3 = require('aws-sdk/clients/s3');
require('dotenv').config()
const fs =require('fs')

   const bucketName =process.env.REACT_APP_S3_BUCKET_NAME
   const dirName = process.env.REACT_APP_S3_DIR_NAME
   const region= process.env.REACT_APP_REGION
   const accessKeyId= process.env.REACT_APP_S3_ACCESS_KEY_ID
   const secretAccessKey=process.env.REACT_APP_S3_SECRET_ACCESS_KEY

   const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
  })

   function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
  
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }
  
    return s3.upload(uploadParams).promise()
  }
  exports.uploadFile = uploadFile
  
  