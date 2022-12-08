const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const userTable = process.env.USERS_TABLE;

// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
}

exports.handler = async (event) => {
  console.log("Request Event: ", event);
  const authtoken =
    (event.headers && (event.headers["token"] || event.headers["token"])) ||
    event.authoizationToken;

  // verify token from auth
  const verification = verifyAuthToken(authtoken);
  if (!verification.verified) {
    return response(401, verification);
  }
  if ((verification.verified = true)) {
    var email = verification.email;
    // getting role from table
    if (!email) {
      console.log("could not find a email on the event");
      return generatePolicy({ allow: false });
    }
    try {
      const params = {
        TableName: userTable,
        Key: {
          email: email,
        },
      };
      const result = await db.get(params).promise();
      if (result) {
        const myrole = result.Item.myrole; //
        if (myrole === "admin") {
          return generatePolicy({ allow: true });
        } else {
          return generatePolicy({ allow: false });
        }
      }
    } catch (error) {
      console.log("error ", error);
      return generatePolicy({ allow: false });
    }

    //
  } else {
    return response(401, {
      message: "Query failed",
    });
  }
};

// verifying token expiry or not then responce back with email
// verify user authentication
function verifyAuthToken(authtoken) {
  return jwt.verify(authtoken, process.env.JWT_SECRET, (error, response) => {
    if (error) {
      return {
        verified: false,
        message: "invalid Auth Token",
      };
    }
    return {
      email: response.email,
      exp: response.exp,
      iat: response.iat,
      verified: true,
      message: "Auth token is verifed",
    };
  });
}

// allow or deny policy
const generatePolicy = ({ allow }) => {
  return {
    principalId: "token",
    policyDocument: {
      Version: "2012-10-17",
      Statement: {
        Action: "execute-api:Invoke",
        Effect: allow ? "Allow" : "Deny",
        Resource: "*",
      },
    },
  };
};
