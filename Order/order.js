"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const uuid = require("uuid");

const orderTable = process.env.ORDER_TABLE;
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
// addOrder
async function register(Info) {
  const userid = Info.userid;
  const productid = Info.productid;
  const image = Info.image;
  const quantity = Info.quantity;
  const total_price = Info.total_price;
  const address = Info.address;
  const payment_status = Info.payment_status;
  const order_status = Info.order_status;
  if (
    !userid ||
    !productid ||
    !image ||
    !quantity ||
    !total_price ||
    !address ||
    !payment_status ||
    !order_status
  ) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const data = {
    id: uuid.v1(),
    userid: userid,
    productid: productid,
    image: image,
    quantity: quantity,
    total_price: total_price,
    address: address,
    payment_status: payment_status,
    order_status: order_status,
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
    TableName: orderTable,
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
module.exports.addOrder = (event, context, callback) => {
  const registerBody = JSON.parse(event.body);
  return register(registerBody);
};

// module.exports.addOrder = (event, context, callback) => {
// const post = {
//   id: uuid.v1 (),
//   createdAt: new Date().toISOString(),
//   body: event.body
// };

// return db
//   .put({
//     TableName: orderTable,
//     Item: post
//   })
//   .promise()
//   .then(() => {
//     callback(null, response(201, post));
//   })
//   .catch((err) => response(null, response(err.statusCode, err)));

//   const  body=JSON.parse(event.body);
//   return db
//     .put({
//       TableName: orderTable,
//       Item:body
//     })
//     .promise()
//     .then(() => {
//       callback(null, response(201, body));
//     })
//     .catch((err) => response(null, response(err.statusCode, err)));

// };

// Get all Order
module.exports.allOrders = (event, context, callback) => {
  return db
    .scan({
      TableName: orderTable,
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get number of Order
module.exports.getOrders = (event, context, callback) => {
  const numberOfOrder = event.pathParameters.number;
  const params = {
    TableName: orderTable,
    Limit: numberOfOrder,
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
module.exports.getSingleOrder = (event, context, callback) => {
  const id = event.pathParameters.id;

  const params = {
    Key: {
      id: id,
    },
    TableName: orderTable,
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: "Order not found" }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Delete a Order
// Delete a Order
// module.exports.deleteOrder = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id
//     },
//     TableName: orderTable
//   };
//   return db
//     .delete(params)
//     .promise()
//     .then(() =>
//       callback(null, response(200, { message: 'Order deleted successfully' }))
//     )
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

module.exports.deleteOrder = (event, context, callback) => {
  const id = event.pathParameters.id;
  const dynamoUser = getUser(id);
  if (dynamoUser && dynamoUser.id) {
    return response(401, {
      message: "Data Found",
    });
  }
  async function getUser(id) {
    const params = {
      TableName: orderTable,
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
                    response(200, { message: "Order Deleted successfully" })
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

// module.exports.updateOrder = (event, context, callback) => {
//   const id = event.pathParameters.id;
//   const params = {
//     Key: {
//       id: id
//     },
//     TableName: orderTable,
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
//       callback(null, response(200, { message: 'Order Updated successfully' }));
//       // callback(null, response(200, res.Attributes));
//     })
//     .catch((err) => callback(null, response(err.statusCode, err)));
// };

// new method

module.exports.updateOrder = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  return modify(
    requestBody.id,
    requestBody.userid,
    requestBody.productid,
    requestBody.image,
    requestBody.quantity,
    requestBody.total_price,
    requestBody.address,
    requestBody.payment_status,
    requestBody.order_status
  );
};
async function modify(
  id,
  userid,
  productid,
  image,
  quantity,
  total_price,
  address,
  payment_status,
  order_status
) {
  if (
    !id ||
    !userid ||
    !productid ||
    !image ||
    !quantity ||
    !total_price ||
    !address ||
    !payment_status ||
    !order_status
  ) {
    return response(401, {
      message: "All fields are required",
    });
  }
  const params = {
    TableName: orderTable,
    Key: {
      id: id,
    },
    UpdateExpression: `set userid = :ui, productid = :pi, image=:i,quantity=:q,total_price=:tp,address=:a,payment_status=:ps,order_status=:os`,
    ExpressionAttributeValues: {
      ":ui": userid,
      ":pi": productid,
      ":i": image,
      ":q": quantity,
      ":tp": total_price,
      ":a": address,
      ":ps": payment_status,
      ":os": order_status,
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
