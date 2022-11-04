"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");

const tagTable = process.env.TAGS_TABLE;
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
// addTags
// addTags
async function register(Info) {
  const tag_name = Info.tag_name;
  if (!tag_name) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const data = {
    id: uuid.v1(),
    tag_name: tag_name,
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
    TableName: tagTable,
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
module.exports.addTags = (event, context, callback) => {
  const registerBody = JSON.parse(event.body);
  return register(registerBody);
};
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

//     const  body=JSON.parse(event.body);
//     return db
//       .put({
//         TableName: tagTable,
//         Item:body
//       })
//       .promise()
//       .then(() => {
//         callback(null, response(201, body));
//       })
//       .catch((err) => response(null, response(err.statusCode, err)));
// };

// Get all Tags
module.exports.allTags = (event, context, callback) => {
  return db
    .scan({
      TableName: tagTable,
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
    Limit: numberOfTags,
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
      id: id,
    },
    TableName: tagTable,
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: "Tag not found" }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Delete a Tag
module.exports.deleteTag = (event, context, callback) => {
  const id = event.pathParameters.id;
  const dynamoUser = getUser(id);
  if (dynamoUser && dynamoUser.id) {
    return response(401, {
      message: "Data Found",
    });
  }
  async function getUser(id) {
    const params = {
      TableName: tagTable,
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
                    response(200, { message: "Tag Deleted successfully" })
                  )
                )
            )
          );
        else callback(null, response(404, { error: "Data not found" }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  }
};

// module.exports.deleteTag = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id
//     },
//     TableName: tagTable
//   };
//   return db
//     .delete(params)
//     .promise()
//     .then(() =>
//       callback(null, response(200, { message: 'Tag deleted successfully' }))
//     )
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

// update
module.exports.updateTags = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  return modify(requestBody.id, requestBody.tag_name);
};
async function modify(id, tag_name) {
  if (!id || !tag_name) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const params = {
    TableName: tagTable,
    Key: {
      id: id,
    },
    UpdateExpression: `set tag_name = :t`,
    ExpressionAttributeValues: {
      ":t": tag_name,
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

// old method
// module.exports.updateTags = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id
//     },
//     TableName: tagTable,
//     ConditionExpression: 'attribute_exists(id)',
//     UpdateExpression: 'SET body = :body',
//     ExpressionAttributeValues: {
//       ':body': event.body
//     },
//     ReturnValues: 'ALL_NEW'
//   };
//   console.log('Updating');

//   return db
//     .update(params)
//     .promise()
//     .then((res) => {
//       console.log(res);
//       callback(null, response(200, { message: 'Tag Updated successfully' }));
//       // callback(null, response(200, res.Attributes));
//     })
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };
