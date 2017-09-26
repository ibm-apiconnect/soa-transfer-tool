var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='ec93aeec-3c3c-4cca.8cef.b6f7c6b6efa4']/gep63_providedRESTServices(.)/rest80_serviceInterface(.)/rest80_definitionDocument(.)&p1=bsrURI&p2=_sdoType&p3=name
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
  res.setHeader("content-length", "152");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=5sQlzsjjMlDqyR5gkdICCk1oKT67j/PZx8S/sN88MZExkkZy7EHkgBR+IgQCGPHwf0CNml/BaXaU32U3PeuFpFM97GjHxDNewA0gKch5G7cCqpCr5W3DnoViSovJd6CDCkEa56wJwwx9LMrOTXTnRJuhAauDL+CV7WudDIM+97fjPNn1BsOMJ1/y21ogD7JAWk2dnSnAsibHq46RYQbdPCwvCcSv7Wuu0FXPl6pyrtrIReDjHrHLCebHcanId25Gz8GoGJCt/UPhOrz09nhounH0deGh/ucazZyyq8hacvpUMeOkNvT+HeID4lo33ajGZZKnHt5hfzytxi/jqYvlNaF2ZIrzS5VN+wnKRbEGgXjXkqOQjp1e5WpsXuV0nmPAp1yWLx7bdLl//KFy4jfBxBCcmUBcjiysHkByT+pGET+k2VBwG6ufooWqgrtp0En1XRoXVTurTjvm9dY2ErltuCwxn/wlzTRLjbNF7kyDrgmHhS/m6EXqOL0gA3s3hLz5zMNVdowaFJwP95fK2vdCOG24bz4DDvoZH0zA38MUufff6I+O+8D9W4VfZi1PskOprv5PxrryIR/QeR2efYxT3dECA1DctwqF0WMwaTJh1gpCNJj2qNk9wCbIDFjHs1/f/m0rvGEJOxFIJvYFyNpzOkEE083QalnODB+lK48p3iTdUWBcZ5rt0ikCIT4CyVUO; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 05 Dec 2016 09:42:42 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiYTZiOTQ5YTYtODA0NC00NGZiLmE2ODkuMmNhNTAwMmM4OWEwIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJHZW5lcmljRG9jdW1lbnQiLCJuYW1lIjoiX3Nkb1R5cGUifSx7InZhbHVlIjoiYWRkcmVzcy50eHQiLCJuYW1lIjoibmFtZSJ9XV0=", "base64"));
  res.end();

  return __filename;
};
