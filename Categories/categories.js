'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');


const categoriesTable = process.env.CATEGORIES_TABLE;
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
// addProducts
module.exports.addCategories = (event, context, callback) => {
    // const post = {
    //   id: uuid.v1 (),
    //   createdAt: new Date().toISOString(),
    //   body: event.body
    // };
    
    // return db
    //   .put({
    //     TableName: categoriesTable,
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
          TableName: categoriesTable,
          Item:body
        })
        .promise()
        .then(() => {
          callback(null, response(201, body));
        })
        .catch((err) => response(null, response(err.statusCode, err)));

  };

// Get all Products
module.exports.allCategories = (event, context, callback) => {
  return db
    .scan({
      TableName: categoriesTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
  // Get number of products
  module.exports.getCategories = (event, context, callback) => {
    const numberOfCategories = event.pathParameters.number;
    const params = {
      TableName: categoriesTable,
      Limit: numberOfCategories
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
  module.exports.getCategory = (event, context, callback) => {
    const id = event.pathParameters.id;
  
    const params = {
      Key: {
        id: id
      },
      TableName: categoriesTable
    };
  
    return db
      .get(params)
      .promise()
      .then((res) => {
        if (res.Item) callback(null, response(200, res.Item));
        else callback(null, response(404, { error: 'Category not found' }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };


  // Delete a product
  module.exports.deleteCategories = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: categoriesTable
    };
    return db
      .delete(params)
      .promise()
      .then(() =>
        callback(null, response(200, { message: 'Category deleted successfully' }))
      )
      .catch((err) => callback(null, response(err.statusCode, err)));
  };

  // update 

  module.exports.updateCategories = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: categoriesTable,
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
        callback(null, response(200, { message: 'Category Updated successfully' }));
        // callback(null, response(200, res.Attributes));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };