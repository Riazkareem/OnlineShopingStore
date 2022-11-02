"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");

const userTable = process.env.USERS_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
// Get all users
module.exports.getAllUsers = (event, context, callback) => {
  return db
    .scan({
      TableName: userTable,
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get number of user
module.exports.getUsers = (event, context, callback) => {
  const numberOfPosts = event.pathParameters.number;
  const params = {
    TableName: userTable,
    Limit: numberOfPosts,
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get a single users
module.exports.getUser = (event, context, callback) => {
  const email = event.pathParameters.email;

  const params = {
    Key: {
      email: email,
    },
    TableName: userTable,
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: "User not found" }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Update a user
module.exports.updateUser = (
  event,
  updateKey,
  updateValue,
  context,
  callback
) => {
  const requestBody = JSON.parse(event.body);
  return modifyProduct(
    requestBody.email,
    requestBody.updateKey,
    requestBody.updateValue
  );
};
async function modifyProduct(email, updateKey, updateValue) {
  const params = {
    TableName: userTable,
    Key: {
      email: email,
    },
    UpdateExpression: `set ${updateKey} = :value`,
    ExpressionAttributeValues: {
      ":value": updateValue,
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
        return buildResponse(200, body);
      },
      (error) => {
        console.error("Query Failed: ", error);
      }
    );
}
//only Responce for update operation
function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

// Delete a user
module.exports.deleteUser = (event, context, callback) => {
  const email = event.pathParameters.email;
  const params = {
    Key: {
      email: email,
    },
    TableName: userTable,
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: "User deleted successfully" }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};
