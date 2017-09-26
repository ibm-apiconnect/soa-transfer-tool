var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='f13602f1-4e6a-4a1b.9240.2b397a2b407f']/gep63_charter(.)&p1=bsrURI&p2=name
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
  res.setHeader("set-cookie", ["LtpaToken2=EJQebyd2MoqSx7VB/8J4exVKeic+pK/f3T43TVrL4AZHOTG9GIWUC10w1tSfmWxFsYAQx3lC1L0A5QNn+PlF14lYs5rXIjkQaaf8rfHT5y/a0nqzbhkuwgd7w6sjdUlAnGrsdUFZzgQzRoxoootmWWiB8FHS1gIgvThGxyFU5ZiFEPIuJxxf/3P4W+kva+vT4KmkQPH+OW5zp/8NNT93WHNck3MvsCt8ki9KPK0PVv0QCGe/n2AjbCNrftU4lGAvl5sLuZiCgFlzKDxuRCB8B0WaEL7O87xEWSkhHYTEt1IJOFW2VwCClftgNKxgUzYpQsSp492zA4juI9hRNgaAcjM1475CiTpv2aaFpQQXIU9h/mugaKN4rUVZY3odWFUzWd/FobMDoWNjIVTM4WhgrCqboQngDZ7Z4+oNVTPKpePN+8FWJatK8v4B7KB3xwpA8xjSwzjs/ROul532MIlHQm16uM6ZfimM5lsTOjYhtwlGBksyZTjvld/ELQJArlKM/r6f8pH4ZaXBOBWdJFzTg4YuhduXyqG/vl6dMhwlqtY/2Tl3zk5NhOpeQsPl25+gpctU8+BWrFrNVfpDaX6Y2gKGycwbiPIo3gsKUoWXjyXYeZpz09IJAADYfBpttmd6VJWqY3+Ngca3uXwz0UisD/3M5Dbad8RKQsqVxE9BY4bUUg46loJzWfjoaH5lW7CM; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 05 Dec 2016 11:34:52 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiNTI0NTZkNTItYTYwOC00ODY3LmI3YmUuOWIwYTMzOWJiZTExIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJDYXRhbG9nU2VhcmNoQ2hhcnRlci5vZHQiLCJuYW1lIjoibmFtZSJ9XV0=", "base64"));
  res.end();

  return __filename;
};
