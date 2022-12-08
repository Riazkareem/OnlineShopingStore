"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");

const categoriesTable = process.env.CATEGORIES_TABLE;
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
// addProducts
async function register(Info) {
  const category_name = Info.category_name;
  if (!category_name) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const data = {
    id: uuid.v1(),
    category_name: category_name,
    createdAt: new Date().toISOString(),
  };
  const saveResponse = await save(data);
  if (!saveResponse) {
    return response(503, {
      message: "Server Error. Please try again later.",
    });
  }
  return response(200, { data });
}
async function save(data) {
  const params = {
    TableName: categoriesTable,
    Item: data,
  };
  return await db
    .put(params)
    .promise()
    .then(
      () => {
        return true;
      },
      (error) => {
        console.error("There is an error saving data: ", error);
      }
    );
}
module.exports.addCategories = (event, context, callback) => {
  const registerBody = JSON.parse(event.body);
  return register(registerBody);
};

// old method
//module.exports.addCategories = (event, context, callback) => {
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

// 2nd method
//     const  body=JSON.parse(event.body);
//     return db
//       .put({
//         TableName: categoriesTable,
//         Item:body
//       })
//       .promise()
//       .then(() => {
//         callback(null, response(201, body));
//       })
//       .catch((err) => response(null, response(err.statusCode, err)));

// };

// Get all Products
module.exports.allCategories = (event, context, callback) => {
  return db
    .scan({
      TableName: categoriesTable,
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
    Limit: numberOfCategories,
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
      id: id,
    },
    TableName: categoriesTable,
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: "Category not found" }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Delete a product
// module.exports.deleteCategories = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id,
//     },
//     TableName: categoriesTable,
//   };
//   return db
//     .delete(params)
//     .promise()
//     .then(() =>
//       callback(
//         null,
//         response(200, { message: "Category deleted successfully" })
//       )
//     )
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

module.exports.deleteCategories = (event, context, callback) => {
  const id = event.pathParameters.id;
  const dynamoUser = getUser(id);
  if (dynamoUser && dynamoUser.id) {
    return response(401, {
      message: "Data Found",
    });
  }
  async function getUser(id) {
    const params = {
      TableName: categoriesTable,
      Key: {
        id: id,
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
                    response(200, { message: "Category Deleted successfully" })
                  )
                )
            )
          );
        else callback(null, response(404, { error: "Data not found" }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  }
};

// update
module.exports.updateCategories = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  return modify(requestBody.id, requestBody.category_name);
};
async function modify(id, category_name) {
  if (!id || !category_name) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const params = {
    TableName: categoriesTable,
    Key: {
      id: id,
    },
    UpdateExpression: `set category_name = :c`,
    ConditionExpression: "attribute_exists (id)",
    ExpressionAttributeValues: {
      ":c": category_name,
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

// module.exports.updateCategories = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id,
//     },
//     TableName: categoriesTable,
//     ConditionExpression: "attribute_exists(id)",
//     UpdateExpression: "SET body = :body",
//     ExpressionAttributeValues: {
//       ":body": event.body,
//     },
//     ReturnValues: "ALL_NEW",
//   };
//   console.log("Updating");

//   return db
//     .update(params)
//     .promise()
//     .then((res) => {
//       console.log(res);
//       callback(
//         null,
//         response(200, { message: "Category Updated successfully" })
//       );
//       // callback(null, response(200, res.Attributes));
//     })
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };
