const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const auth = require("../utils/auth");
const bcrypt = require("bcryptjs");

const db = new AWS.DynamoDB.DocumentClient();
const userTable = process.env.USERS_TABLE;

async function resetPassword(userInfo) {
  const token = userInfo.token;
  const password = userInfo.password;
  if (!password || !token) {
    return util.buildResponse(401, {
      message: "All fields are required",
    });
  }

  // const verification = auth.verifyToken(email, token);
  // if (!verification.verified) {
  //   return util.buildResponse(401, verification);
  // }

  const verification = auth.verifyResetToken(token);
  if (!verification.verified) {
    return util.buildResponse(401, verification);
  }
  if ((verification.verified = true)) {
    var email = verification.email;
    // return util.buildResponse(200, verification);
  }

  const saveUserResponse = await updateUser(email, password);
  if (!saveUserResponse) {
    return util.buildResponse(503, {
      message: "Server Error. Please try again later.",
    });
  }

  return util.buildResponse(200, "Password Updated Successfully");
}
async function updateUser(email, password) {
  const encryptedPW = bcrypt.hashSync(password.trim(), 10);
  const params = {
    TableName: userTable,
    Key: {
      email: email,
    },
    UpdateExpression: `set password = :p`,
    ConditionExpression: "attribute_exists (id)",
    ExpressionAttributeValues: {
      ":p": encryptedPW,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return await db
    .update(params)
    .promise()
    .then(
      (response) => {
        const body = {
          Operation: "UPDATE",
          Message: "SUCCESS",
          UpdatedAttributes: response,
        };
        return util.buildResponse(200, body);
      },
      (error) => {
        console.error("Query Failed: ", error);
      }
    );
}

module.exports.resetPassword = resetPassword;
