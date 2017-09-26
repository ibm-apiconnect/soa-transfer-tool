var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=/WSRR/GenericObject[@bsrURI='9cb8619c-5eea-4ac5.b6a7.fe64e7fea733']/ale63_artifacts(.)&p1=bsrURI&p2=name
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
  res.setHeader("set-cookie", ["LtpaToken2=mOwgTPKSbfAf0K5FgPvYK8vwK6xMVw/0SP9UKeK7vvhXdi5GWRDUCwwXUQIIPWFVtlsWOxiwHwT6J08kD4w905a/yMQF3zgGc2lVi69PsHW1873MYgU1xgfhXD2eyYSLCmnBSupOP1hgzLGs6EHRtZXXnN3VibOTpuetoxBcqptbh8lMsEDSgD8fNcqvwP304Tb8qWD01RkG1cx8e4QP4t6ZWPdSKXLCO/g2pLMQ6keTGbptmhkUzEWxnVJ6G0zqYjaJGwPPUEPmVfQl+f3IQMXm1fFFyyXZx1zqRA5aACeHPUMAr/U4MEcA556oSQL2H5H/ikaokERynffkkYYSXXADkOgvG0QW7HevoKf9Rnz7lMXP9NPRdYOCovvtXXlWa31T24xy2JImpGLmeFZSms/EOz3qcVFd33uvMRIw1Qz//YuBiEdYWYJfEFsQ77x3H/3fTypz3Js9offiPXtfPFWmYR0uXfN7ycmfOpIb13FucSZLzJFykZzYqCTvYnIe/YgcxnlTBz/8cGAoG1pJFo94fvcDpkoyE8ohnpZUh8bAUq3NHrVqxiGCyAaGdQcm5ZAOq5aCvGN6z312XknyZnWSp+styWVNXY1DUwtLSAB9DQB8EUHreJ03SC/VUEIBc+svCfc2HQbeLMnUg0uoL5d47yqOFTke6RhEyJAGjiCW2CJ76m+lBCMxAe/3S279; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 19 Sep 2016 09:34:10 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiNWM4ZWQ0NWMtZmQ0Ny00NzY3LjhiMzcuOTM2ZTgyOTMzNzhlIiwibmFtZSI6ImJzclVSSSJ9LHsidmFsdWUiOiJlY2hvLmpzb24iLCJuYW1lIjoibmFtZSJ9XSxbeyJ2YWx1ZSI6IjA5ZDMzYjA5LTc5OTgtNDg2NS5iNjcxLmQ4OTlhMmQ4NzFjZCIsIm5hbWUiOiJic3JVUkkifSx7InZhbHVlIjoiQ2F0YWxvZyBTZWFyY2hfMS4wLjAueWFtbCIsIm5hbWUiOiJuYW1lIn1dXQ==", "base64"));
  res.end();

  return __filename;
};
