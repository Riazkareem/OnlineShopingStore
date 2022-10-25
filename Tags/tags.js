'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');


const tagTable = process.env.TAGS_TABLE;
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
// addTags
module.exports.addTags = (event, context, callback) => {
    // const post = {
    //   id: uuid.v1 (),
    //   createdAt: new Date().toISOString(),
    //   body: event.body
    // };
    
    // return db
    //   .put({
    //     TableName: tagTable,
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
          TableName: tagTable,
          Item:body
        })
        .promise()
        .then(() => {
          callback(null, response(201, body));
        })
        .catch((err) => response(null, response(err.statusCode, err))); 
  };

// Get all Tags
module.exports.allTags = (event, context, callback) => {
  return db
    .scan({
      TableName: tagTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
  // Get number of Tags
  module.exports.getTags = (event, context, callback) => {
    const numberOfTags = event.pathParameters.number;
    const params = {
      TableName: tagTable,
      Limit: numberOfTags
    };
    return db
      .scan(params)
      .promise()
      .then((res) => {
        callback(null, response(200, res.Items.sort(sortByDate)));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Get a single product
  module.exports.getTag = (event, context, callback) => {
    const id = event.pathParameters.id;
  
    const params = {
      Key: {
        id: id
      },
      TableName: tagTable
    };
  
    return db
      .get(params)
      .promise()
      .then((res) => {
        if (res.Item) callback(null, response(200, res.Item));
        else callback(null, response(404, { error: 'Tag not found' }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };


  // Delete a Tag
  module.exports.deleteTag = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: tagTable
    };
    return db
      .delete(params)
      .promise()
      .then(() =>
        callback(null, response(200, { message: 'Tag deleted successfully' }))
      )
      .catch((err) => callback(null, response(err.statusCode, err)));
  };

  // update 

  module.exports.updateTags = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: tagTable,
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
        callback(null, response(200, { message: 'Tag Updated successfully' }));
        // callback(null, response(200, res.Attributes));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };