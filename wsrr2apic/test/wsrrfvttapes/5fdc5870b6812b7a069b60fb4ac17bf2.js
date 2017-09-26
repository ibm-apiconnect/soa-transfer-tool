var path = require("path");

/**
 * GET /WSRR/7.5/Content/09d33b09-7998-4865.b671.d899a2d871cd
 *
 * accept: application/json
 * host: srb84a.hursley.ibm.com:9443
 * authorization: Basic dXNlcjp1c2Vy
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 200;

  res.setHeader("x-powered-by", "Servlet/3.0");
  res.setHeader("expires", "-1");
  res.setHeader("content-type", "application/octet-stream");
  res.setHeader("content-length", "464");
  res.setHeader("content-disposition", "attachment; filename=Catalog+Search_1.0.0.yaml");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=3o3rZ9quAmAzwVVZbXZq+j/y6karn/llw3rG36nyTZoeRrR11oA6TGPlE6+fgkNbYWzxnvKutcTFG1SWaAj9zw2n0sI/ognWLLelwtN6Fgbu/UbFhx/PiqOnvhyJeg25v7+U7VXn6WXEVspV6n/as7qEd98U/yCjuy3wpSRiTQHpi/4U5tMu67cOaQqrDHM60jdW4Ax4xLmVpoxlmS2rLEdiEPBK54bjDuPGzGdm3q9+Sc2zpkLolvDxoIMw6Ix9Jn34GBkByUInnGXUu9KnTdPqhw8SWtBhce042AmEGtz3Ro6jtu0UB/iJtnarBf82rYEEpkPSHCEoeLpRuugub6STiyR+rvw+CYFYCk0m06kdEC2GYDWrZypd5KXJY1OGLugGiSoOnBuKonFa0SkuX4DevCAM2xyQz4+kM1BWiJr3gJ23c4jMlvoOCUZlb06bU/pAaH8PHvIXZs6k41qRRB5n7BBtGYtrLATqKnsHRqDIGY1jZGF2/ibNMe+lf+PpaUCCHNWMvbGeKhsrm4aNwyOowc2M5fA+l+XtrLiXJq4wmoG1btxWzjLU2W2wPVNGcbwmqNuuBDOmFNjMS+2rc7jt0KQFs/YGQheLCOYlm0UvoPx+GbPMx/sDy9Hn68IjTt6XKluMkCB1CbOoD8oyfKcc4SMPEcmiodr7tWXyopIHh0m5yS8JcGxhxpz3r6KT; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Wed, 14 Sep 2016 13:28:24 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("LS0tCnN3YWdnZXI6ICIyLjAiCmluZm86CiAgdmVyc2lvbjogIjEuMC4wIgogIHRpdGxlOiAiQ2F0YWxvZyBTZWFyY2giCiAgZGVzY3JpcHRpb246ICJDYXRhbG9nIFNlYXJjaGluZyIKYmFzZVBhdGg6ICIvQ2F0YWxvZ1NlYXJjaC9qYXhycyIKcGF0aHM6CiAgL2NhdGFsb2cve2lkfS86CiAgICBnZXQ6CiAgICAgIHJlc3BvbnNlczoKICAgICAgICAyMDA6CiAgICAgICAgICBkZXNjcmlwdGlvbjogIjIwMCBPSyIKICAgICAgc2VjdXJpdHk6IFtdCiAgICBwYXJhbWV0ZXJzOgogICAgLSBuYW1lOiAiaWQiCiAgICAgIHR5cGU6ICJzdHJpbmciCiAgICAgIHJlcXVpcmVkOiB0cnVlCiAgICAgIGluOiAicGF0aCIKICAgICAgZGVzY3JpcHRpb246ICJjYXRhbG9nIGl0ZW0gaWRlbnRpZmllciIKc2VjdXJpdHlEZWZpbml0aW9uczoge30Kc2NoZW1lczoKLSAiaHR0cHMiCnByb2R1Y2VzOgotICJhcHBsaWNhdGlvbi9qc29uIgo=", "base64"));
  res.end();

  return __filename;
};
