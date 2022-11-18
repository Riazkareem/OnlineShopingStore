const paymentService = require("./paymentMethod");

const paymentPath = "/paymentMethod";
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
exports.handler = async (event) => {
  console.log("Request Event: ", event);
  let response;
  switch (true) {
    case event.httpMethod === "POST" && event.path === paymentPath:
      const paymentBody = JSON.parse(event.body);
      response = await paymentService.paymentMethod(paymentBody);
      break;
    default:
      response = buildResponse(404, "404 Not Found");
  }
  return response;
};
