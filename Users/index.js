const registerService = require("./service/register");
const loginService = require("./service/login");
const verifyService = require("./service/verify");
const account_RecoveryService = require("./service/account_Recovery");
const resetPasswordService = require("./service/resetPassword");
const util = require("./utils/util");

const homePath = "/home";
const registerPath = "/register";
const loginPath = "/login";
const verifyPath = "/verify";
const account_RecoveryPath = "/account-recovery";
const resetPasswordPath = "/resetpassword";

exports.handler = async (event) => {
  console.log("Request Event: ", event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === homePath:
      response = util.buildResponse(200);
      break;
    case event.httpMethod === "POST" && event.path === registerPath:
      const registerBody = JSON.parse(event.body);
      response = await registerService.register(registerBody);
      break;
    case event.httpMethod === "POST" && event.path === loginPath:
      const loginBody = JSON.parse(event.body);
      response = await loginService.login(loginBody);
      break;
    case event.httpMethod === "POST" && event.path === verifyPath:
      const verifyBody = JSON.parse(event.body);
      response = verifyService.verify(verifyBody);
      break;
    case event.httpMethod === "POST" && event.path === account_RecoveryPath:
      const account_RecoveryBody = JSON.parse(event.body);
      response = await account_RecoveryService.account_Recovery(
        account_RecoveryBody
      );
      break;
    case event.httpMethod === "PUT" && event.path === resetPasswordPath:
      const resetPasswordBody = JSON.parse(event.body);
      response = await resetPasswordService.resetPassword(resetPasswordBody);
      break;
    default:
      response = util.buildResponse(404, "404 Not Found");
  }
  return response;
};
