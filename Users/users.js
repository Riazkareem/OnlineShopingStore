"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");
const bcrypt = require("bcryptjs");

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
module.exports.updateUser = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  return modifyProduct(
    requestBody.email,
    requestBody.username,
    requestBody.password
  );
};
async function modifyProduct(email, username, password) {
  if (!username || !email || !password) {
    return buildResponse(401, {
      message: "All fields are required",
    });
  }
  const encryptedPW = bcrypt.hashSync(password.trim(), 10);
  const params = {
    TableName: userTable,
    Key: {
      email: email,
    },
    UpdateExpression: `set username = :u, password = :p`,
    ConditionExpression: "attribute_exists (email)",
    ExpressionAttributeValues: {
      ":u": username,
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

// // Delete a user
// module.exports.deleteUser = (event, context, callback) => {
//   const email = event.pathParameters.email;
//   const params = {
//     Key: {
//       email: email,
//     },
//     TableName: userTable,
//   };
//   return db
//     .delete(params)
//     .promise()
//     .then(() =>
//       callback(null, response(200, { message: "User deleted successfully" }))
//     )
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

// Delete a user
module.exports.deleteUser = (event, context, callback) => {
  const email = event.pathParameters.email;
  const dynamoUser = getUser(email);
  if (dynamoUser && dynamoUser.email) {
    return response(401, {
      message: "User Not Found",
    });
  }
  async function getUser(email) {
    const params = {
      TableName: userTable,
      Key: {
        email: email,
      },
    };
    return db
      .get(params)
      .promise()
      .then((res) => {
        if (res.Item)
          callback(
            null,
            response(
              200,
              db
                .delete(params)
                .promise()
                .then(
                  callback(
                    null,
                    response(200, { message: "User Deleted successfully" })
                  )
                )
            )
          );
        else callback(null, response(404, { error: "User not found" }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  }
};
