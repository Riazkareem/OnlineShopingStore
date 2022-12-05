"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");
const auth = require("../Users/utils/auth");

const productsTable = process.env.PRODUCTS_TABLE;
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
// addProducts

async function register(Info) {
  const authtoken = Info.token;
  const productname = Info.productname;
  const price = Info.price;
  const description = Info.description;
  const quantity = Info.quantity;
  const images = Info.images;
  const featured_image = Info.featured_image;
  const category = Info.category;
  const tags = Info.tags;

  if (
    !productname ||
    !price ||
    !description ||
    !quantity ||
    !images ||
    !featured_image ||
    !category ||
    !tags ||
    !authtoken
  ) {
    return response(401, {
      message: "All fields are required",
    });
  }

  // authentication
  const verification = auth.verifyAuthToken(authtoken);
  if (!verification.verified) {
    return response(401, verification);
  }
  if ((verification.verified = true)) {
    var authemail = verification.email;
    // fetch user from table having roles
    const dynamoUser = await getUser(authemail);
    const roleemail = dynamoUser.email;
    const role = dynamoUser.myrole;
    if (dynamoUser && roleemail && role == "undefined") {
      return response(401, {
        message: roleemail + " is not valid user having role of " + role,
      });
    }

    // if(authemail==='riaz@gmail.com'){
    if (authemail === roleemail) {
      // valid role
      const data = {
        id: uuid.v1(),
        name: productname,
        price: price,
        description: description,
        quantity: quantity,
        images: images,
        featured_image: featured_image,
        category: category,
        tags: tags,
        createdAt: new Date().toISOString(),
      };
      const saveResponse = await save(data);
      if (!saveResponse) {
        return response(503, {
          message: "Server Error. Please try again later.",
        });
      }

      return response(200, { data });
      // valid role
    } else {
      // invlaid role
      return response(401, {
        message: "You have dont permission to this api",
      });
    }
    //
  } else {
    // invalid role
    return response(401, {
      message: "Query failed",
    });
  }
}

async function save(data) {
  const params = {
    TableName: productsTable,
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
module.exports.addProducts = (event, context, callback) => {
  const registerBody = JSON.parse(event.body);
  return register(registerBody);
};

// addProducts
// module.exports.addProducts = (event, context, callback) => {
//   const  body=JSON.parse(event.body);
//   return db
//     .put({
//       TableName: productsTable,
//       Item:body
//     })
//     .promise()
//     .then(() => {
//       callback(null, response(201, body));
//     })
//     .catch((err) => response(null, response(err.statusCode, err)));
// };

// Get all Products
module.exports.getAllProducts = (event, context, callback) => {
  return db
    .scan({
      TableName: productsTable,
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
    Limit: numberOfProducts,
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
      id: id,
    },
    TableName: productsTable,
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: "Product not found" }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Update a Product
// module.exports.updateProduct = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id,
//     },
//     TableName: productsTable,
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
//         response(200, { message: "Product Updated successfully" })
//       );
//       // callback(null, response(200, res.Attributes));
//     })
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

module.exports.updateProduct = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  return modify(
    requestBody.id,
    requestBody.productname,
    requestBody.price,
    requestBody.description,
    requestBody.quantity,
    requestBody.images,
    requestBody.featured_image,
    requestBody.category,
    requestBody.tags
  );
};
async function modify(
  id,
  productname,
  price,
  description,
  quantity,
  images,
  featured_image,
  category,
  tags
) {
  if (
    !id ||
    !productname ||
    !price ||
    !description ||
    !quantity ||
    !images ||
    !featured_image ||
    !category ||
    !tags
  ) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const params = {
    TableName: productsTable,
    Key: {
      id: id,
    },
    UpdateExpression: `set productname = :n, price = :p, description=:d,quantity=:q,images=:i,featured_image=:f,category=:c,tags=:t`,
    ExpressionAttributeValues: {
      ":n": productname,
      ":p": price,
      ":d": description,
      ":q": quantity,
      ":i": images,
      ":f": featured_image,
      ":c": category,
      ":t": tags,
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

// Delete a product
// module.exports.deleteProduct = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id,
//     },
//     TableName: productsTable,
//   };
//   return db
//     .delete(params)
//     .promise()
//     .then(() =>
//       callback(null, response(200, { message: "Product deleted successfully" }))
//     )
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

module.exports.deleteProduct = (event, context, callback) => {
  const id = event.pathParameters.id;
  const dynamoUser = getUser(id);
  if (dynamoUser && dynamoUser.id) {
    return response(401, {
      message: "Data Found",
    });
  }
  async function getUser(id) {
    const params = {
      TableName: productsTable,
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
                    response(200, { message: "Product Deleted successfully" })
                  )
                )
            )
          );
        else callback(null, response(404, { error: "Data not found" }));
      })
      .catch((err) => callback(null, response(err.statusCode, err)));
  }
};

// search  product
module.exports.searchProduct = (event, context, callback) => {
  try {
    const productName = event.pathParameters.name;
    var params = {
      TableName: productsTable,
      FilterExpression: "contains(#name, :name)",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": productName,
      },
    };
    db.scan(params)
      .promise()
      .then((body) => {
        if (body) callback(null, response(200, body));
        else callback(null, response(404, { error: "Product not found" }));
      });
  } catch (err) {
    callback(null, response(err.statusCode, err));
  }
};

// getting user role
async function getUser(authemail) {
  const params = {
    TableName: userTable,
    Key: {
      email: authemail,
    },
    // ProjectionExpression: "myrole"
  };

  const response = await db.get(params).promise();
  if (response) {
    const myrole = response.Item.myrole; //
    if (myrole === "admin") {
      console.log(response.Item.myrole);
      return response.Item;
    } else {
      console.log(response.Item.myrole);
      // return response.Item;
      return false;
    }
  } else {
    console.error("There is an error getting user: ");
    return false;
  }

  //
}
