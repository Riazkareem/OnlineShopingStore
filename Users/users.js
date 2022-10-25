'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const userTable = process.env.USER_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
// Create a user
module.exports.createUser = (event, context, callback) => {
  // const post = {
  //   id: uuid.v1 (),
  //   createdAt: new Date().toISOString(),
  //   body: event.body
  // };
  
  // return db
  //   .put({
  //     TableName: userTable,
  //     Item: post
  //   })
  //   .promise()
  //   .then(() => {
  //     callback(null, response(201, post));
  //   })
  //   .catch((err) => response(null, response(err.statusCode, err)));

    const  body=JSON.parse(event.body);
    return db
      .put({
        TableName: userTable,
        Item:body
      })
      .promise()
      .then(() => {
        callback(null, response(201, body));
      })
      .catch((err) => response(null, response(err.statusCode, err)));
};

// Get all users
module.exports.getAllUsers = (event, context, callback) => {
    return db
      .scan({
        TableName: userTable
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
      Limit: numberOfPosts
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
    const id = event.pathParameters.id;
  
    const params = {
      Key: {
        id: id
      },
      TableName: userTable
    };
  
    return db
      .get(params)
      .promise()
      .then((res) => {
        if (res.Item) callback(null, response(200, res.Item));
        else callback(null, response(404, { error: 'User not found' }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Update a user

  module.exports.updateUser = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: userTable,
      ConditionExpression: 'attribute_exists(id)',
      UpdateExpression: 'SET body = :body',
      ExpressionAttributeValues: {
        ':body': event.body
      },
      ReturnValues: 'ALL_NEW'
    };
    console.log('Updating');
  
    return db
      .update(params)
      .promise()
      .then((res) => {
        console.log(res);
        callback(null, response(200, { message: 'User Updated successfully' }));
        // callback(null, response(200, res.Attributes));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };

  // Delete a user
  module.exports.deleteUser = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: userTable
    };
    return db
      .delete(params)
      .promise()
      .then(() =>
        callback(null, response(200, { message: 'User deleted successfully' }))
      )
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
