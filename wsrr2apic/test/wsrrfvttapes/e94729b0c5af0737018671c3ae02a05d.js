
var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/PropertyQuery?query=//GenericObject[@bsrURI='aa867aaa-c596-46a4.83b5.affba8afb525']&p1=name&p2=bsrURI
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
  res.setHeader("content-length", "108");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=L1c93N/AFTGmi3544K81Lb/lovqNQArlytnyQYkMVUF3jo41smSxGK+W8m5acmCdEkgrW5XBZ18YMHoAEezGqpJI3rotMpydT9xWVCYU5BuW0Dxi3r62ZqR6Se0Qy/tl8+lhHRWIaC6qnmblAFMRUWylXhv/dsXoHy3m2pbeAKM11DufQ+CirjD/QC/9V3rzwe/eYWuxVk9gFziUc98m//5jF1/iqbL80lbLUyxRq3Dn5bAaf1bzfWVdWsWdI1pe3jtsBOYmbi2/XJIXjfVFe/0pNaATZdfaVgmuGht8n8lQZEoAeBCN8mRLimuP9gzfWol8XFRgHl7ynj3yfys3UYr4YznzML4zJypBp4bi4P/5f4BgQSCpKRsjZVJUS3dkuLyysJ+RWLAEubqJzrzhAk4MNaAesayCg34O3SlLwJotPMPEm7FMMCoGd6S4Th9WM9yZQJ3be1yFey96zjXM8yzp+Xek4CX3DzWAF8fd40u310gzVRXbFirEBsqH7l6E4qgbD++/7bXmG50xDVsysomrSLxyaVAw2L/WgcEPnSsKGWDkvNTw4ns7Ux7PQy86VZme0POArNF7Y/pro25JiftLJv001a5YzTEvGmpTmvV4nrS6yzs1Wi8Ejz+bzYXKB2GhD+o3VMrYVkza2JVUW+YIC4CqrH/veIx82jSa++rJVzhidd1VoiKVsurIK8uU; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Mon, 01 Aug 2016 08:43:45 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W1t7InZhbHVlIjoiQmFzaWMgU2VydmljZSIsIm5hbWUiOiJuYW1lIn0seyJ2YWx1ZSI6ImFhODY3YWFhLWM1OTYtNDZhNC44M2I1LmFmZmJhOGFmYjUyNSIsIm5hbWUiOiJic3JVUkkifV1d", "base64"));
  res.end();

  return __filename;
};
