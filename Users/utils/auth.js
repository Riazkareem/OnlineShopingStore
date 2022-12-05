const jwt = require("jsonwebtoken");

function generateToken(userInfo) {
  if (!userInfo) {
    return null;
  }
  return jwt.sign(userInfo, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
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

// verify logout token
function verifyLogoutToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, (error, response) => {
    if (error) {
      return {
        verified: false,
        message: "invalid token logout",
      };
    }
    return {
      email: response.email,
      exp: response.exp,
      iat: response.iat,
      verified: true,
      message: "verifed logout",
    };
  });
}

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

module.exports.generateToken = generateToken;
module.exports.generateResetToken = generateResetToken;
module.exports.verifyToken = verifyToken;
module.exports.verifyResetToken = verifyResetToken;
module.exports.verifyLogoutToken = verifyLogoutToken;
module.exports.verifyAuthToken = verifyAuthToken; // auth token
