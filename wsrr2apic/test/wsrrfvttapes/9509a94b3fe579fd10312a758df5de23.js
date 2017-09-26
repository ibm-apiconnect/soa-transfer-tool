var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='2919fd29-fc17-4729.bae4.0b95690be4f9' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#BusinessService')]/ale63_charter(.)&p1=bsrURI&p2=name
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
  res.setHeader("set-cookie", ["LtpaToken2=CGXm+dqkgZnljOEq4pDQ4RCFkbFyduYZU7miFlDeJ1fV5QgeqMeumXK1Vw0b+4WNOY6UZmo4la4my2+Gn4Ln/wSQAfU5DqgWJMSV0Zo8Bs3tEBp+I1r+1dCZShDP2RAiyW7x5dUdecm0eF9O07TcXF8X2I1eWYscvVnPkiL24T4klz5rdSj+EOZo4/U+T3TV3Fi6OL8rELUteXZmvGUs6YMbXKd35V9VU+iefsU+kP3K0GJVdO+27iObNMKg+w00Yk5ZK8C3tFIWrAYZxUfIG2GD0cug30riAHfCSEKIzqDozw2InipGYNfwIEnGNkoIoWPeU/fxL9kEU9QbzZrlh23+IeBeNmQE9q4G6B2cxLfIrGsYBjmZp6PgjCfC7qSpZ/37hSOmNhID54etT5AAe75tGDFbN1YtVdxdcVYPndKNfAADoKP9360FqlY55cApDPT1A2KS/fb//Brb7Gn7z1QXQg1DU42lwsGpRg0i3QpLhBvuylfM0ZiflPjwiuYkV0BeZXGdaMvBRnLuAQ/9bRoA1ts3ZonHIJoRGNgdR0bhpqWQ/Z6YLKNmpHjw8RcqWEokXO8zUdwPKZiqF5w1/fLpo1jtKG6oRjdzZgvD2ZIg3j7quQQufmmb348gcrjI0QzMJQYZ4tCU9NpOyuebnp+n8rIdfQIW377MnQpdEE3/0o7c9JkRi5mDiS1I9jBu; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 19 Sep 2016 10:20:58 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W10=", "base64"));
  res.end();

  return __filename;
};
