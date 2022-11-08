const jwt = require("jsonwebtoken");

function generateToken(userInfo) {
  if (!userInfo) {
    return null;
  }
  let a = jwt.sign(userInfo, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
  console.log(a);
}

function generateResetToken(resetInfo) {
  if (!resetInfo) {
    return null;
  }
  return jwt.sign(resetInfo, process.env.JWT_SECRET, {
    expiresIn: "3m",
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

function verifyResetToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, (error, response) => {
    if (error) {
      return {
        verified: false,
        message: "invalid token",
      };
    }
    return {
      email: response.email,
      exp: response.exp,
      verified: true,
      message: "verifed",
    };
  });
}
module.exports.generateToken = generateToken;
module.exports.generateResetToken = generateResetToken;
module.exports.verifyToken = verifyToken;
module.exports.verifyResetToken = verifyResetToken;
