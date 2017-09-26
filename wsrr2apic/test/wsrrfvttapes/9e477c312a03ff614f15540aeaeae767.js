var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733' and classifiedByAnyOf(.,'http://www.ibm.com/xmlns/prod/serviceregistry/profile/v6r3/GovernanceEnablementModel#ServiceVersion')]/ale63_artifacts(.)&p1=bsrURI&p2=name
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
  res.setHeader("content-length", "223");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=53+ygarzAzOKyNvXje0BIDXYOJvfThMsCVWFtccon/Civa1+1hDd9c6oCelp/lkbwyJWDkmQmc0r859rS9LtT7KRTw3cBwm+/iZsLHUZeuhEuXp374URrsz1gzbHA+5W3j1BPIctKHE1YolzXr4IhMqSqmmBIJkzMrBDchLOvwsitOeqltEXE+3GMB4bb4LEguInAoAiIoxRBNfc+xD+aMBKUDI/13uESFoeXzFwRugfaecicv9ZIoWq8Idy9rhtYfWhWzCRZh8GbGqyw4+yfk6AyR7DMw+7AokVfw5Wf+fNzhXDD9KJa2WD/nC95n1CsCjJtk6jgxf2pMTGegISIK4CFHmMtRbxBAs5DTdbsjT9ykUbGviHh/moFJg3ZKZA4+UDNCwXHtf29vDsaNLTym+ZygSsKfdR0FNNNG8KLzLZDGb/MTqq/NOg66Fd0VzXpVlvNWioKP9VIKqbLIIgfImNXP4q8SLBrRnn5kIJj6Op3uIr+mtrThnPeEEJZLsWdohCR8hkFWDzKJLoYJlrwu6tV1APvlbgoF6j2eSZI8LNTavz7cNvvk4Bq1sAD8QwmSY28yZJOMFF3a5GMLGUiK+AJetsh6xq9DPhdhBAb+icNfQCaoj3LQQ4r9ya5oD5PsB/mvePZmWrbiFUz6XF6Q6Xn+4JRUJuvXzT9PEQrjlDmvAt7FXYL6acpZMWjks/; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Fri, 16 Sep 2016 13:12:15 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiNWM4ZWQ0NWMtZmQ0Ny00NzY3LjhiMzcuOTM2ZTgyOTMzNzhlIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJlY2hvLmpzb24iLCJuYW1lIjoibmFtZSJ9XSxbeyJ2YWx1ZSI6IjA5ZDMzYjA5LTc5OTgtNDg2NS5iNjcxLmQ4OTlhMmQ4NzFjZCIsIm5hbWUiOiJic3JVUkkifSx7InZhbHVlIjoiQ2F0YWxvZyBTZWFyY2hfMS4wLjAueWFtbCIsIm5hbWUiOiJuYW1lIn1dXQ==", "base64"));
  res.end();

  return __filename;
};
