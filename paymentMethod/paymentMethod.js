const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});

const uuid = require("uuid");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const orderTable = process.env.ORDER_TABLE;
const stripe = require("stripe")(
  "sk_test_51Le0nZDZHtzBUSmo63aykSy6jbgVpPhkcHNxmJk0eoKUb2bTKdwkuFN8dVoteD0Im4BXujWBAsDwpSruMty75uO6000Cf6yMRI"
);
function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
async function paymentMethod(paymentMethod) {
  const {
    name,
    email,
    number,
    exp_month,
    exp_year,
    cvc,
    amount,
    currency,
    description,
    productid,
    quantity,
    total_price,
    address,
    payment_status,
    order_status,
  } = paymentMethod;

  try {
    if (
      !name ||
      !email ||
      !number ||
      !exp_month ||
      !exp_year ||
      !cvc ||
      !amount ||
      !currency ||
      !description ||
      !productid ||
      !quantity ||
      !address ||
      !payment_status ||
      !order_status
    ) {
      return buildResponse(401, {
        message: "All fields are required",
      });
    }
    // customer
    const customerCreated = await stripe.customers.create({
      name,
      email,
    });
    //return buildResponse(200, customerCreated);
    // token
    if (customerCreated) {
      const token = await stripe.tokens.create({
        card: {
          number,
          exp_month,
          exp_year,
          cvc,
        },
      });
      if (token) {
        // return buildResponse(200, token.id +' '+ customerCreated.id);
        const card = await stripe.customers.createSource(customerCreated.id, {
          source: token.id,
        });
        if (card) {
          //return buildResponse(200, card.id);
          const charge = await stripe.charges.create({
            amount,
            currency,
            description,
            customer: customerCreated.id,
          });
          if (charge) {
            // return buildResponse(200, {message:"Payment Transferrerd Successfully"});
            // put data to dynamodb into order table

            const data = {
              id: uuid.v1(),
              userid: customerCreated.id,
              productid: productid,
              quantity: quantity,
              total_price: charge.amount,
              address: address,
              payment_status: payment_status,
              order_status: order_status,
              createdAt: new Date().toISOString(),
            };
            const saveResponse = await save(data);
            if (!saveResponse) {
              return buildResponse(503, {
                message: "Query Failed Order not Saved to Database",
              });
            }
            if (saveResponse) {
              return buildResponse(200, {
                message: "Order Successfull",
              });
            }

            // order table
          } else {
            return buildResponse(401, { message: "charge failed" });
          }
        } else {
          return buildResponse(401, { message: "card failed" });
        }
      } else {
        return buildResponse(401, { message: "token failed" });
      }
    } else {
      return buildResponse(401, { message: "customer failed" });
    }
    // const token=stripe.tokens.create({number,exp_month,exp_year,cvc});
    //   // attach card to customer
    //   stripe.customers.createSource(customerCreated.id,{ source: token.id });
    //
  } catch (e) {
    return buildResponse(503, {
      message: "Server Error. Please try again later." + e,
    });
  }
}

// saving order info into order table
async function save(data) {
  const params = {
    TableName: orderTable,
    Item: data,
  };
  return await dynamodb
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

module.exports.paymentMethod = paymentMethod;
