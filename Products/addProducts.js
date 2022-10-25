'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const productsTable = process.env.PRODUCTS_TABLE;
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
// module.exports.addProducts = (event, context, callback) => {
//     const post = {
//       id: uuid.v1 (),
//       createdAt: new Date().toISOString(),
//       body: event.body
//     };
    
//     return db
//       .put({
//         TableName: productsTable,
//         Item: post
//       })
//       .promise()
//       .then(() => {
//         callback(null, response(201, post));
//       })
//       .catch((err) => response(null, response(err.statusCode, err)));
//   };


// addProducts
module.exports.addProducts = (event, context, callback) => {
  const  body=JSON.parse(event.body);
  return db
    .put({
      TableName: productsTable,
      Item:body
    })
    .promise()
    .then(() => {
      callback(null, response(201, body));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};

// Get all Products
module.exports.getAllProducts = (event, context, callback) => {
  return db
    .scan({
      TableName: productsTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
  // Get number of products
  module.exports.getProducts = (event, context, callback) => {
    const numberOfProducts = event.pathParameters.number;
    const params = {
      TableName: productsTable,
      Limit: numberOfProducts
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
  module.exports.getProduct = (event, context, callback) => {
    const id = event.pathParameters.id;
  
    const params = {
      Key: {
        id: id
      },
      TableName: productsTable
    };
  
    return db
      .get(params)
      .promise()
      .then((res) => {
        if (res.Item) callback(null, response(200, res.Item));
        else callback(null, response(404, { error: 'Product not found' }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  };
  // Update a Product
  module.exports.updateProduct = (event, context, callback) => {
      const id = event.pathParameters.id;
      const params = {
        Key: {
          id: id
        },
        TableName: productsTable,
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
          callback(null, response(200, { message: 'Product Updated successfully' }));
          // callback(null, response(200, res.Attributes));
        })
        .catch((err) => callback(null, response(err.statusCode, err)));
    };
  // Delete a product
  module.exports.deleteProduct = (event, context, callback) => {
    const id = event.pathParameters.id;
    const params = {
      Key: {
        id: id
      },
      TableName: productsTable
    };
    return db
      .delete(params)
      .promise()
      .then(() =>
        callback(null, response(200, { message: 'Product deleted successfully' }))
      )
      .catch((err) => callback(null, response(err.statusCode, err)));
  };

   // search  product
   module.exports.searchProduct = (event, context, callback) => {
   // const productName = event.pathParameters.name;

    const productName = 'toys';

      var params = {
        TableName: productsTable,
        FilterExpression : "contains(#name, :name)",
        ExpressionAttributeNames: { "#name": "name" },
        ExpressionAttributeValues: {
            ':name':productName
        }
    };
  
    db.scan(params, function (err, data) {
          if (err) console.log(err);
          else console.log(data);
      });

  };
