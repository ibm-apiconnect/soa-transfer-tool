var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='f13602f1-4e6a-4a1b.9240.2b397a2b407f']/ale63_artifacts(.)&p1=bsrURI&p2=name
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
  res.setHeader("content-length", "119");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=rKw5Dcn7ayZuXPguLxbOfRXM//pnPa8HR+vdk+QLAM42Et0B5H7P9bFr+7n3HWRUpXgjchklmHgb3cdPpzp5v7u/hQJWckEsOtLF2e/f9ua7kJqS6kbEOuaYK6uiuN+0Mdhnj6hX8Eydlvi/290E3pviIHCh4N/yQSLRuIXpBCDpeHXuzqn0kEHnf8GK2PzYSnprIEku5N+3UDc67HXqyBg3dgGIaY9IqU95LVvZK4LmwBhsqopWKnToWqqLo4btafndvGV4IYxDpqZy6kYPDLqHlzm0GTHIjZz8JtqoWau/bPuThJB1u66qg6d+Anb8Lzw1FT8rfuF1ef8FqiqPglo+6GZTf5/hJ59hRpRaZnsJs9xfaZGS7mpoX6ogc4VLn828Z7dWui/hlM8z2ctLXWKnwx665obrMviBEHIrjhIpljSL6kjSJ7pMl1KVadgftCLT2JVqqb+Vyx2AtPgSk2MU3hBgCfQdC3DIyYilvaKonb3yIWnWe8XZYOBKk8qdjeMMDh7PBsXLSbxejR3V9Wi5iGSb2HNQr72cUaPNdMNXYsV5pW3GdEiB7qwCFOjq5qvi6SMbMtmLeOJKI7VxzHUV53zaqyVKud8+4iRPWanrXLSiF479/MaafT7Of56KW+ta1j8koDZhKRfjnUjajCV3z3F3dOj1P3tySWQw3kSUrrI0qQFj61kvovpBEy7h; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 19 Sep 2016 10:02:34 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiNTI0NTZkNTItYTYwOC00ODY3LmI3YmUuOWIwYTMzOWJiZTExIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJDYXRhbG9nU2VhcmNoQ2hhcnRlci5vZHQiLCJuYW1lIjoibmFtZSJ9XV0=", "base64"));
  res.end();

  return __filename;
};
