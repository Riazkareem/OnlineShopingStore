const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const db = new AWS.DynamoDB.DocumentClient();
const BUCKET_NAME = process.env.ONLINESTORE_CSV;
const TABLE_NAME = "students";
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
}
module.exports.csvtodynamodb = async (event, context, callback) => {
  const parsedBody = JSON.parse(event.body);
  const File_name = parsedBody.fileKey;
  if (!File_name) {
    return response(404, { message: "File Name is required" });
  }
  try {
    const restult = await s3
      .getObject({ Bucket: BUCKET_NAME, Key: File_name })
      .promise();
    //console.log(restult.Body); // buffer formate
    const buf = Buffer.from(restult.Body);
    const data = buf.toString();
    //console.log(data); // data formate
    const s = data.split("\n");
    // console.log(s);
    for (const type of s.slice(1)) {
      const stud_data = type.split(",");
      var params = {
        TableName: TABLE_NAME,
        Item: {
          id: stud_data[0],
          name: stud_data[1],
          address: stud_data[2],
        },
      };
      await db
        .put(params)
        .promise()
        .then((res) => {
          if (res)
            callback(
              null,
              response(200, {
                message:
                  File_name +
                  " Upload to " +
                  " " +
                  TABLE_NAME +
                  " Table Successfuly",
              })
            );
          else
            callback(
              null,
              response(404, { error: "Unable to Upload " + " " + File_name })
            );
        });
    }
  } catch (e) {
    if (e) response(e.statusCode, e);
    return response(404, { error: File_name + " not found " });
  }
};
