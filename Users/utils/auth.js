const jwt = require("jsonwebtoken");

function generateToken(userInfo) {
  if (!userInfo) {
    return null;
  }

  return jwt.sign(userInfo, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

function verifyToken(email, token) {
  return jwt.verify(token, process.env.JWT_SECRET, (error, response) => {
    if (error) {
      return {
        verified: false,
        message: "invalid token",
      };
    }

    if (response.email !== email) {
      return {
        verified: false,
        message: "invalid user",
      };
    }

    return {
      verified: true,
      message: "verifed",
    };
  });
}

module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
