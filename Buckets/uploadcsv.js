const AWS = require("aws-sdk");
const s3 = new AWS.S3();

// bucket name env var will be set in serverless.yml file
const BUCKET_NAME = process.env.ONLINESTORE_CSV;

module.exports.uploadcsv = async (event) => {
  console.log(event);
  const response = {
    isBase64Encoded: false,
    statusCode: 200,
  };

  try {
    const parsedBody = JSON.parse(event.body);
    const base64File = parsedBody.file;
    const decodedFile = Buffer.from(
      base64File.replace(/^data:CSVFiles\/\w+;base64,/, ""),
      "base64"
    );
    const params = {
      Bucket: BUCKET_NAME,
      Key: parsedBody.fileKey,
      Body: decodedFile,
      ContentType: "text/csv",
    };
    const uploadResult = await s3.upload(params).promise();

    response.body = JSON.stringify({
      message: "Successfully uploaded file to S3",
      uploadResult,
    });
  } catch (e) {
    console.error("Failed to upload file: ", e);
    response.body = JSON.stringify({
      message: "File failed to upload.",
      errorMessage: e,
    });
    response.statusCode = 500;
  }

  return response;
};
