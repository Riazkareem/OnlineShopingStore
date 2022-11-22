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

exports.listcsv = async (event, context,callback) => {
    var params = { 
        Bucket: BUCKET_NAME
    }
    try {
       await s3.listObjectsV2(params)   
       .promise()
      .then((res) => {
        const data = res.Contents.map((item) => item.Key)
        if (res) callback(null, response(200, data));
        else callback(null, response(404, { error: "Data not found" }));
      })
    } catch (e) {
      if (e) callback(null, response(e.statusCode, e));
    }

};