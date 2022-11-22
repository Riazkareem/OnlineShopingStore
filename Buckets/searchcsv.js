
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3();
  const fs = require("fs");
  const BUCKET_NAME = process.env.ONLINESTORE_CSV;
  // Create a response
  function response(statusCode, message) {
    return {
      statusCode: statusCode,
      body: JSON.stringify(message),
    };
  }
  
  exports.searchcsv = async (event, context,callback) => {
      try {
          const filename = event.pathParameters.name;
         await s3.getObject({ Bucket: BUCKET_NAME, Key: filename })   
         .promise()
        .then((res) => {
          if (res) callback(null, response(200, "Success ! Data Found Successfully => "+ filename));
          else callback(null, response(404, { error: "Data not found" }));
        })
      } catch (e) {
        if (e) callback(null, response(e.statusCode, e));
      }
  
  };