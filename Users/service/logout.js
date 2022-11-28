const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const jwt = require("jsonwebtoken");
const util = require("../utils/util");
const auth = require("../utils/auth");

async function logout(requestBody) {
  if (!requestBody.token) {
    return util.buildResponse(401, {
      verified: false,
      message: "incorrect request body token",
    });
  }

  const token = requestBody.token;
  const verification = auth.verifyLogoutToken(token);
  if (!verification.verified) {
    return util.buildResponse(401, verification);
  }
  if (verification.verified == true) {
    const userInfo = {
      email: verification.email,
    };
    let newToken = jwt.sign(userInfo, process.env.JWT_SECRET, {
      expiresIn: "1s",
    });
    console.log(newToken);

    if (newToken) {
      const verification = auth.verifyLogoutToken(newToken);
      if (!verification.verified) {
        return util.buildResponse(401, verification);
      }
      return util.buildResponse(200, {
        message: "session expired successfully",
      });
    } // newToken verification

    // return util.buildResponse(200, newToken);
  } else {
    return util.buildResponse(401, { message: "failed" });
  }
} // logout

module.exports.logout = logout;
