
var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion')]/gep63_providedWebServices(.)/sm63_wsdlServices(.)/document(.)&p1=bsrURI
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
  res.setHeader("date", "Mon, 01 Aug 2016 08:36:46 GMT");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.end();

  return __filename;
};
