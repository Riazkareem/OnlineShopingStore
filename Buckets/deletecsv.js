const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.ONLINESTORE_CSV;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
}

exports.deletecsv = async (event, context, callback) => {
  try {
    const filename = event.pathParameters.name;
    return await s3
      .deleteObject({ Bucket: BUCKET_NAME, Key: filename })
      .promise()
      .then((res) => {
        if (res)
          callback(
            null,
            response(200, "Success ! file deleted Successfully => ")
          );
        else callback(null, response(404, { error: "Data not found" }));
      });
  } catch (e) {
    if (e) callback(null, response(e.statusCode, e));
  }
};
