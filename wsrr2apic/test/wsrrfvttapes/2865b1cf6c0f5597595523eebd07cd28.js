var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='13b85913-d839-4949.b8a0.b6e4c1b6a076' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion')]/gep63_providedWebServices(.)/sm63_wsdlServices(.)/document(.)&p1=bsrURI
 *
 * accept: application/json
 * host: srb84a.hursley.ibm.com:9443
 * authorization: Basic dXNlcjp1c2Vy
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 200;

  res.setHeader("x-powered-by", "Servlet/3.0");
  res.setHeader("content-type", "application/json");
  res.setHeader("content-length", "2");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=d4gIzHhlt1NP7O56ow8NCQNHFOgrK6SGq4lqyjSnliChRLjtUvXAEZtnbTZKkySbkr3jwvR3vhA8tSqgSjQPhZ9C2ABjpb413Ry9imnm0HmynbnYoqo4N1kiFFt+S4dcApQ6VhYLC1SOwXJqZJ4rLVqCUI6ZtGwGv+ktryPB/FM23JIy7BZFxY+AFuJcpHNOD7rrWxwlkZYR+5PJF9Kcjxa6+xx+o6r0IOclrw49wCs/sL6vs0DIlFpbIinfcgDPGzRA5XYiqlEqyr4Zsedzywi8TZHDI9/4b463RuCveHKuGhsrVzUCj1PHsgKFDCBe+jrriVrFR9Y2RCnBUEbnaGmYXUWvythSXwpZBonUPlclP5tRwj5NThQ/w9ihawib+kV2/GvTTBVWU3BAlPqjFhn4Uch2UWkKKgoff1GIu45MrOCRfNpt68GP/3kuk3ALovXN+5fGv/Pp+pIg4i7alLb013tvh1p9nklTUxbmZycNWbCn6tGkwzZcxcXYsaNNcGlGychLS+vM0kJ6B/Rr2So0HNsuTxijMW8SXHl7Z6gjmn3FgrdGJUULcymyOlMZ5FKvcr7wYjnO3m1Y0U/mMgcjV440N6B0vr/rW9Dy23h8pfAtemORafsNLm3G4NJ+xjrslrYiww4L1QGiO8wF3Yxnp8LIjC+LWRwFL3gZAoGc14gGsAAZv2KiPce2td0G; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Tue, 27 Sep 2016 14:33:06 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W10=", "base64"));
  res.end();

  return __filename;
};
