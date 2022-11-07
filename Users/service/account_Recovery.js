const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const bcrypt = require("bcryptjs");
const auth = require("../utils/auth");
const SES = new AWS.SES();

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = process.env.USERS_TABLE;

async function account_Recovery(Info) {
  const email = Info.email;
  if (!email) {
    return util.buildResponse(401, {
      message: "Email field is required",
    });
  }
  const dynamoUser = await getUser(email);
  if (!dynamoUser || !dynamoUser.email) {
    return util.buildResponse(403, { message: "User Email does not exist" });
  }
  const userInfo = {
    email: dynamoUser.email,
  };
  const token = auth.generateToken(userInfo);
  const response = {
    user: userInfo,
    token: token,
  };
  // const { to, from, subject, text } = JSON.parse(event.body);
  const to = "riazahmad03486@gmail.com";
  const from = "riazahmad03486@gmail.com";
  const subject = "Test";
  const text = response.token;

  if (!to || !from || !subject || !text) {
    return util.buildResponse(403, {
      message: "to, from, subject and text are all required in the body",
    });
  }
  const params = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: { Data: text },
      },
      Subject: { Data: subject },
    },
    Source: from,
  };
  try {
    await SES.sendEmail(params).promise();
    return util.buildResponse(200, {
      message: "Account recovery email sent to " + " " + to,
    });
  } catch (error) {
    console.log("error sending email ", error);
    return util.buildResponse(400, { message: "The email failed to send" });
  }
  // return util.buildResponse(200, response);
}

async function getUser(email) {
  const params = {
    TableName: userTable,
    Key: {
      email: email,
    },
  };

  return await dynamodb
    .get(params)
    .promise()
    .then(
      (response) => {
        return response.Item;
      },
      (error) => {
        console.error("There is an error getting user: ", error);
      }
    );
}

module.exports.account_Recovery = account_Recovery;
