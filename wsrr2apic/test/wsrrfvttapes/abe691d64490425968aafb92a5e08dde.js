
var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/2919fd29-fc17-4729.bae4.0b95690be4f9
 *
 * accept: application/json
 * host: srb84a.hursley.ibm.com:9443
 * authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 401;

  res.setHeader("x-powered-by", "Servlet/3.0");
  res.setHeader("www-authenticate", "Basic realm=\"Default Realm\"");
  res.setHeader("content-language", "en-US");
  res.setHeader("content-length", "0");
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 01 Aug 2016 08:36:31 GMT");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.end();

  return __filename;
};
