var path = require("path");

/**
 * GET /WSRR/7.5/Content/a6b949a6-8044-44fb.a689.2ca5002c89a0
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
  res.setHeader("content-length", "351");
  res.setHeader("content-disposition", "attachment; filename=address.txt");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=fSyHwepjJV4TvbWQLSKJASb+/ss7xK2lHJKue8JxgTOBUx1wu8I6zv9CqmkCyGXK412Kd2aYglsmlYRMuw/a9KcEWC9T2oAZLh0j6oQiMu31YyweX5PVzKYLvvf3Rho2cS0QOf0g2KFvlzTrm/mgpcVj+XFzRts/UHe+JTXMQRH+Kmw9/+S7q8BwPlNoOjOf0OD1grAmpM9HSD0hKWhqdb6PwAS8VaiTIr4oszuuYGBasDNIigE2JQ8XFg8VeuH6nT1FQm/e5CpdbtGzkcIHeflhalY5c/kzNH9rcSdO17MxmR+9XCtTZcXQ9VcLOuS7f6/lFi8ku1eVKodbTMpSQIq4gkS1e3r3IigPY9pECjLsrolQ+3Bd7KbX5ut0lF3Ig50Wu5XYWVmkl0SdA48F33WkmVq2SpWTDiv/uCn61Bne3xgnOF45j6AkJooQ2gUxZpStZvcOoK76/H2+yUkjhLKQwqPhtLN1lo/MMF4kMDADVpjvEJgZNQKiI896d9B6hlU8yRDu+q4HDKt4BlgNnMOoSAvw7+KUa+YYf974Ox1s0SYIuCJUSq37RRAH64kAuE97r53JQAxjrNgLgMPm1PhGyhVojDrCrtJ+yOhMtbVZkiKL0TJtu3TWPDCNGhevdl1gXnwD6gn4Hf37Zmd3KDTp4L0qEip3sVkBh3ug5gq6WxzcIYEsuyI0/ZwvDpXx; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Wed, 07 Dec 2016 14:00:53 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("Rm9yIGEgbGlzdCBvZiBhZGRyZXNzZXMsIGludm9rZSBvbjoNCg0KaHR0cHM6Ly8tLXNlcnZlci0tL0FkZHJlc3Nlcy9qYXhycy9hZGRyZXNzZXMvDQoNCk91dHB1dCBpcyBhbiBhcnJheSB3aXRoIGVhY2ggZW50cnkgYW4gYWRkcmVzcy4NCg0KDQpGb3IgYW4gaW5kaXZpZHVhbCBhZGRyZXNzLCAsIGludm9rZSBvbjoNCg0KaHR0cHM6Ly8tLXNlcnZlci0tL0FkZHJlc3Nlcy9qYXhycy9hZGRyZXNzZXMvLS1pbmRleC0tDQoNCldoZXJlIC0taW5kZXgtLSBpcyBmcm9tIDAgdG8gNi4NCg0KT3V0cHV0IGlzIGEgSlNPTiBvYmplY3Qgd2l0aCBwcm9wZXJ0eSAiYWRkcmVzcyIgYW5kIHZhbHVlIG9mIHRoZSBhZGRyZXNzLg0K", "base64"));
  res.end();

  return __filename;
};
