const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");

const dynamodb = new AWS.DynamoDB.DocumentClient();
//const userTable = 'jinmeister-users';
const userTable = process.env.USERS_TABLE;

async function register(userInfo) {
  const email = userInfo.email;
  const username = userInfo.username;
  const password = userInfo.password;
  if (!username || !email || !password) {
    return util.buildResponse(401, {
      message: "All fields are required",
    });
  }

  const dynamoUser = await getUser(email);
  if (dynamoUser && dynamoUser.email) {
    return util.buildResponse(401, {
      message:
        "user Email already exists in our database. please choose a different user Email",
    });
  }

  const encryptedPW = bcrypt.hashSync(password.trim(), 10);
  const user = {
    email: email,
    id: uuid.v1(),
    createdAt: new Date().toISOString(),
    username: username.toLowerCase().trim(),
    password: encryptedPW,
  };

  const saveUserResponse = await saveUser(user);
  if (!saveUserResponse) {
    return util.buildResponse(503, {
      message: "Server Error. Please try again later.",
    });
  }

  return util.buildResponse(200, { user });
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

async function saveUser(user) {
  const params = {
    TableName: userTable,
    Item: user,
  };

  return await dynamodb
    .put(params)
    .promise()
    .then(
      () => {
        return true;
      },
      (error) => {
        console.error("There is an error saving user: ", error);
      }
    );
}

module.exports.register = register;
