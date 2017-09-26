var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='f13602f1-4e6a-4a1b.9240.2b397a2b407f' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService')]/gep63_charter(.)&p1=bsrURI&p2=name
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
  res.setHeader("set-cookie", ["LtpaToken2=PRuhYDoNbqVwr/9rIXDdeiKq3IHEDRrZ0IM8p3anGUZVe0rLNhusHDvZf02mqV4MgrM+CfUecN4Q36ixl7l8y+tAKutPTZVEoKx8pu4XzLT/JTdBr+QT5cNLqKQnmPzZSvEoOir6BPvkzu1e8KdMU/p44m1EuGeBDHvSAsuoWNGFO+EDVKD7DK0mY+zJyZzyZUxUdUfsKAyw3gugRrL8bD+GXFjzWJiKBt4pOI7vQT0zYqvfEPlGKqowRoOzMuPHXqgBs3Vd3Kavif2kYKjmOcj/d6aUHDbGt7TLOukYIzOsgGMmtWuRHmEDR+MQgyYT6EASfvPNIl3P9ehpEDq08AP81s2jcUQAHMYQtsQGSGGlzYeXtdAjjyXo7D+iSQAx8cv1nZz/ibSs5Von2c1Pv4T0CSYOhC1cHSMZjfjpZpiJ3GOfi5A/XlyqnYCMX+bqFNE03Z4KsR4iuiL7wYR4iXDE8eNwNbb7U2QpHtzqTCubfwu1Oq25VLfmyqd4eSqXGZ/3A0kTxptsvAVULYp1H9KqdrjRxqGuyojEe0ykK6m3VbVl98PNeRWUfJ5LMzWeghHmlPv3F15BXpxOcLFCNehtorINYxXtyTnoL72GMX4jIyP/PvqK0VyxTs9zDXwRynH41XYEBr4cZ05+8b3ihd0EicptygYiVa8EoyHHEsW7Vs7eIiq5Ex/lfzYyToBe; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 19 Sep 2016 10:38:43 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiNTI0NTZkNTItYTYwOC00ODY3LmI3YmUuOWIwYTMzOWJiZTExIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJDYXRhbG9nU2VhcmNoQ2hhcnRlci5vZHQiLCJuYW1lIjoibmFtZSJ9XV0=", "base64"));
  res.end();

  return __filename;
};
