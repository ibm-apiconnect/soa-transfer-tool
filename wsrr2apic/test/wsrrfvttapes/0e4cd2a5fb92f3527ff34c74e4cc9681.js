var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='738c4773-f50d-4d46.a2e9.3fa5e43fe95f']/gep63_providedRESTServices(.)/rest80_serviceInterface(.)/rest80_definitionDocument(.)&p1=bsrURI&p2=_sdoType&p3=name
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
  res.setHeader("content-length", "603");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=5sQlzsjjMlDqyR5gkdICCk1oKT67j/PZx8S/sN88MZExkkZy7EHkgBR+IgQCGPHwf0CNml/BaXaU32U3PeuFpFM97GjHxDNewA0gKch5G7cCqpCr5W3DnoViSovJd6CDCkEa56wJwwx9LMrOTXTnRJuhAauDL+CV7WudDIM+97fjPNn1BsOMJ1/y21ogD7JAWk2dnSnAsibHq46RYQbdPCwvCcSv7Wuu0FXPl6pyrtrIReDjHrHLCebHcanId25Gz8GoGJCt/UPhOrz09nhounH0deGh/ucazZyyq8hacvpUMeOkNvT+HeID4lo33ajGZZKnHt5hfzytxi/jqYvlNaF2ZIrzS5VN+wnKRbEGgXjXkqOQjp1e5WpsXuV0nmPAp1yWLx7bdLl//KFy4jfBxBCcmUBcjiysHkByT+pGET+k2VBwG6ufooWqgrtp0En1XRoXVTurTjvm9dY2ErltuCwxn/wlzTRLjbNF7kyDrgmHhS/m6EXqOL0gA3s3hLz5zMNVdowaFJwP95fK2vdCOG24bz4DDvoZH0zA38MUufff6I+O+8D9W4VfZi1PskOprv5PxrryIR/QeR2efYxT3dECA1DctwqF0WMwaTJh1gpCNJj2qNk9wCbIDFjHs1/f/m0rvGEJOxFIJvYFyNpzOkEE083QalnODB+lK48p3iTdUWBcZ5rt0ikCIT4CyVUO; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 05 Dec 2016 09:42:42 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiNzI2NmE0NzItMTJhNS00NTI4LmE2MTEuMzRlOWViMzQxMThlIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJHZW5lcmljRG9jdW1lbnQiLCJuYW1lIjoiX3Nkb1R5cGUifSx7InZhbHVlIjoidHJhY2UuanNvbiIsIm5hbWUiOiJuYW1lIn1dLFt7InZhbHVlIjoiNWM4ZWQ0NWMtZmQ0Ny00NzY3LjhiMzcuOTM2ZTgyOTMzNzhlIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJHZW5lcmljRG9jdW1lbnQiLCJuYW1lIjoiX3Nkb1R5cGUifSx7InZhbHVlIjoiZWNoby5qc29uIiwibmFtZSI6Im5hbWUifV0sW3sidmFsdWUiOiIyNDkyZmYyNC01MTVhLTRhNzIuOTk3NS5kNzQ2ODlkNzc1OTciLCJuYW1lIjoiYnNyVVJJIn0seyJ2YWx1ZSI6IkdlbmVyaWNEb2N1bWVudCIsIm5hbWUiOiJfc2RvVHlwZSJ9LHsidmFsdWUiOiJ0ZXN0LnR4dCIsIm5hbWUiOiJuYW1lIn1dLFt7InZhbHVlIjoiZWRjMjY0ZWQtZGRhOS00OTBjLjlmZjguNjI2MGU2NjJmOGQ2IiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJHZW5lcmljRG9jdW1lbnQiLCJuYW1lIjoiX3Nkb1R5cGUifSx7InZhbHVlIjoibm90c3dhZ2dlci55YW1sIiwibmFtZSI6Im5hbWUifV1d", "base64"));
  res.end();

  return __filename;
};
